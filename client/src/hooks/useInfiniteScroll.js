import { useEffect, useRef, useState } from "react";

export function useInfiniteScroll({ onLoadMore, hasMore, threshold = 0.1 }) {
  const sentinelRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      async (entries) => {
        if (entries[0].isIntersecting && hasMore && !isLoading) {
          setIsLoading(true);
          await onLoadMore();
          setIsLoading(false);
        }
      },
      { threshold }
    );

    if (sentinelRef.current) observer.observe(sentinelRef.current);
    return () => observer.disconnect();
  }, [hasMore, isLoading, onLoadMore, threshold]);

  return { sentinelRef, isLoading };
}

export default useInfiniteScroll;

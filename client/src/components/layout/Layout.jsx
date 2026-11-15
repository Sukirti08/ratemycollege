import React from 'react';
import Navbar from './Navbar';
import BottomNav from './BottomNav';
import Toast from '../ui/Toast';
import { useToastStore } from '../../store/toastStore';

export default function Layout({ children }) {
  const { toasts, removeToast } = useToastStore();

  return (
    <div className="min-h-screen bg-surface flex flex-col">
      <Navbar />
      {import.meta.env.VITE_DEMO_DATA === 'true' && (
        <p className="bg-indigo-50 px-4 py-2 text-center text-sm text-indigo-900">
          Portfolio demo. College reviews, ratings and placements shown here include sample data.
        </p>
      )}
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

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
      <main className="flex-1 pb-20 md:pb-0">
        {children}
      </main>
      <BottomNav />
      <Toast toasts={toasts} removeToast={removeToast} />
    </div>
  );
}

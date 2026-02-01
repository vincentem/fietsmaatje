"use client";

import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { useAuth } from '@/lib/auth-context';

interface NavItem {
  label: string;
  href: string;
  icon?: ReactNode;
}

interface SimpleNavProps {
  appName?: string;
  items: NavItem[];
  onLogout?: () => void;
}

export function SimpleNav({ appName = 'Fietsmaatje', items, onLogout }: SimpleNavProps) {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const trackingNotifications = items.some((item) => item.href === '/volunteer/notifications');

  useEffect(() => {
    if (!token || !trackingNotifications) {
      setUnreadCount(0);
      return;
    }

    let isMounted = true;

    const fetchUnread = async () => {
      if (!token) return;
      try {
        const response = await fetch('/api/user-notifications?status=unread&limit=100', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (!response.ok) return;
        const data = await response.json();
        if (isMounted) {
          setUnreadCount(Array.isArray(data) ? data.length : 0);
        }
      } catch (err) {
        console.error('Failed to load unread notifications', err);
      }
    };

    const handleRefresh = (event: Event) => {
      const detail = (event as CustomEvent<{ unread?: number }>).detail;
      if (typeof detail?.unread === 'number') {
        setUnreadCount(detail.unread);
      } else {
        fetchUnread();
      }
    };

    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        fetchUnread();
      }
    };

    fetchUnread();
    window.addEventListener('notifications:refresh' as any, handleRefresh);
    document.addEventListener('visibilitychange', handleVisibility);
    const interval = window.setInterval(fetchUnread, 60_000);

    return () => {
      isMounted = false;
      window.removeEventListener('notifications:refresh' as any, handleRefresh);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.clearInterval(interval);
    };
  }, [token, trackingNotifications]);

  const hasUnread = trackingNotifications && unreadCount > 0;
  const notificationsBadge = unreadCount > 9 ? '!' : unreadCount.toString();

  const handleLogout = () => {
    logout();
    if (onLogout) onLogout();
    router.push('/');
  };

  return (
    <>
      {/* Mobile Top Bar */}
      <nav className="md:hidden sticky top-0 z-50 border-b border-white/10 bg-blue-950/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
        <div className="flex items-center justify-between px-4 py-3">
          <Link href="/" className="text-lg font-semibold text-white drop-shadow-sm">
            {appName}
          </Link>
          {user && (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen((open) => !open)}
                className="text-sm font-semibold text-white/90 transition-colors px-3 py-2 rounded-lg hover:bg-white/10"
                aria-haspopup="menu"
                aria-expanded={isUserMenuOpen}
              >
                {user.name}
              </button>
              {isUserMenuOpen && (
                <div
                  className="absolute right-0 top-full mt-2 w-48 rounded-xl border border-white/10 bg-blue-950/80 text-white shadow-[0_20px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl"
                  role="menu"
                >
                  <Link
                    href="/volunteer/account"
                    className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Account
                  </Link>
                  <Link
                    href="/volunteer/stats"
                    className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Statistieken
                  </Link>
                  <Link
                    href="/volunteer/balance"
                    className="block px-4 py-2 text-sm text-white/80 hover:bg-white/10"
                    role="menuitem"
                    onClick={() => setIsUserMenuOpen(false)}
                  >
                    Saldo
                  </Link>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-4 py-2 text-sm text-rose-300 hover:bg-white/10"
                    role="menuitem"
                  >
                    Uitloggen
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Desktop Navigation */}
      <nav className="hidden md:block sticky top-0 z-50 border-b border-white/10 bg-blue-950/70 backdrop-blur-xl shadow-[0_20px_60px_rgba(2,6,23,0.45)]">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <Link href="/" className="text-2xl font-semibold text-white drop-shadow-sm">
              {appName}
            </Link>

            <div className="flex items-center gap-6">
              <div className="flex gap-2 rounded-full bg-blue-900/40 p-1 border border-white/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.12)]">
                {items.map((item) => {
                  const isActive = pathname === item.href;
                  const showBadge = hasUnread && item.href === '/volunteer/notifications';
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group flex items-center gap-2 text-sm font-semibold transition-colors py-2 px-4 rounded-full ${
                        isActive
                          ? 'text-cyan-100 bg-cyan-400/10 shadow-[inset_0_0_0_1px_rgba(103,232,249,0.35)]'
                          : 'text-white/75 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      {item.icon && (
                        <span
                          className={typeof item.icon === 'string'
                            ? 'emoji-icon'
                            : `inline-flex rounded-full p-1 ${
                                isActive ? 'bg-cyan-400/15 text-cyan-100' : 'bg-white/10 text-white/70 group-hover:text-white'
                              }`}
                          aria-hidden
                        >
                          {item.icon}
                        </span>
                      )}
                      <span className="flex items-center gap-2">
                        {item.label}
                        {showBadge && (
                          <span
                            className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[11px] font-bold ${
                              isActive ? 'bg-rose-500 text-white' : 'bg-rose-500/90 text-white'
                            }`}
                            aria-label={
                              notificationsBadge === '!'
                                ? 'Meer dan negen ongelezen berichten'
                                : `${notificationsBadge} ongelezen berichten`
                            }
                          >
                            {notificationsBadge}
                          </span>
                        )}
                      </span>
                    </Link>
                  );
                })}
              </div>

              {user && (
                <div className="relative flex items-center gap-4 border-l border-white/10 pl-4">
                  <button
                    onClick={() => setIsUserMenuOpen((open) => !open)}
                    className="text-sm font-semibold text-white transition-colors py-2 px-4 rounded-full bg-white/10 shadow-sm hover:bg-white/15"
                    aria-haspopup="menu"
                    aria-expanded={isUserMenuOpen}
                  >
                    {user.name}
                  </button>
                  {isUserMenuOpen && (
                    <div
                      className="absolute right-0 top-full mt-2 w-48 rounded-2xl border border-white/10 bg-blue-950/90 text-white shadow-[0_20px_60px_rgba(2,6,23,0.55)] backdrop-blur-xl"
                      role="menu"
                    >
                      <Link
                        href="/volunteer/account"
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Account
                      </Link>
                      <Link
                        href="/volunteer/stats"
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Statistieken
                      </Link>
                      <Link
                        href="/volunteer/balance"
                        className="block px-4 py-2 text-sm text-white/90 hover:bg-white/10"
                        role="menuitem"
                        onClick={() => setIsUserMenuOpen(false)}
                      >
                        Saldo
                      </Link>
                      <button
                        onClick={handleLogout}
                        className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                        role="menuitem"
                      >
                        Uitloggen
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navigation - Bottom Bar */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-blue-950/80 border-t border-white/10 backdrop-blur-xl z-50 shadow-[0_-20px_60px_rgba(2,6,23,0.55)]">
        <div className="flex justify-around py-2 px-2">
          {items.map((item) => {
            const isActive = pathname === item.href;
            const showBadge = hasUnread && item.href === '/volunteer/notifications';
            return (
              <Link
                key={item.href}
                href={item.href}
                aria-current={isActive ? 'page' : undefined}
                className={`flex flex-1 flex-col items-center gap-1 rounded-2xl py-2 ${
                  isActive ? 'bg-cyan-400/10 text-cyan-100' : 'text-white/75 hover:text-white'
                }`}
              >
                <div className="relative">
                  {item.icon && (
                    <span
                      className={typeof item.icon === 'string'
                        ? 'text-2xl emoji-icon'
                        : `inline-flex rounded-full p-1 ${isActive ? 'bg-cyan-400/15 text-cyan-100' : 'bg-white/10 text-white/70'}`}
                      aria-hidden
                    >
                      {item.icon}
                    </span>
                  )}
                  {showBadge && (
                    <span
                      className="absolute -top-1 -right-1 inline-flex h-4 min-w-[1rem] items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white"
                      aria-label={
                        notificationsBadge === '!'
                          ? 'Meer dan negen ongelezen berichten'
                          : `${notificationsBadge} ongelezen berichten`
                      }
                    >
                      {notificationsBadge}
                    </span>
                  )}
                </div>
                <span className="text-xs font-semibold text-center">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>

    </>
  );
}

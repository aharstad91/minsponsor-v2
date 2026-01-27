'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Building2, CreditCard, LayoutDashboard, LogOut, Rocket, Users } from 'lucide-react';

type Props = {
  children: React.ReactNode;
  userEmail?: string;
};

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Organisasjoner', href: '/admin/organizations', icon: Building2 },
  { name: 'Økonomi', href: '/admin/finance', icon: CreditCard },
  { name: 'Onboarding', href: '/admin/onboarding', icon: Rocket },
];

export function AdminLayout({ children, userEmail }: Props) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-stone-50">
      {/* Sidebar */}
      <div className="fixed inset-y-0 z-50 flex w-64 flex-col">
        <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-stone-200 bg-white px-6 pb-4">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center">
            <Link href="/admin" className="text-xl font-bold text-stone-900">
              MinSponsor
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex flex-1 flex-col">
            <ul role="list" className="flex flex-1 flex-col gap-y-7">
              <li>
                <ul role="list" className="-mx-2 space-y-1">
                  {navigation.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== '/admin' && pathname.startsWith(item.href));
                    return (
                      <li key={item.name}>
                        <Link
                          href={item.href}
                          className={cn(
                            isActive
                              ? 'bg-stone-100 text-stone-900'
                              : 'text-stone-600 hover:bg-stone-50 hover:text-stone-900',
                            'group flex gap-x-3 rounded-md p-2 text-sm font-semibold leading-6'
                          )}
                        >
                          <item.icon
                            className={cn(
                              isActive
                                ? 'text-stone-900'
                                : 'text-stone-400 group-hover:text-stone-900',
                              'h-5 w-5 shrink-0'
                            )}
                          />
                          {item.name}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>

              {/* User section at bottom */}
              <li className="mt-auto">
                <div className="flex flex-col gap-2 border-t border-stone-200 pt-4">
                  {userEmail && (
                    <div className="flex items-center gap-x-3 px-2">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-stone-200">
                        <Users className="h-4 w-4 text-stone-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-stone-900">
                          Admin
                        </p>
                        <p className="truncate text-xs text-stone-500">
                          {userEmail}
                        </p>
                      </div>
                    </div>
                  )}
                  <form action="/api/auth/signout" method="POST">
                    <button
                      type="submit"
                      className="flex w-full items-center gap-x-3 rounded-md p-2 text-sm font-semibold leading-6 text-stone-600 hover:bg-stone-50 hover:text-stone-900"
                    >
                      <LogOut className="h-5 w-5 shrink-0 text-stone-400" />
                      Logg ut
                    </button>
                  </form>
                </div>
              </li>
            </ul>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="pl-64">
        <main className="py-8">
          <div className="px-8">{children}</div>
        </main>
      </div>
    </div>
  );
}

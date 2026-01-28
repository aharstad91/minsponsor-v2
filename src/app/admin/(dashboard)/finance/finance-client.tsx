'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import type { Transaction, Organization, Subscription } from '@/lib/database.types';

type TransactionWithDetails = Transaction & {
  organization: Pick<Organization, 'id' | 'name'> | null;
  subscription: Pick<Subscription, 'id' | 'sponsor_email' | 'sponsor_name'> | null;
};

type Props = {
  initialTransactions: TransactionWithDetails[];
  totalCount: number;
};

export function FinanceClient({ initialTransactions, totalCount }: Props) {
  const [transactions, setTransactions] = useState(initialTransactions);
  const [total, setTotal] = useState(totalCount);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [filters, setFilters] = useState({
    status: 'all',
    provider: 'all',
  });

  const limit = 50;
  const totalPages = Math.ceil(total / limit);

  const fetchTransactions = async (newPage: number, newFilters: typeof filters) => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: String(newPage),
        limit: String(limit),
        status: newFilters.status,
        provider: newFilters.provider,
      });

      const response = await fetch(`/api/admin/finance?${params}`);
      const data = await response.json();

      if (response.ok) {
        setTransactions(data.transactions);
        setTotal(data.total);
        setPage(newPage);
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    fetchTransactions(1, newFilters);
  };

  const handlePageChange = (newPage: number) => {
    fetchTransactions(newPage, filters);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'succeeded':
        return (
          <span className="inline-block px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
            Vellykket
          </span>
        );
      case 'failed':
        return (
          <span className="inline-block px-2 py-1 bg-red-100 text-red-800 rounded text-xs">
            Feilet
          </span>
        );
      case 'refunded':
        return (
          <span className="inline-block px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs">
            Refundert
          </span>
        );
      case 'pending':
        return (
          <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
            Venter
          </span>
        );
      default:
        return (
          <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
            {status}
          </span>
        );
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden">
      {/* Header with filters */}
      <div className="p-4 border-b flex flex-wrap items-center justify-between gap-4">
        <h2 className="font-semibold">Alle transaksjoner</h2>
        <div className="flex items-center gap-3">
          <Select value={filters.status} onValueChange={(v) => handleFilterChange('status', v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle statuser</SelectItem>
              <SelectItem value="succeeded">Vellykket</SelectItem>
              <SelectItem value="failed">Feilet</SelectItem>
              <SelectItem value="refunded">Refundert</SelectItem>
              <SelectItem value="pending">Venter</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filters.provider} onValueChange={(v) => handleFilterChange('provider', v)}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Provider" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle providere</SelectItem>
              <SelectItem value="vipps">Vipps</SelectItem>
              <SelectItem value="stripe">Stripe</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Table */}
      <div className="overflow-x-auto relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        )}
        <table className="w-full">
          <thead className="bg-stone-50 text-sm">
            <tr>
              <th className="px-4 py-3 text-left font-medium">Sponsor</th>
              <th className="px-4 py-3 text-left font-medium">Organisasjon</th>
              <th className="px-4 py-3 text-right font-medium">Beløp</th>
              <th className="px-4 py-3 text-center font-medium">Provider</th>
              <th className="px-4 py-3 text-center font-medium">Status</th>
              <th className="px-4 py-3 text-left font-medium">Dato</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {transactions.map((tx) => (
              <tr key={tx.id} className="hover:bg-stone-50">
                <td className="px-4 py-3">
                  <div className="font-medium">{tx.subscription?.sponsor_name || 'Ukjent'}</div>
                  <div className="text-sm text-gray-500">{tx.subscription?.sponsor_email}</div>
                </td>
                <td className="px-4 py-3">
                  {tx.organization ? (
                    <Link
                      href={`/admin/org/${tx.organization.id}`}
                      className="hover:underline"
                    >
                      {tx.organization.name}
                    </Link>
                  ) : (
                    <span className="text-gray-400">Ukjent</span>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono">
                  {(tx.amount / 100).toLocaleString('nb-NO')} kr
                </td>
                <td className="px-4 py-3 text-center">
                  <span className={tx.payment_provider === 'vipps' ? 'text-[#FF5B24] font-medium' : 'text-blue-600 font-medium'}>
                    {tx.payment_provider === 'vipps' ? 'Vipps' : 'Stripe'}
                  </span>
                </td>
                <td className="px-4 py-3 text-center">
                  {getStatusBadge(tx.status)}
                </td>
                <td className="px-4 py-3 text-sm text-gray-500">
                  {new Date(tx.created_at).toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </td>
              </tr>
            ))}
            {transactions.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Ingen transaksjoner funnet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="p-4 border-t flex items-center justify-between">
          <div className="text-sm text-gray-500">
            Viser {(page - 1) * limit + 1} - {Math.min(page * limit, total)} av {total}
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1 || loading}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm">
              Side {page} av {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages || loading}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

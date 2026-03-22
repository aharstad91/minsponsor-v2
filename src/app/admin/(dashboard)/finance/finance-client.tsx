'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '@/components/ui/table';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        return <Badge variant="success">Vellykket</Badge>;
      case 'failed':
        return <Badge variant="destructive">Feilet</Badge>;
      case 'refunded':
        return <Badge variant="secondary">Refundert</Badge>;
      case 'pending':
        return <Badge variant="warning">Venter</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <Card>
      {/* Header with filters */}
      <CardHeader className="flex-row items-center justify-between border-b">
        <CardTitle>Alle transaksjoner</CardTitle>
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
      </CardHeader>

      {/* Table */}
      <CardContent className="p-0 relative">
        {loading && (
          <div className="absolute inset-0 bg-white/70 flex items-center justify-center z-10">
            <Loader2 className="h-6 w-6 animate-spin text-stone-400" />
          </div>
        )}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="px-4">Sponsor</TableHead>
              <TableHead className="px-4">Organisasjon</TableHead>
              <TableHead className="px-4 text-right">Beløp</TableHead>
              <TableHead className="px-4 text-center">Provider</TableHead>
              <TableHead className="px-4 text-center">Status</TableHead>
              <TableHead className="px-4">Dato</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell className="px-4 py-3">
                  <div className="font-medium">{tx.subscription?.sponsor_name || 'Ukjent'}</div>
                  <div className="text-sm text-gray-500">{tx.subscription?.sponsor_email}</div>
                </TableCell>
                <TableCell className="px-4 py-3">
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
                </TableCell>
                <TableCell className="px-4 py-3 text-right font-mono">
                  {(tx.amount / 100).toLocaleString('nb-NO')} kr
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  <Badge variant={tx.payment_provider === 'vipps' ? 'warning' : 'default'}>
                    {tx.payment_provider === 'vipps' ? 'Vipps' : 'Stripe'}
                  </Badge>
                </TableCell>
                <TableCell className="px-4 py-3 text-center">
                  {getStatusBadge(tx.status)}
                </TableCell>
                <TableCell className="px-4 py-3 text-sm text-gray-500">
                  {new Date(tx.created_at).toLocaleDateString('nb-NO', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })}
                </TableCell>
              </TableRow>
            ))}
            {transactions.length === 0 && (
              <TableRow>
                <TableCell colSpan={6} className="px-4 py-8 text-center text-gray-500">
                  Ingen transaksjoner funnet
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="px-6 pb-6 flex items-center justify-between border-t pt-4">
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
    </Card>
  );
}

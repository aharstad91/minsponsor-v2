'use client';

import { useState } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Copy, Check, Share2, Users, TrendingUp, Wallet } from 'lucide-react';
import type { Organization, Transaction, Subscription } from '@/lib/database.types';

type ReportData = {
  organization: Organization | { name: string; logo_url: string | null; category: string };
  stats: {
    activeSponsors: number;
    mrr: number;
    allTimeTotal: number;
    allTimePlatformFee?: number;
  };
  byProvider: {
    vipps: { mrr: number; count: number };
    stripe: { mrr: number; count: number };
  };
  byGroup: {
    groupId?: string | null;
    groupName: string;
    mrr: number;
    sponsorCount: number;
  }[];
  recentTransactions: ((Transaction & {
    subscription?: { sponsor_email: string; sponsor_name: string | null } | null;
  }) | {
    amount: number;
    payment_provider: string;
    created_at: string;
  })[];
};

type Props = {
  data: ReportData;
  organizationId?: string;
  isAdmin?: boolean;
};

export function ReportClient({ data, organizationId, isAdmin = false }: Props) {
  const [shareDialogOpen, setShareDialogOpen] = useState(false);
  const [shareUrl, setShareUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    if (!organizationId) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/admin/organizations/${organizationId}/report/share`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ expiresInDays: 30 }),
      });
      const result = await response.json();
      if (response.ok && result.shareUrl) {
        setShareUrl(result.shareUrl);
        setShareDialogOpen(true);
      }
    } catch (error) {
      console.error('Error creating share link:', error);
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            {data.organization.logo_url && (
              <Image
                src={data.organization.logo_url}
                alt={data.organization.name}
                width={64}
                height={64}
                className="rounded-lg object-cover"
              />
            )}
            <div>
              <h1 className="text-2xl font-bold">{data.organization.name}</h1>
              <p className="text-gray-500">Støtterapport</p>
            </div>
          </div>
          {isAdmin && organizationId && (
            <Button onClick={handleShare} disabled={loading}>
              <Share2 className="h-4 w-4 mr-2" />
              {loading ? 'Lager lenke...' : 'Del rapport'}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Users className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-gray-500 text-sm">Aktive sponsorer</span>
          </div>
          <div className="text-3xl font-bold">{data.stats.activeSponsors}</div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <span className="text-gray-500 text-sm">Månedlig inntekt (MRR)</span>
          </div>
          <div className="text-3xl font-bold">
            {(data.stats.mrr / 100).toLocaleString('nb-NO')} kr
          </div>
        </div>
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Wallet className="h-5 w-5 text-purple-600" />
            </div>
            <span className="text-gray-500 text-sm">Totalt innsamlet</span>
          </div>
          <div className="text-3xl font-bold">
            {(data.stats.allTimeTotal / 100).toLocaleString('nb-NO')} kr
          </div>
        </div>
      </div>

      {/* By Provider */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <h2 className="font-semibold mb-4">Per betalingsmetode</h2>
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-[#FF5B24]/10 rounded-lg">
            <div className="text-[#FF5B24] font-medium mb-1">Vipps</div>
            <div className="text-2xl font-bold">
              {(data.byProvider.vipps.mrr / 100).toLocaleString('nb-NO')} kr/mnd
            </div>
            <div className="text-sm text-gray-500">
              {data.byProvider.vipps.count} sponsorer
            </div>
          </div>
          <div className="p-4 bg-blue-50 rounded-lg">
            <div className="text-blue-600 font-medium mb-1">Stripe</div>
            <div className="text-2xl font-bold">
              {(data.byProvider.stripe.mrr / 100).toLocaleString('nb-NO')} kr/mnd
            </div>
            <div className="text-sm text-gray-500">
              {data.byProvider.stripe.count} sponsorer
            </div>
          </div>
        </div>
      </div>

      {/* By Group */}
      {data.byGroup.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h2 className="font-semibold mb-4">Per gruppe/lag</h2>
          <div className="space-y-3">
            {data.byGroup.map((group, index) => (
              <div
                key={group.groupId || `group-${index}`}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div>
                  <div className="font-medium">{group.groupName}</div>
                  <div className="text-sm text-gray-500">
                    {group.sponsorCount} sponsor{group.sponsorCount !== 1 ? 'er' : ''}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold">
                    {(group.mrr / 100).toLocaleString('nb-NO')} kr/mnd
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Transactions */}
      {data.recentTransactions.length > 0 && (
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          <div className="p-4 border-b">
            <h2 className="font-semibold">Siste transaksjoner</h2>
          </div>
          <table className="w-full">
            <thead className="bg-gray-50 text-sm">
              <tr>
                {isAdmin && <th className="px-4 py-3 text-left font-medium">Sponsor</th>}
                <th className="px-4 py-3 text-right font-medium">Beløp</th>
                <th className="px-4 py-3 text-center font-medium">Metode</th>
                <th className="px-4 py-3 text-left font-medium">Dato</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.recentTransactions.map((tx, index) => (
                <tr key={`tx-${index}`} className="hover:bg-gray-50">
                  {isAdmin && 'subscription' in tx && (
                    <td className="px-4 py-3">
                      <div className="font-medium">
                        {tx.subscription?.sponsor_name || 'Ukjent'}
                      </div>
                      <div className="text-sm text-gray-500">
                        {tx.subscription?.sponsor_email}
                      </div>
                    </td>
                  )}
                  <td className="px-4 py-3 text-right font-mono">
                    {(tx.amount / 100).toLocaleString('nb-NO')} kr
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={tx.payment_provider === 'vipps' ? 'text-[#FF5B24]' : 'text-blue-600'}>
                      {tx.payment_provider === 'vipps' ? 'Vipps' : 'Stripe'}
                    </span>
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
            </tbody>
          </table>
        </div>
      )}

      {/* Share Dialog */}
      <Dialog open={shareDialogOpen} onOpenChange={setShareDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Del rapport</DialogTitle>
            <DialogDescription>
              Denne lenken er gyldig i 30 dager og viser ikke sensitive data (e-postadresser)
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={shareUrl}
              readOnly
              className="flex-1 bg-transparent text-sm font-mono truncate outline-none"
            />
            <Button size="sm" variant="outline" onClick={copyToClipboard}>
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShareDialogOpen(false)}>
              Lukk
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

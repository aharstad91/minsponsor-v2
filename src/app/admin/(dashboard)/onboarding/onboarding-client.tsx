'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Check, Copy, ExternalLink, Loader2, CheckCircle, Rocket } from 'lucide-react';
import type { OrganizationWithCounts, OnboardingStatus } from '@/lib/onboarding';

type EnrichedOrg = OrganizationWithCounts & {
  onboardingStatus: OnboardingStatus;
  highestStep: number;
};

type Props = {
  organizations: EnrichedOrg[];
  steps: { step: number; name: string; description: string }[];
};

export function OnboardingClient({ organizations, steps }: Props) {
  const router = useRouter();
  const [filterStep, setFilterStep] = useState<string>('all');
  const [loading, setLoading] = useState<string | null>(null);
  const [stripeDialogOpen, setStripeDialogOpen] = useState(false);
  const [stripeUrl, setStripeUrl] = useState('');
  const [copied, setCopied] = useState(false);

  const filteredOrgs = filterStep === 'all'
    ? organizations
    : organizations.filter((org) => org.highestStep === parseInt(filterStep, 10));

  const handleVerifyTest = async (orgId: string) => {
    setLoading(orgId);
    try {
      const response = await fetch(`/api/admin/onboarding/${orgId}/verify-test`, {
        method: 'POST',
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error verifying test:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleGoLive = async (orgId: string) => {
    setLoading(orgId);
    try {
      const response = await fetch(`/api/admin/onboarding/${orgId}/go-live`, {
        method: 'POST',
      });
      if (response.ok) {
        router.refresh();
      }
    } catch (error) {
      console.error('Error marking go-live:', error);
    } finally {
      setLoading(null);
    }
  };

  const handleGenerateStripeLink = async (orgId: string) => {
    setLoading(orgId);
    try {
      const response = await fetch(`/api/admin/organizations/${orgId}/stripe-link`, {
        method: 'POST',
      });
      const data = await response.json();
      if (response.ok && data.onboardingUrl) {
        setStripeUrl(data.onboardingUrl);
        setStripeDialogOpen(true);
      }
    } catch (error) {
      console.error('Error generating Stripe link:', error);
    } finally {
      setLoading(null);
    }
  };

  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(stripeUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getStepBadge = (step: number) => {
    if (step >= 7) {
      return (
        <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-800 rounded text-xs">
          <CheckCircle className="h-3 w-3" />
          Live
        </span>
      );
    }
    if (step >= 6) {
      return (
        <span className="inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded text-xs">
          Testet
        </span>
      );
    }
    if (step >= 4) {
      return (
        <span className="inline-block px-2 py-1 bg-amber-100 text-amber-800 rounded text-xs">
          Konfigurerer
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-1 bg-gray-100 text-gray-800 rounded text-xs">
        Starter
      </span>
    );
  };

  return (
    <>
      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-4">
        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-500">Filtrer etter steg:</span>
          <Select value={filterStep} onValueChange={setFilterStep}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Alle steg" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Alle steg</SelectItem>
              {steps.map((s) => (
                <SelectItem key={s.step} value={String(s.step)}>
                  {s.step}. {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span className="text-sm text-gray-400">
            Viser {filteredOrgs.length} av {organizations.length}
          </span>
        </div>
      </div>

      {/* Organization Cards */}
      <div className="space-y-4">
        {filteredOrgs.map((org) => (
          <div
            key={org.id}
            className="bg-white rounded-lg shadow-sm p-4 flex items-center justify-between gap-4"
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3">
                <Link
                  href={`/admin/organizations/${org.id}`}
                  className="font-medium hover:underline truncate"
                >
                  {org.name}
                </Link>
                {getStepBadge(org.highestStep)}
              </div>
              <div className="text-sm text-gray-500 mt-1">
                {org.contact_email}
              </div>
              <div className="text-sm text-gray-400 mt-1">
                Neste: {org.onboardingStatus.nextAction}
                {org.onboardingStatus.daysInCurrentStep > 0 && (
                  <span className="ml-2">
                    • {org.onboardingStatus.daysInCurrentStep} dager i dette steget
                  </span>
                )}
              </div>
            </div>

            {/* Payment status */}
            <div className="flex items-center gap-2 text-sm">
              {org.stripe_charges_enabled && (
                <span className="text-blue-600">Stripe ✓</span>
              )}
              {org.vipps_enabled && (
                <span className="text-[#FF5B24]">Vipps ✓</span>
              )}
              {!org.stripe_charges_enabled && !org.vipps_enabled && (
                <span className="text-gray-400">Ingen betaling</span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!org.stripe_account_id && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateStripeLink(org.id)}
                  disabled={loading === org.id}
                >
                  {loading === org.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Stripe-lenke'
                  )}
                </Button>
              )}
              {org.stripe_account_id && !org.stripe_charges_enabled && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleGenerateStripeLink(org.id)}
                  disabled={loading === org.id}
                >
                  {loading === org.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Ny Stripe-lenke'
                  )}
                </Button>
              )}
              {(org.stripe_charges_enabled || org.vipps_enabled) && !org.test_payment_verified_at && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleVerifyTest(org.id)}
                  disabled={loading === org.id}
                >
                  {loading === org.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-1" />
                      Test OK
                    </>
                  )}
                </Button>
              )}
              {org.test_payment_verified_at && !org.went_live_at && (
                <Button
                  size="sm"
                  onClick={() => handleGoLive(org.id)}
                  disabled={loading === org.id}
                >
                  {loading === org.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-1" />
                      Go Live
                    </>
                  )}
                </Button>
              )}
              {org.went_live_at && (
                <Link href={`/stott/${org.slug}`} target="_blank">
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4 mr-1" />
                    Se side
                  </Button>
                </Link>
              )}
            </div>
          </div>
        ))}

        {filteredOrgs.length === 0 && (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center text-gray-500">
            Ingen organisasjoner i dette steget
          </div>
        )}
      </div>

      {/* Stripe Link Dialog */}
      <Dialog open={stripeDialogOpen} onOpenChange={setStripeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Stripe Onboarding-lenke</DialogTitle>
            <DialogDescription>
              Del denne lenken med organisasjonen for å fullføre Stripe-oppsett
            </DialogDescription>
          </DialogHeader>
          <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
            <input
              type="text"
              value={stripeUrl}
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
            <Button variant="outline" onClick={() => setStripeDialogOpen(false)}>
              Lukk
            </Button>
            <a href={stripeUrl} target="_blank" rel="noopener noreferrer">
              <Button>
                <ExternalLink className="h-4 w-4 mr-2" />
                Åpne lenke
              </Button>
            </a>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

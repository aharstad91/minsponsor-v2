'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import type {
  Organization,
  Group,
  Individual,
  PaymentProvider,
} from '@/lib/database.types';
import { getAvailablePaymentMethods } from '@/lib/database.types';
import { calculatePlatformFee, formatAmountPlain } from '@/lib/fees';

type Props = {
  organization: Organization;
  group: Group | null;
  individual: Individual | null;
};

export function CheckoutForm({ organization, group, individual }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [amount, setAmount] = useState(organization.suggested_amounts[1] || 10000);
  const [customAmount, setCustomAmount] = useState('');
  const [interval, setInterval] = useState<'monthly' | 'one_time'>('monthly');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');

  // Payment method - default to Vipps if available
  const availableMethods = getAvailablePaymentMethods(organization);
  const [paymentMethod, setPaymentMethod] = useState<PaymentProvider>(
    availableMethods[0] || 'stripe'
  );

  const recipientName = individual
    ? `${individual.first_name} ${individual.last_name}`
    : group
      ? group.name
      : organization.name;

  const selectedAmount = customAmount ? parseInt(customAmount) * 100 : amount;
  const platformFee = calculatePlatformFee(selectedAmount);
  const totalAmount = selectedAmount + platformFee;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError('');

    // Validate phone for Vipps
    if (paymentMethod === 'vipps' && !phone) {
      setError('Telefonnummer er påkrevd for Vipps');
      setLoading(false);
      return;
    }

    // Vipps only supports monthly subscriptions
    if (paymentMethod === 'vipps' && interval === 'one_time') {
      setError('Vipps støtter kun månedlige betalinger. Velg kort for engangsbetaling.');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          paymentMethod,
          recipient: {
            type: individual ? 'individual' : group ? 'group' : 'organization',
            organizationId: organization.id,
            ...(group && { groupId: group.id }),
            ...(individual && { individualId: individual.id }),
          },
          amount: selectedAmount,
          interval,
          sponsorEmail: email,
          sponsorName: name || undefined,
          sponsorPhone: phone || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Noe gikk galt');
      }

      // Redirect to payment provider
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Noe gikk galt');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />

      <main className="flex-1 p-4">
        <div className="max-w-md mx-auto">
          <form onSubmit={handleSubmit}>
            <Card>
              <CardContent className="p-6 space-y-6">
                <h1 className="text-xl font-bold text-foreground">Støtt {recipientName}</h1>

              {/* Amount selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Velg beløp</Label>
                <RadioGroup
                  value={customAmount ? 'custom' : amount.toString()}
                  onValueChange={(v) => {
                    if (v === 'custom') {
                      setCustomAmount('100');
                    } else {
                      setCustomAmount('');
                      setAmount(parseInt(v));
                    }
                  }}
                >
                  {organization.suggested_amounts.map((a) => (
                    <div key={a} className="flex items-center space-x-2">
                      <RadioGroupItem value={a.toString()} id={`amount-${a}`} />
                      <Label htmlFor={`amount-${a}`} className="cursor-pointer">
                        {a / 100} kr
                      </Label>
                    </div>
                  ))}
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="custom" id="amount-custom" />
                    <Label htmlFor="amount-custom" className="cursor-pointer">
                      Annet beløp
                    </Label>
                  </div>
                </RadioGroup>
                {customAmount && (
                  <Input
                    type="number"
                    min="10"
                    max="100000"
                    value={customAmount}
                    onChange={(e) => setCustomAmount(e.target.value)}
                    placeholder="Beløp i kr"
                  />
                )}
              </div>

              {/* Interval selection */}
              <div className="space-y-3">
                <Label className="text-base font-medium">Hvor ofte?</Label>
                <RadioGroup
                  value={interval}
                  onValueChange={(v) => setInterval(v as 'monthly' | 'one_time')}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="monthly" id="interval-monthly" />
                    <Label htmlFor="interval-monthly" className="cursor-pointer">
                      Månedlig
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="one_time" id="interval-one_time" />
                    <Label htmlFor="interval-one_time" className="cursor-pointer">
                      Engangsbidrag
                    </Label>
                  </div>
                </RadioGroup>
                {paymentMethod === 'vipps' && interval === 'one_time' && (
                  <p className="text-sm text-amber-600">
                    Vipps støtter kun månedlige betalinger. Velg kort for engangsbetaling.
                  </p>
                )}
              </div>

              {/* Payment method selection */}
              {availableMethods.length > 1 && (
                <div className="space-y-3">
                  <Label className="text-base font-medium">Betalingsmetode</Label>
                  <RadioGroup
                    value={paymentMethod}
                    onValueChange={(v) => setPaymentMethod(v as PaymentProvider)}
                  >
                    {organization.vipps_enabled && (
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-accent/20 transition-colors">
                        <RadioGroupItem value="vipps" id="pay-vipps" />
                        <Label
                          htmlFor="pay-vipps"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          <span className="text-[#FF5B24] font-bold">Vipps</span>
                          <span className="text-sm text-muted-foreground">(Anbefalt)</span>
                        </Label>
                      </div>
                    )}
                    {organization.stripe_charges_enabled && (
                      <div className="flex items-center space-x-2 p-3 border border-border rounded-lg hover:bg-accent/20 transition-colors">
                        <RadioGroupItem value="stripe" id="pay-stripe" />
                        <Label
                          htmlFor="pay-stripe"
                          className="flex items-center gap-2 cursor-pointer flex-1"
                        >
                          💳 Kort / Apple Pay
                        </Label>
                      </div>
                    )}
                  </RadioGroup>
                </div>
              )}

              {/* Contact info */}
              <div className="space-y-3">
                <div>
                  <Label htmlFor="email">E-post *</Label>
                  <Input
                    id="email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="din@epost.no"
                  />
                </div>
                {paymentMethod === 'vipps' && (
                  <div>
                    <Label htmlFor="phone">Telefonnummer *</Label>
                    <Input
                      id="phone"
                      type="tel"
                      required
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="47XXXXXXXX"
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      Nummeret du har registrert i Vipps
                    </p>
                  </div>
                )}
                <div>
                  <Label htmlFor="name">Navn (valgfritt)</Label>
                  <Input
                    id="name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ditt navn"
                  />
                </div>
              </div>

              {/* Price breakdown */}
              <div className="bg-accent/20 rounded-lg p-4 space-y-2 text-sm">
                <div className="flex justify-between text-foreground">
                  <span>Støttebeløp</span>
                  <span>{formatAmountPlain(selectedAmount)} kr</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Plattformavgift (10%)</span>
                  <span>{formatAmountPlain(platformFee)} kr</span>
                </div>
                <div className="flex justify-between font-bold border-t border-border pt-2 text-foreground">
                  <span>Totalt{interval === 'monthly' ? '/måned' : ''}</span>
                  <span>{formatAmountPlain(totalAmount)} kr</span>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <Button
                type="submit"
                className="w-full"
                size="lg"
                pill
                disabled={loading || (paymentMethod === 'vipps' && interval === 'one_time')}
              >
                {loading ? 'Laster...' : `Betal ${formatAmountPlain(totalAmount)} kr`}
              </Button>

              <p className="text-xs text-muted-foreground text-center">
                Sikker betaling via{' '}
                {paymentMethod === 'vipps' ? 'Vipps' : 'Stripe'}. Ved å fortsette
                godtar du våre vilkår.
              </p>
            </CardContent>
          </Card>
        </form>
        </div>
      </main>

      <Footer />
    </div>
  );
}

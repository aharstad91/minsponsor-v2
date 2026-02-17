// MinSponsor fee configuration

// Platform fee percentage (10%)
export const PLATFORM_FEE_PERCENT = 10;

// Calculate platform fee from amount (in øre)
export function calculatePlatformFee(amount: number): number {
  return Math.round(amount * (PLATFORM_FEE_PERCENT / 100));
}

// Calculate total amount including platform fee (in øre)
export function calculateTotalWithFee(amount: number): number {
  return amount + calculatePlatformFee(amount);
}

// Calculate donation amount from total (reverse of adding fee)
// If total = donation * 1.10, then donation = total / 1.10
export function calculateDonationFromTotal(totalAmount: number): number {
  return Math.round(totalAmount / (1 + PLATFORM_FEE_PERCENT / 100));
}

// Calculate the application fee percent for Stripe subscriptions
// When charging totalAmount, we want club to receive donationAmount
// feePercent = (totalAmount - donationAmount) / totalAmount * 100
export function calculateSubscriptionFeePercent(totalAmount: number): number {
  const donationAmount = calculateDonationFromTotal(totalAmount);
  return ((totalAmount - donationAmount) / totalAmount) * 100;
}

// Format amount from øre to NOK string
export function formatAmountNOK(amountInOre: number): string {
  return new Intl.NumberFormat('nb-NO', {
    style: 'currency',
    currency: 'NOK',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amountInOre / 100);
}

// Format amount from øre to plain number string (e.g., "100")
export function formatAmountPlain(amountInOre: number): string {
  return (amountInOre / 100).toLocaleString('nb-NO');
}

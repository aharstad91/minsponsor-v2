import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

// GET /api/admin/finance/stats - Aggregated finance statistics
export async function GET() {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    // Get current month boundaries
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    // Fetch transactions for this month
    const { data: monthlyTransactions, error: txError } = await supabaseAdmin
      .from('transactions')
      .select('amount, platform_fee, payment_provider, status')
      .gte('created_at', startOfMonth.toISOString())
      .lte('created_at', endOfMonth.toISOString());

    if (txError) {
      console.error('Error fetching monthly transactions:', txError);
      return NextResponse.json(
        { error: 'Kunne ikke hente transaksjonsdata' },
        { status: 500 }
      );
    }

    // Calculate stats
    const successfulTx = monthlyTransactions?.filter(t => t.status === 'succeeded') || [];

    const totalVolume = successfulTx.reduce((sum, t) => sum + t.amount, 0);
    const totalPlatformFee = successfulTx.reduce((sum, t) => sum + (t.platform_fee || 0), 0);

    const vippsVolume = successfulTx
      .filter(t => t.payment_provider === 'vipps')
      .reduce((sum, t) => sum + t.amount, 0);

    const stripeVolume = successfulTx
      .filter(t => t.payment_provider === 'stripe')
      .reduce((sum, t) => sum + t.amount, 0);

    // Get failed payment count
    const { count: failedCount } = await supabaseAdmin
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'failed');

    // Get all-time totals
    const { data: allTimeData } = await supabaseAdmin
      .from('transactions')
      .select('amount, platform_fee')
      .eq('status', 'succeeded');

    const allTimeVolume = allTimeData?.reduce((sum, t) => sum + t.amount, 0) || 0;
    const allTimePlatformFee = allTimeData?.reduce((sum, t) => sum + (t.platform_fee || 0), 0) || 0;

    return NextResponse.json({
      thisMonth: {
        totalVolume,
        platformFee: totalPlatformFee,
        vippsVolume,
        stripeVolume,
        transactionCount: successfulTx.length,
      },
      allTime: {
        totalVolume: allTimeVolume,
        platformFee: allTimePlatformFee,
      },
      failedPaymentsCount: failedCount || 0,
    });
  } catch (err) {
    console.error('Error in GET /api/admin/finance/stats:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

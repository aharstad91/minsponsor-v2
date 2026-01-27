import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import type { Transaction, Organization, Subscription } from '@/lib/database.types';

type TransactionWithDetails = Transaction & {
  organization: Pick<Organization, 'id' | 'name'> | null;
  subscription: Pick<Subscription, 'id' | 'sponsor_email' | 'sponsor_name'> | null;
};

// GET /api/admin/finance - List transactions with filtering and pagination
export async function GET(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    // Parse query params
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status') || 'all';
    const provider = searchParams.get('provider') || 'all';
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = (page - 1) * limit;

    // Build query
    let query = supabaseAdmin
      .from('transactions')
      .select(`
        *,
        organization:organizations(id, name),
        subscription:subscriptions(id, sponsor_email, sponsor_name)
      `, { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    // Apply filters
    if (status !== 'all') {
      query = query.eq('status', status);
    }

    if (provider !== 'all') {
      query = query.eq('payment_provider', provider);
    }

    if (from) {
      query = query.gte('created_at', from);
    }

    if (to) {
      query = query.lte('created_at', to);
    }

    const { data, count, error } = await query;

    if (error) {
      console.error('Error fetching transactions:', error);
      return NextResponse.json(
        { error: 'Kunne ikke hente transaksjoner' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      transactions: data as TransactionWithDetails[],
      total: count || 0,
      page,
      limit,
      totalPages: Math.ceil((count || 0) / limit),
    });
  } catch (err) {
    console.error('Error in GET /api/admin/finance:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

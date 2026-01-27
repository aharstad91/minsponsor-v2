import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/onboarding/[id]/go-live - Mark organization as live
export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    // Check if organization can accept payments
    const { data: existingOrg } = await supabaseAdmin
      .from('organizations')
      .select('stripe_charges_enabled, vipps_enabled')
      .eq('id', id)
      .single();

    if (!existingOrg?.stripe_charges_enabled && !existingOrg?.vipps_enabled) {
      return NextResponse.json(
        { error: 'Organisasjonen må kunne motta betalinger før go-live' },
        { status: 400 }
      );
    }

    // Update organization
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .update({
        went_live_at: new Date().toISOString(),
      })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating organization:', error);
      return NextResponse.json(
        { error: 'Kunne ikke oppdatere organisasjon' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      organization: org,
      message: 'Organisasjon markert som live!',
    });
  } catch (err) {
    console.error('Error in POST /api/admin/onboarding/[id]/go-live:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/onboarding/[id]/verify-test - Mark test payment as verified
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
    // Update organization
    const { data: org, error } = await supabaseAdmin
      .from('organizations')
      .update({
        test_payment_verified_at: new Date().toISOString(),
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
      message: 'Test-betaling markert som verifisert',
    });
  } catch (err) {
    console.error('Error in POST /api/admin/onboarding/[id]/verify-test:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

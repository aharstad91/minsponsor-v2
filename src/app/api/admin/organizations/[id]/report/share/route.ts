import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { randomBytes } from 'crypto';

type RouteParams = {
  params: Promise<{ id: string }>;
};

// POST /api/admin/organizations/[id]/report/share - Create shareable report link
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
    // Verify organization exists
    const { data: org, error: orgError } = await supabaseAdmin
      .from('organizations')
      .select('id, name')
      .eq('id', id)
      .single();

    if (orgError || !org) {
      return NextResponse.json(
        { error: 'Organisasjon ikke funnet' },
        { status: 404 }
      );
    }

    // Parse body for optional expiration
    let expiresAt: string | null = null;
    try {
      const body = await request.json();
      if (body.expiresInDays) {
        const expDate = new Date();
        expDate.setDate(expDate.getDate() + body.expiresInDays);
        expiresAt = expDate.toISOString();
      }
    } catch {
      // No body provided, use no expiration
    }

    // Generate secure token
    const token = randomBytes(32).toString('hex');

    // Create share record
    const { data: share, error } = await supabaseAdmin
      .from('report_shares')
      .insert({
        organization_id: id,
        token,
        expires_at: expiresAt,
        created_by: user.id,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating share:', error);
      return NextResponse.json(
        { error: 'Kunne ikke opprette delbar lenke' },
        { status: 500 }
      );
    }

    // Build share URL
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'https://minsponsor.no';
    const shareUrl = `${baseUrl}/reports/${token}`;

    return NextResponse.json({
      success: true,
      share,
      shareUrl,
      expiresAt,
    });
  } catch (err) {
    console.error('Error in POST /api/admin/organizations/[id]/report/share:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

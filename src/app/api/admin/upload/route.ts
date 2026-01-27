import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

type BucketType = 'logos' | 'photos' | 'group-images';

// POST /api/admin/upload - Upload image to Supabase Storage
export async function POST(request: NextRequest) {
  const supabase = await createClient();

  // Check authentication
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Ikke autorisert' }, { status: 401 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;
    const bucket = formData.get('bucket') as BucketType | null;
    const entityId = formData.get('entityId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'Ingen fil lastet opp' }, { status: 400 });
    }

    if (!bucket || !['logos', 'photos', 'group-images'].includes(bucket)) {
      return NextResponse.json({ error: 'Ugyldig bucket' }, { status: 400 });
    }

    // Validate file type
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Kun JPEG, PNG og WebP er tillatt' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'Filen er for stor. Maks 5MB.' },
        { status: 400 }
      );
    }

    // Generate unique filename
    const extension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(2, 8);
    const filename = entityId
      ? `${entityId}/${timestamp}-${randomStr}.${extension}`
      : `${timestamp}-${randomStr}.${extension}`;

    // Convert File to ArrayBuffer
    const arrayBuffer = await file.arrayBuffer();
    const buffer = new Uint8Array(arrayBuffer);

    // Upload to Supabase Storage
    const { data, error } = await supabaseAdmin.storage
      .from(bucket)
      .upload(filename, buffer, {
        contentType: file.type,
        upsert: false,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return NextResponse.json(
        { error: 'Kunne ikke laste opp fil' },
        { status: 500 }
      );
    }

    // Get public URL
    const { data: urlData } = supabaseAdmin.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return NextResponse.json({
      url: urlData.publicUrl,
      path: data.path,
    });
  } catch (err) {
    console.error('Error in POST /api/admin/upload:', err);
    return NextResponse.json({ error: 'Noe gikk galt' }, { status: 500 });
  }
}

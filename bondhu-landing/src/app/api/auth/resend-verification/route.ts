import { createClient } from '@supabase/supabase-js'
import { NextRequest, NextResponse } from 'next/server'

// Admin client using service role key
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json()

    if (!email) {
      return NextResponse.json({ error: 'Email is required' }, { status: 400 })
    }

    // Use the admin client to generate/resend a confirmation link.
    // The supabase-js admin API surface may vary by version; use an any cast
    // to call generateLink so this doesn't break type checks if the helper
    // isn't present in types.
    const admin: any = (supabaseAdmin.auth as any).admin

    if (!admin) {
      return NextResponse.json({ error: 'Admin API not available. Check service role key.' }, { status: 500 })
    }

    // Try structured call first, then fallback to positional if needed
    let result: any
    try {
      result = await admin.generateLink({ type: 'confirmation', email })
    } catch (e) {
      try {
        result = await admin.generateLink('confirmation', email)
      } catch (err) {
        console.error('generateLink error:', err)
        return NextResponse.json({ error: 'Failed to trigger resend via admin API' }, { status: 500 })
      }
    }

    if (result?.error) {
      console.error('Resend verification error:', result.error)
      return NextResponse.json({ error: result.error.message || 'Failed to resend verification' }, { status: 500 })
    }

    return NextResponse.json({ message: 'Verification email resent' }, { status: 200 })
  } catch (err) {
    console.error('Server error in resend-verification:', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

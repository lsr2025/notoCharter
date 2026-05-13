import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? ''
const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders })

  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  const authHeader = req.headers.get('Authorization')
  if (!authHeader) return new Response('Unauthorized', { status: 401, headers: corsHeaders })

  const { data: { user }, error: authErr } = await supabaseAdmin.auth.getUser(
    authHeader.replace('Bearer ', '')
  )
  if (authErr || !user || user.app_metadata?.role !== 'compliance_officer') {
    return new Response('Forbidden', { status: 403, headers: corsHeaders })
  }

  const body = await req.json()
  const { action, email, role, mining_right_ids, user_id } = body

  if (action === 'invite') {
    const { data: inviteData, error } = await supabaseAdmin.auth.admin.inviteUserByEmail(email)
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 400, headers: corsHeaders })

    const newUserId = inviteData.user.id
    await supabaseAdmin.auth.admin.updateUserById(newUserId, {
      app_metadata: { role, mining_right_ids: mining_right_ids ?? [] }
    })
    await supabaseAdmin.from('user_profiles').upsert({
      id: newUserId,
      email,
      role,
      mining_right_ids: mining_right_ids ?? [],
      is_active: true,
    })
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  }

  if (action === 'revoke') {
    await supabaseAdmin.from('user_profiles').update({ is_active: false }).eq('id', user_id)
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  }

  if (action === 'update_role') {
    await supabaseAdmin.auth.admin.updateUserById(user_id, {
      app_metadata: { role, mining_right_ids: mining_right_ids ?? [] }
    })
    await supabaseAdmin.from('user_profiles').update({ role, mining_right_ids }).eq('id', user_id)
    return new Response(JSON.stringify({ success: true }), { headers: corsHeaders })
  }

  return new Response('Unknown action', { status: 400, headers: corsHeaders })
})

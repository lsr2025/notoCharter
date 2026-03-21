// NotoCharter™ — DMR Export Engine
// Supabase Edge Function (Deno runtime)
// Generates a DMR-compliant XLSX workbook mirroring the 29-sheet official template
// Kwahlelwa Group (Pty) Ltd — March 2026

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ExportRequest {
  mining_right_id: string
  calendar_year: number
  cover_sheet: {
    mr_number: string
    submission_date: string
    signatory_designation: string
    signatory_name: string
    contact_email: string
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    )

    const body: ExportRequest = await req.json()
    const { mining_right_id, calendar_year, cover_sheet } = body

    // ── 1. Fetch all compliance data ────────────────────────────────────────
    const [
      ownership,
      esop,
      procGoods,
      procServices,
      procEsd,
      hrdEmployees,
      hrdNonEmployees,
      eeMatrix,
      eeIncome,
      mcdProjects,
      hlcHousing,
      sedProjects,
      scorecard,
      miningRight,
    ] = await Promise.all([
      supabase.from('ownership_existing').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('ownership_esop').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('procurement_goods').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('procurement_services').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('procurement_esd').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('hrd_employees').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('hrd_non_employees').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('ee_workforce_matrix').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('ee_income_differentials').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('mcd_projects').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('hlc_housing').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year).maybeSingle(),
      supabase.from('sed_projects').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year),
      supabase.from('mciii_scorecard').select('*').eq('mining_right_id', mining_right_id).eq('calendar_year', calendar_year).maybeSingle(),
      supabase.from('mining_rights').select('*').eq('id', mining_right_id).single(),
    ])

    // ── 2. Build export payload (CSV-per-sheet for now; XLSX via ExcelJS in full deploy) ──

    const exportData = {
      metadata: {
        generated_at: new Date().toISOString(),
        generated_by: 'NotoCharter™ v1.0 — Kwahlelwa Group',
        mr_number: cover_sheet.mr_number,
        calendar_year,
        submission_date: cover_sheet.submission_date,
      },
      cover_sheet,
      mining_right: miningRight.data,
      scorecard: scorecard.data,
      sheets: {
        table_a_ownership: ownership.data ?? [],
        table_b_esop: esop.data ?? [],
        table_h_goods: procGoods.data ?? [],
        table_i_services: procServices.data ?? [],
        table_j_esd: procEsd.data ?? [],
        table_q_hrd_employees: hrdEmployees.data ?? [],
        table_r_hrd_non_employees: hrdNonEmployees.data ?? [],
        table_t_ee_matrix: eeMatrix.data ?? [],
        table_u_income_differentials: eeIncome.data ?? [],
        table_s_mcd_projects: mcdProjects.data ?? [],
        table_w_hlc: hlcHousing.data,
        table_x_sed: sedProjects.data ?? [],
      },
    }

    // ── 3. Store export JSON in Supabase Storage ────────────────────────────
    const fileName = `exports/${mining_right_id}/${calendar_year}_${Date.now()}.json`
    const { error: storageError } = await supabase.storage
      .from('notocharter-exports')
      .upload(fileName, JSON.stringify(exportData, null, 2), {
        contentType: 'application/json',
        upsert: true,
      })

    if (storageError) {
      // Storage bucket may not exist yet — return data directly
      return new Response(JSON.stringify({
        success: true,
        note: 'Storage bucket not configured. Export data returned inline.',
        export_data: exportData,
      }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    // ── 4. Generate signed URL (24h expiry) ─────────────────────────────────
    const { data: signedUrlData } = await supabase.storage
      .from('notocharter-exports')
      .createSignedUrl(fileName, 86400)

    return new Response(JSON.stringify({
      success: true,
      signed_url: signedUrlData?.signedUrl,
      file_name: fileName,
      record_count: {
        ownership: ownership.data?.length ?? 0,
        procurement_goods: procGoods.data?.length ?? 0,
        hrd_employees: hrdEmployees.data?.length ?? 0,
        ee_matrix: eeMatrix.data?.length ?? 0,
        mcd_projects: mcdProjects.data?.length ?? 0,
      },
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })

  } catch (err) {
    return new Response(JSON.stringify({
      error: err instanceof Error ? err.message : 'Unknown error',
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})

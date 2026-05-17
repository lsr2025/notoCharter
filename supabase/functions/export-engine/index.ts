// NotoCharter™ — DMR Export Engine
// Supabase Edge Function (Deno runtime)
// Generates a 28-sheet DMR-compliant XLSX workbook from live Supabase data.
// Returns the file as a base64-encoded XLSX in the JSON response,
// or as a signed Storage URL if the 'notocharter-exports' bucket is configured.
//
// Kwahlelwa Group (Pty) Ltd — Built for NPC-Cimpor (Pty) Ltd

// deno-lint-ignore-file no-explicit-any

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'
import ExcelJS from 'npm:exceljs@4.4.0'

import {
  writeCoverSheet,
  writeScorecardSheet,
  writeTableA,
  writeTableB,
  writeTableC,
  writeTableH,
  writeTableI,
  writeTableJ,
  writeTableQ,
  writeTableR,
  writeTableS,
  writeTableT,
  writeTableW,
  writeTableX,
} from './lib/sheet-writers.ts'

// ─── CORS ─────────────────────────────────────────────────────────────────────

const ALLOWED_ORIGINS = (Deno.env.get('ALLOWED_ORIGINS') ?? '').split(',').map(s => s.trim()).filter(Boolean)

function corsHeaders(origin: string | null): Record<string, string> {
  const allowed = !origin || ALLOWED_ORIGINS.length === 0 || ALLOWED_ORIGINS.includes(origin)
    ? (origin ?? '*')
    : ''
  return {
    'Access-Control-Allow-Origin': allowed || '',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
  }
}

function err(status: number, message: string, origin: string | null) {
  return new Response(
    JSON.stringify({ error: message }),
    { status, headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
  )
}

// ─── Main Handler ─────────────────────────────────────────────────────────────

Deno.serve(async (req) => {
  const origin = req.headers.get('origin')

  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders(origin) })
  }

  if (req.method !== 'POST') {
    return err(405, 'Method not allowed', origin)
  }

  // ── Auth ──────────────────────────────────────────────────────────────────
  const authHeader = req.headers.get('Authorization')
  if (!authHeader?.startsWith('Bearer ')) {
    return err(401, 'Unauthorized', origin)
  }

  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
  )

  const token = authHeader.replace('Bearer ', '')
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token)
  if (authErr || !user) {
    return err(401, 'Unauthorized', origin)
  }

  // ── Parse request ─────────────────────────────────────────────────────────
  let body: {
    mining_right_id: string
    calendar_year: number
    cover_sheet: {
      mr_number: string
      submission_date: string
      calendar_year: number
      signatory_designation: string
      signatory_name: string
      contact_email: string
    }
  }

  try {
    body = await req.json()
  } catch {
    return err(400, 'Invalid JSON body', origin)
  }

  const { mining_right_id, calendar_year, cover_sheet } = body
  if (!mining_right_id || !calendar_year) {
    return err(400, 'Missing mining_right_id or calendar_year', origin)
  }

  try {
    // ── Fetch all compliance data ──────────────────────────────────────────
    const data = await fetchAllData(supabase, mining_right_id, calendar_year)

    // ── Load DMR template ─────────────────────────────────────────────────
    const templateBytes = await Deno.readFile(
      new URL('./template/Mining_Charter_Report_Template.xlsx', import.meta.url),
    )
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(templateBytes)

    // ── Populate sheets ───────────────────────────────────────────────────
    writeCoverSheet(workbook, cover_sheet, data.miningRight)
    writeScorecardSheet(workbook, data.scorecard)
    writeTableA(workbook, data.ownershipExisting)
    writeTableB(workbook, data.ownershipEsop)
    writeTableC(workbook, data.ownershipHostCommunity)
    writeTableH(workbook, data.procurementGoods)
    writeTableI(workbook, data.procurementServices)
    writeTableJ(workbook, data.procurementEsd)
    writeTableQ(workbook, data.hrdEmployees)
    writeTableR(workbook, data.hrdNonEmployees)
    writeTableS(workbook, data.mcdProjects)
    writeTableT(workbook, data.eeMatrix)
    writeTableW(workbook, data.hlcHousing)
    writeTableX(workbook, data.sedProjects)

    // ── Write to buffer ───────────────────────────────────────────────────
    const buffer = await workbook.xlsx.writeBuffer() as ArrayBuffer
    const bytes = new Uint8Array(buffer)

    // ── Try Supabase Storage upload (returns signed URL if bucket exists) ─
    const filename = `DMR_${cover_sheet.mr_number.replace(/\s/g, '_')}_${calendar_year}_${Date.now()}.xlsx`
    const { error: uploadErr } = await supabase.storage
      .from('notocharter-exports')
      .upload(filename, bytes, {
        contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        upsert: true,
      })

    if (!uploadErr) {
      // Storage is configured — return 24-hour signed URL
      const { data: urlData, error: urlErr } = await supabase.storage
        .from('notocharter-exports')
        .createSignedUrl(filename, 86_400)

      if (!urlErr && urlData?.signedUrl) {
        return new Response(
          JSON.stringify({ signed_url: urlData.signedUrl, filename, mode: 'storage' }),
          { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
        )
      }
    }

    // Storage not configured — return file as base64 inline
    const base64 = btoa(String.fromCharCode(...bytes))
    return new Response(
      JSON.stringify({ base64, filename, mode: 'inline', content_type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }),
      { headers: { ...corsHeaders(origin), 'Content-Type': 'application/json' } },
    )

  } catch (e) {
    console.error('[export-engine] error:', e)
    return err(500, 'Export failed. Please try again or contact your administrator.', origin)
  }
})

// ─── Data Fetcher ─────────────────────────────────────────────────────────────

async function fetchAllData(supabase: any, mrId: string, year: number) {
  const q = (table: string, single = false) => {
    const base = supabase.from(table).select('*').eq('mining_right_id', mrId).eq('calendar_year', year)
    return single ? base.maybeSingle() : base
  }

  const [
    miningRight,
    scorecard,
    ownershipExisting,
    ownershipEsop,
    ownershipHostCommunity,
    procurementGoods,
    procurementServices,
    procurementEsd,
    hrdEmployees,
    hrdNonEmployees,
    mcdProjects,
    hlcHousing,
    sedProjects,
    eeMatrix,
  ] = await Promise.all([
    supabase.from('mining_rights').select('*').eq('id', mrId).single(),
    q('mciii_scorecard', true),
    q('ownership_existing'),
    q('ownership_esop'),
    q('ownership_host_community'),
    supabase.from('procurement_goods')
      .select('*, supplier:suppliers(*)')
      .eq('mining_right_id', mrId)
      .eq('calendar_year', year),
    supabase.from('procurement_services')
      .select('*, supplier:suppliers(*)')
      .eq('mining_right_id', mrId)
      .eq('calendar_year', year),
    q('procurement_esd'),
    q('hrd_employees'),
    q('hrd_non_employees'),
    q('mcd_projects'),
    q('hlc_housing', true),
    q('sed_projects'),
    q('ee_workforce_matrix'),
  ])

  return {
    miningRight: miningRight.data ?? null,
    scorecard: scorecard.data ?? null,
    ownershipExisting: ownershipExisting.data ?? [],
    ownershipEsop: ownershipEsop.data ?? [],
    ownershipHostCommunity: ownershipHostCommunity.data ?? [],
    procurementGoods: procurementGoods.data ?? [],
    procurementServices: procurementServices.data ?? [],
    procurementEsd: procurementEsd.data ?? [],
    hrdEmployees: hrdEmployees.data ?? [],
    hrdNonEmployees: hrdNonEmployees.data ?? [],
    mcdProjects: mcdProjects.data ?? [],
    hlcHousing: hlcHousing.data ?? null,
    sedProjects: sedProjects.data ?? [],
    eeMatrix: eeMatrix.data ?? [],
  }
}

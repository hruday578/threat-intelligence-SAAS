import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

function getTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER || 'tactical.ops.demo@gmail.com';
  const pass = process.env.SMTP_PASS || 'nejwkaaomtkbvhlc';
  const port = process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 465;
  const secure = process.env.SMTP_SECURE !== undefined ? (process.env.SMTP_SECURE === 'true') : true;

  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });
}

app.post('/api/broadcast', async (req, res) => {
  const { employees, threat } = req.body;

  if (!employees || !Array.isArray(employees) || employees.length === 0)
    return res.status(400).json({ error: 'No employees provided.' });
  if (!threat)
    return res.status(400).json({ error: 'No threat details provided.' });

  const emailAddresses = employees
    .map(emp => emp.companyEmail || `${emp.firstName.toLowerCase()}.${emp.lastName.toLowerCase()}@example.com`)
    .join(', ');

  const classification = threat.classification || threat.ai?.classification || 'ALERT';
  const hazard        = threat.hazard        || threat.ai?.hazard        || 'General';
  const region        = threat.region        || threat.ai?.region        || 'Global';
  const urgency       = threat.urgency       || threat.ai?.urgency       || 'LOW';
  const title         = threat.title         || 'Threat Intelligence Briefing';
  const articleUrl    = threat.articleUrl    || null;

  const rawReasoning     = threat.reasoning     || threat.ai?.reasoning     || '';
  const rawMitigation    = threat.mitigation    || threat.ai?.mitigation    || '';
  const rawCitizenAction = threat.citizen_action || threat.ai?.citizen_action || '';

  // ── Helpers ───────────────────────────────────────────────────────────────
  function getSteps(raw) {
    if (!raw) return [];
    const trimmed = raw.trim();
    const invalid = ['unknown','n/a','none','na','stay alert','awaiting detailed analysis from ai model'];
    if (!trimmed || invalid.includes(trimmed.toLowerCase())) return [];
    return (trimmed.match(/[^.!?]+[.!?]+/g) || [trimmed]).map(s => s.trim()).filter(s => s.length > 4);
  }

  function stepsHtml(steps, accentColor, bgColor, borderColor, icon, label) {
    if (!steps.length) return '';
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid ${borderColor};">
        <tr><td style="background:${accentColor};padding:0 0 0 4px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:${bgColor};padding:11px 16px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:${accentColor};">
              ${icon}&nbsp;&nbsp;${label}
            </td></tr>
            ${steps.map((step, idx) => `
            <tr><td style="background:#ffffff;padding:13px 16px;border-top:1px solid ${borderColor};font-size:12.5px;line-height:1.55;color:#1f2937;vertical-align:top;">
              <table cellpadding="0" cellspacing="0"><tr>
                <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
                  <span style="display:inline-block;min-width:22px;height:22px;border-radius:50%;background:${accentColor};color:#fff;font-size:10px;font-weight:900;text-align:center;line-height:22px;">${idx + 1}</span>
                </td>
                <td style="vertical-align:top;color:#374151;">${step}</td>
              </tr></table>
            </td></tr>`).join('')}
          </table>
        </td></tr>
      </table>`;
  }

  function objectiveHtml(num, label, priority, steps, headerGrad, icon, accentColor, bgColor, borderColor) {
    return `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid ${borderColor};">
        <tr><td style="background:${headerGrad};padding:12px 16px;">
          <table width="100%" cellpadding="0" cellspacing="0"><tr>
            <td style="width:34px;vertical-align:middle;">
              <div style="width:28px;height:28px;border-radius:8px;background:rgba(255,255,255,0.15);text-align:center;line-height:28px;font-size:14px;">${icon}</div>
            </td>
            <td style="padding-left:10px;vertical-align:middle;">
              <div style="font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:rgba(255,255,255,0.6);line-height:1;margin-bottom:3px;">Objective ${num}</div>
              <div style="font-size:11px;font-weight:900;color:#ffffff;text-transform:uppercase;letter-spacing:0.04em;">${label}</div>
            </td>
          </tr></table>
        </td></tr>
        <tr><td style="background:${bgColor};padding:8px 16px;border-top:1px solid ${borderColor};">
          <div style="font-size:8px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:${accentColor};">Priority: ${priority}</div>
        </td></tr>
        ${steps.map((step, idx) => `
        <tr><td style="background:#ffffff;padding:11px 16px;border-top:1px solid ${borderColor};">
          <table cellpadding="0" cellspacing="0"><tr>
            <td style="vertical-align:top;padding-right:10px;padding-top:1px;">
              <span style="display:inline-block;min-width:22px;height:22px;border-radius:6px;background:${bgColor};color:${accentColor};font-size:10px;font-weight:900;text-align:center;line-height:22px;">${idx + 1}</span>
            </td>
            <td style="vertical-align:top;font-size:12px;line-height:1.55;color:#374151;">${step}</td>
          </tr></table>
        </td></tr>`).join('')}
      </table>`;
  }

  // ── Build all sections ────────────────────────────────────────────────────
  const mitigationSteps = getSteps(rawMitigation);
  const citizenSteps    = getSteps(rawCitizenAction);

  const urgencyColor   = urgency === 'HIGH' ? '#dc2626' : urgency === 'MED' ? '#d97706' : '#2563eb';
  const urgencyLabel   = urgency === 'HIGH' ? 'HIGH URGENCY' : urgency === 'MED' ? 'MEDIUM URGENCY' : 'LOW URGENCY';
  const urgencyIcon    = urgency === 'HIGH'
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
    : urgency === 'MED'
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><path d="M12 9v4"/><path d="M12 17h.01"/><circle cx="12" cy="12" r="10"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>';
  const headerGradient = urgency === 'HIGH'
    ? 'linear-gradient(135deg,#7f1d1d 0%,#dc2626 60%,#f87171 100%)'
    : urgency === 'MED'
    ? 'linear-gradient(135deg,#78350f 0%,#d97706 60%,#fbbf24 100%)'
    : 'linear-gradient(135deg,#1e3a5f 0%,#2563eb 60%,#60a5fa 100%)';

  const mitigationHtml = stepsHtml(mitigationSteps, '#dc2626', '#fef2f2', '#fecaca', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>', 'Mitigation Strategy');
  const citizenHtml    = stepsHtml(citizenSteps,    '#0f172a', '#f1f5f9', '#e2e8f0', '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"></path><circle cx="9" cy="7" r="4"></circle><path d="M22 21v-2a4 4 0 0 0-3-3.87"></path><path d="M16 3.13a4 4 0 0 1 0 7.75"></path></svg>', 'Civilian Action Protocol');

  const reasoningHtml = rawReasoning && !['unknown','n/a','none'].includes(rawReasoning.toLowerCase().trim()) ? `
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:20px;border-radius:12px;overflow:hidden;border:1px solid #fde68a;">
        <tr><td style="background:#d97706;padding:0 0 0 4px;">
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr><td style="background:#fffbeb;padding:11px 16px;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#92400e;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A6 6 0 0 0 6 8c0 1 .2 2.2 1.5 3.5.7.9 1.2 1.5 1.5 2.5"/><path d="M9 18h6"/><path d="M10 22h4"/></svg>&nbsp;&nbsp;AI Intelligence Assessment
            </td></tr>
            <tr><td style="background:#ffffff;padding:14px 18px;border-top:1px solid #fde68a;font-size:12.5px;line-height:1.65;color:#44403c;font-style:italic;">
              &ldquo;${rawReasoning}&rdquo;
            </td></tr>
          </table>
        </td></tr>
      </table>` : '';

  const obj1Html = objectiveHtml(
    '01', 'Pre-Event Asset Hardening &amp; Life Safety Precautions',
    'Pre-Disaster Risk Reduction &amp; Life Safety Preparedness',
    [
      'Pre-activate Incident Management Team (IMT) and verify pre-assigned roles for Floor Wardens and Safety Officers.',
      'Conduct pre-event facility inspections — check emergency exits, fire suppression systems, and backup generators.',
      'Stage emergency response kits, first-aid supplies, and satellite communication devices in designated safe zones.',
      'Verify emergency evacuation routes and ensure all personnel are briefed on pre-hazard assembly points.',
      'Perform pre-disaster data backups and secure physical confidential documents in fire/waterproof vaults.',
      'Establish real-time monitoring of official early warning systems (NWS, Met Dept, Emergency Services).',
      'Pre-position protective equipment (flood barriers, sandbags, window shutters, surge protectors) ahead of impact.',
    ],
    'linear-gradient(135deg,#7f1d1d 0%,#dc2626 60%,#ef4444 100%)',
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path><path d="m9 12 2 2 4-4"></path></svg>', '#dc2626', '#fef2f2', '#fecaca'
  );

  const obj2Html = objectiveHtml(
    '02', 'Precautionary Business Continuity Staging &amp; Risk Mitigation',
    'Proactive System Staging &amp; Downtime Prevention',
    [
      'Pre-emptively stage Business Continuity Plans (BCP) for critical business units (IT, Security, Finance, Ops).',
      'Pre-authorize remote work protocols and verify VPN / cloud access for all essential staff prior to hazard landfall.',
      'Perform offsite database snapshots and verify server failover mechanisms at Disaster Recovery (DR) sites.',
      'Secure supply chain alternatives and pre-order essential operational consumables to prevent supply bottlenecks.',
      'Issue pre-incident status advisories to key corporate stakeholders, vendors, and clients via mass notification tools.',
      'Test backup power systems (UPS, fuel for generators) and verify fuel reserves for emergency vehicles.',
      'Establish high-frequency check-in schedules for IT infrastructure and critical operations teams.',
    ],
    'linear-gradient(135deg,#1e3a5f 0%,#1d4ed8 60%,#3b82f6 100%)',
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/><path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16"/><path d="M16 21v-5h5"/></svg>', '#1d4ed8', '#eff6ff', '#bfdbfe'
  );

  const obj3Html = objectiveHtml(
    '03', 'Pre-Incident Travel Advisories &amp; Mobility Restrictions',
    'Preventive Mobility Management &amp; Travel Risk Reduction',
    [
      'Immediately restrict or halt non-essential travel into the target alert zone prior to hazard escalation.',
      'Audit itinerary logs for all active business travelers currently in or bound for the high-risk region.',
      'Issue early precautionary travel advisories with pre-planned evacuation options and emergency contact numbers.',
      'Pre-book emergency transport or alternate lodging outside the anticipated impact radius for traveling staff.',
      'Advise personnel in the alert area to assemble 72-hour emergency kits (water, medications, power banks).',
      'Monitor airport closures, transit suspensions, and highway advisories continuously to reroute staff proactively.',
      'Establish clear pre-incident check-in protocols for field employees before communications networks become overloaded.',
    ],
    'linear-gradient(135deg,#1a1a2e 0%,#16213e 60%,#0f3460 100%)',
    '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-3px;"><polygon points="3 11 22 2 13 21 11 13 3 11"></polygon></svg>', '#0f3460', '#f8fafc', '#cbd5e1'
  );

  const reportedDate = new Date(threat.date || Date.now()).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });

  // ── HTML Email ────────────────────────────────────────────────────────────
  const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1.0"><title>AlertEm Threat Brief</title></head>
<body style="margin:0;padding:0;background:#e5e7eb;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Arial,sans-serif;">

  <table width="100%" cellpadding="0" cellspacing="0" style="background:#e5e7eb;padding:28px 0;">
    <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">

      <!-- Brand bar -->
      <tr><td style="background:#09090b;padding:14px 24px;border-radius:14px 14px 0 0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td style="color:#ffffff;font-size:16px;font-weight:900;letter-spacing:0.04em;">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;margin-right:4px"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>Alert<span style="color:#ef4444;">Em</span>
          </td>
          <td align="right" style="color:#71717a;font-size:10px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;">
            Threat Intelligence Platform
          </td>
        </tr></table>
      </td></tr>

      <!-- Hero -->
      <tr><td style="background:${headerGradient};padding:32px 28px 28px;text-align:center;">
        <div style="display:inline-block;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.3);border-radius:20px;padding:4px 14px;font-size:10px;font-weight:900;letter-spacing:0.1em;text-transform:uppercase;color:#fff;margin-bottom:14px;">
          ${classification}&nbsp;BRIEFING
        </div>
        <div style="font-size:26px;font-weight:900;color:#ffffff;line-height:1.25;margin-bottom:8px;">${hazard} Alert</div>
        <div style="font-size:13px;font-weight:600;color:rgba(255,255,255,0.85);margin-bottom:16px;display:flex;align-items:center;justify-content:center;gap:6px;"><svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg> ${region}</div>
        <div style="display:inline-block;background:rgba(0,0,0,0.25);border-radius:8px;padding:6px 16px;font-size:11px;font-weight:900;letter-spacing:0.07em;color:#fff;">${urgencyIcon}${urgencyLabel}</div>
      </td></tr>

      <!-- Meta strip -->
      <tr><td style="background:#18181b;padding:0;">
        <table width="100%" cellpadding="0" cellspacing="0"><tr>
          <td width="33%" style="padding:10px 0;text-align:center;border-right:1px solid #27272a;">
            <div style="font-size:9px;font-weight:700;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Hazard Type</div>
            <div style="font-size:12px;font-weight:800;color:#f4f4f5;margin-top:3px;">${hazard}</div>
          </td>
          <td width="33%" style="padding:10px 0;text-align:center;border-right:1px solid #27272a;">
            <div style="font-size:9px;font-weight:700;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Date Reported</div>
            <div style="font-size:12px;font-weight:800;color:#f4f4f5;margin-top:3px;">${reportedDate}</div>
          </td>
          <td width="33%" style="padding:10px 0;text-align:center;">
            <div style="font-size:9px;font-weight:700;color:#71717a;letter-spacing:0.08em;text-transform:uppercase;">Status</div>
            <div style="font-size:12px;font-weight:800;color:${urgencyColor};margin-top:3px;">${classification}</div>
          </td>
        </tr></table>
      </td></tr>

      <!-- Body card -->
      <tr><td style="background:#ffffff;padding:28px 24px;border-left:1px solid #e5e7eb;border-right:1px solid #e5e7eb;">

        <!-- Source headline -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;border-radius:10px;overflow:hidden;border:1px solid #e5e7eb;">
          <tr><td style="background:#f8fafc;padding:0 0 0 4px;">
            <table width="100%" cellpadding="0" cellspacing="0">
              <tr><td style="background:#f1f5f9;padding:9px 14px;font-size:9.5px;font-weight:900;text-transform:uppercase;letter-spacing:0.08em;color:#475569;">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>&nbsp;&nbsp;Source Intelligence
              </td></tr>
              <tr><td style="background:#ffffff;padding:14px 16px;border-top:1px solid #e5e7eb;font-size:13px;font-weight:700;line-height:1.4;">
                ${articleUrl
                  ? `<a href="${articleUrl}" target="_blank" style="color:#0f172a;text-decoration:none;border-bottom:2px solid #e5e7eb;padding-bottom:1px;">${title}</a>`
                  : `<span style="color:#0f172a;">${title}</span>`
                }
              </td></tr>
            </table>
          </td></tr>
        </table>

        ${articleUrl ? `
        <!-- Read Full Article CTA (top) -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
          <tr><td align="center">
            <a href="${articleUrl}" target="_blank"
              style="display:inline-block;background:linear-gradient(135deg,#0f172a 0%,#1e293b 100%);color:#ffffff;font-size:11px;font-weight:900;letter-spacing:0.08em;text-transform:uppercase;text-decoration:none;padding:13px 32px;border-radius:10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2"/><path d="M18 14h-8"/><path d="M15 18h-5"/><path d="M10 6h8v4h-8V6Z"/></svg>&nbsp; Read Full Source Article &nbsp;→
            </a>
          </td></tr>
        </table>` : ''}

        <!-- AI Mitigation + Civilian Actions -->
        ${mitigationHtml}
        ${citizenHtml}

        ${classification === 'ALERT' ? `
        <!-- Recommended Operational Protocols divider -->
        <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
          <tr><td style="padding:6px 0 12px;border-top:2px solid #f3f4f6;">
            <div style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:0.1em;color:#6b7280;padding-top:10px;">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-2px;"><rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/></svg>&nbsp;&nbsp;Recommended Operational Protocols
            </div>
          </td></tr>
        </table>
        ${obj1Html}
        ${obj2Html}
        ${obj3Html}
        ` : ''}

        <!-- AI Reasoning -->
        ${reasoningHtml}



      </td></tr>

      <!-- Footer -->
      <tr><td style="background:#09090b;padding:20px 24px;border-radius:0 0 14px 14px;text-align:center;">
        <p style="margin:0 0 6px;font-size:10px;color:#52525b;">
          This is an automated safety broadcast from the <strong style="color:#a1a1aa;">AlertEm Threat Intelligence Platform</strong>.
        </p>
        <p style="margin:0;font-size:10px;color:#3f3f46;">
          Always follow official local emergency management directives. Do not reply to this message.
        </p>
        <p style="margin:10px 0 0;font-size:9px;color:#27272a;letter-spacing:0.06em;text-transform:uppercase;">
          © ${new Date().getFullYear()} AlertEm · Confidential Broadcast
        </p>
      </td></tr>

    </table>
    </td></tr>
  </table>

</body>
</html>`;

  try {
    const mailer = getTransporter();
    const senderEmail = process.env.SMTP_USER || 'tactical.ops.demo@gmail.com';
    const info = await mailer.sendMail({
      from: `"Tactical Ops Center" <${senderEmail}>`,
      to: emailAddresses,
      subject: `[${classification}] Safety Broadcast: ${hazard} in ${region}`,
      text: `Alert: ${title}\nHazard: ${hazard}\nRegion: ${region}\n\nReasoning: ${rawReasoning}\n\nMitigation: ${rawMitigation}\n\nCivilian Actions: ${rawCitizenAction}${articleUrl ? `\n\nRead Article: ${articleUrl}` : ''}`,
      html: htmlContent,
    });

    console.log('Message sent: %s', info.messageId);
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) console.log('Preview URL: %s', previewUrl);

    res.status(200).json({ message: 'Broadcast dispatched successfully', messageId: info.messageId, previewUrl });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ error: 'Failed to send broadcast email' });
  }
});

app.post('/api/ai-proxy', async (req, res) => {
  try {
    const { provider, apiKey, model, messages, temperature } = req.body;

    let targetEndpoint = '';
    let targetKey = apiKey || req.headers['x-ai-key'] || process.env.GROQ_API_KEY;

    if (provider === 'openrouter') {
      targetEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
      targetKey = targetKey || process.env.OPENROUTER_API_KEY;
    } else if (provider === 'deepseek') {
      targetEndpoint = 'https://api.deepseek.com/chat/completions';
      targetKey = targetKey || process.env.DEEPSEEK_API_KEY;
    } else {
      targetEndpoint = 'https://api.groq.com/openai/v1/chat/completions';
      targetKey = targetKey || process.env.GROQ_API_KEY;
    }

    if (!targetKey) {
      return res.status(400).json({ error: 'No API key provided for AI provider.' });
    }

    const aiResponse = await fetch(targetEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${targetKey}`,
      },
      body: JSON.stringify({
        model: model || 'openai/gpt-oss-120b',
        temperature: temperature ?? 0.1,
        messages: messages || [],
      }),
    });

    const data = await aiResponse.json();
    if (!aiResponse.ok) {
      return res.status(aiResponse.status).json({ error: data?.error?.message || 'AI request failed', details: data });
    }
    return res.status(200).json(data);
  } catch (err) {
    console.error('[ai-proxy express] Exception:', err.message);
    return res.status(502).json({ error: 'AI proxy failed: ' + err.message });
  }
});

export default app;

if (process.env.NODE_ENV !== 'production' && process.env.VERCEL !== '1') {
  app.listen(PORT, () => {
    console.log(`🚀 Broadcast API server running on port ${PORT}`);
  });
}

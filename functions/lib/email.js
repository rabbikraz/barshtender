// ============================================================
// Shared branded email building blocks (match the site design)
// card #14101f · mint #cfe8ca · text #f2eee8 · muted #9b97b3
// Email-safe: table layout, inline styles, web-safe font stack.
// This file exports no onRequest handlers, so it is not routed.
// ============================================================

export const FONT = "font-family:Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif;";

export function escapeHtml(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function detailRow(label, value) {
    if (!value) return "";
    return '<tr>' +
        '<td style="' + FONT + 'padding:10px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6f6b85;vertical-align:top;white-space:nowrap;padding-right:24px;">' + escapeHtml(label) + '</td>' +
        '<td style="' + FONT + 'padding:10px 0;font-size:15px;font-weight:600;color:#f2eee8;vertical-align:top;">' + escapeHtml(value) + '</td>' +
        '</tr>';
}

export function mintButton(href, label) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>' +
        '<td style="background-color:#cfe8ca;border-radius:999px;">' +
        '<a href="' + href + '" style="' + FONT + 'display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0a0913;text-decoration:none;">' + label + '</a>' +
        '</td></tr></table>';
}

export function emailShell(kickerText, headlineHtml, bodyHtml) {
    return '<div style="margin:0;padding:0;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">' +
        '<tr><td align="center" style="padding:40px 16px;">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">' +
        '<tr><td style="background-color:#14101f;border:1px solid #2e2a44;border-radius:20px;padding:36px 36px 40px;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td align="center" style="padding:0 0 30px;">' +
        '<img src="https://barshtender.pages.dev/assets/logo-green-tight.png" alt="Barshtender" height="30" style="display:block;height:30px;width:auto;border:0;">' +
        '</td></tr></table>' +
        '<p style="' + FONT + 'margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#cfe8ca;">' + kickerText + '</p>' +
        '<h1 style="' + FONT + 'margin:0 0 18px;font-size:30px;line-height:1.05;font-weight:900;letter-spacing:-0.5px;color:#f2eee8;">' + headlineHtml + '</h1>' +
        bodyHtml +
        '</td></tr>' +
        '<tr><td align="center" style="padding:28px 12px 0;">' +
        '<p style="' + FONT + 'margin:0 0 6px;font-size:13px;font-weight:700;color:#3b3a79;">Kosher cocktails, perfected.</p>' +
        '<p style="' + FONT + 'margin:0;font-size:12px;line-height:1.6;color:#6f6b85;">Under the supervision of Chabad in South Beach.<br>Serving Miami-Dade &amp; Broward.</p>' +
        '</td></tr>' +
        '</table>' +
        '</td></tr></table>' +
        '</div>';
}

export async function sendViaResend(env, message) {
    const res = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            "Authorization": "Bearer " + env.RESEND_API_KEY,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(message)
    });
    if (!res.ok) {
        const body = await res.text();
        throw new Error("Resend " + res.status + ": " + body);
    }
}

export function resendConfigured(env) {
    return Boolean(env.RESEND_API_KEY && env.FROM_EMAIL);
}

// Simple shared admin-cookie check for /api/admin/* endpoints
export function isAuthorized(request) {
    const cookieHeader = request.headers.get("Cookie");
    return Boolean(cookieHeader && cookieHeader.includes("authorized=true"));
}

export function json(data, status) {
    return new Response(JSON.stringify(data), {
        status: status || 200,
        headers: { "Content-Type": "application/json" }
    });
}

// ============================================================
// Quote submission endpoint
//
// Flow:
//   1. Save to D1 (quotes table)
//   2. If Resend is configured (RESEND_API_KEY + FROM_EMAIL env vars),
//      send the branded admin notification + client confirmation
//      directly via the Resend API.
//   3. Forward to Google Apps Script for Google Sheets logging.
//      When Resend handled the emails, we pass logOnly: true so the
//      script only appends the sheet row. When Resend is NOT
//      configured, the script also sends the emails (fallback).
//
// Env vars (set in Cloudflare Pages > Settings > Environment variables):
//   RESEND_API_KEY  (secret)  - Resend API key
//   FROM_EMAIL                - verified sender, e.g. "Barshtender <quotes@barshtender.com>"
//   ADMIN_EMAIL               - where notifications go (default barshtender@gmail.com)
// ============================================================

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwt7l5cYb25T-GDilDse-afYKPHFXy9WGQGc5MloFs9asl_8QaB-4KEOACBPLKja974zA/exec";

// ---------- Branded email templates (match the site design) ----------
// bg #0a0913 · card #14101f · mint #cfe8ca · text #f2eee8 · muted #9b97b3

const FONT = "font-family:Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif;";

function escapeHtml(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

function detailRow(label, value) {
    if (!value) return "";
    return '<tr>' +
        '<td style="' + FONT + 'padding:10px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6f6b85;vertical-align:top;white-space:nowrap;padding-right:24px;">' + escapeHtml(label) + '</td>' +
        '<td style="' + FONT + 'padding:10px 0;font-size:15px;font-weight:600;color:#f2eee8;vertical-align:top;">' + escapeHtml(value) + '</td>' +
        '</tr>';
}

function emailShell(kickerText, headlineHtml, bodyHtml) {
    return '<div style="margin:0;padding:0;background-color:#0a0913;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0913;">' +
        '<tr><td align="center" style="padding:40px 16px;">' +
        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">' +
        '<tr><td align="center" style="padding:0 0 28px;">' +
        '<span style="' + FONT + 'font-size:20px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#cfe8ca;">Barshtender</span>' +
        '</td></tr>' +
        '<tr><td style="background-color:#14101f;border:1px solid #2e2a44;border-radius:20px;padding:40px 36px;">' +
        '<p style="' + FONT + 'margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#cfe8ca;">' + kickerText + '</p>' +
        '<h1 style="' + FONT + 'margin:0 0 18px;font-size:30px;line-height:1.05;font-weight:900;letter-spacing:-0.5px;color:#f2eee8;">' + headlineHtml + '</h1>' +
        bodyHtml +
        '</td></tr>' +
        '<tr><td align="center" style="padding:28px 12px 0;">' +
        '<p style="' + FONT + 'margin:0 0 6px;font-size:13px;font-weight:700;color:#cfe8ca;">Kosher cocktails, reimagined.</p>' +
        '<p style="' + FONT + 'margin:0;font-size:12px;line-height:1.6;color:#6f6b85;">Under the supervision of Chabad in South Beach.<br>Serving Miami-Dade &amp; Broward.</p>' +
        '</td></tr>' +
        '</table>' +
        '</td></tr></table>' +
        '</div>';
}

function mintButton(href, label) {
    return '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>' +
        '<td style="background-color:#cfe8ca;border-radius:999px;">' +
        '<a href="' + href + '" style="' + FONT + 'display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0a0913;text-decoration:none;">' + label + '</a>' +
        '</td></tr></table>';
}

function buildAdminEmail(data) {
    const isBar = data.serviceType === "bar-services";
    const serviceLabel = isBar ? "A bar at an event" : "A cocktail workshop";
    const firstName = (data.name || "").trim().split(" ")[0];

    const rows =
        detailRow("Service", serviceLabel) +
        detailRow("Event type", data.eventType) +
        detailRow("Name", data.name) +
        detailRow("Email", data.email) +
        detailRow("Phone", data.phone) +
        detailRow("Date", data.eventDate) +
        detailRow("Guests", data.guestCount) +
        detailRow("Location", data.location);

    const messageBlock = data.message ?
        '<div style="margin-top:22px;padding:18px 20px;background-color:#0e0b1a;border:1px solid #2e2a44;border-radius:14px;">' +
        '<p style="' + FONT + 'margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6f6b85;">Message</p>' +
        '<p style="' + FONT + 'margin:0;font-size:15px;line-height:1.6;color:#cdc9dc;">' + escapeHtml(data.message) + '</p>' +
        '</div>' : "";

    const html = emailShell(
        "New quote request",
        escapeHtml(data.name) + " wants " + (isBar ? "a bar." : "a workshop."),
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2e2a44;">' + rows + '</table>' +
        messageBlock +
        mintButton("mailto:" + escapeHtml(data.email), "Reply to " + escapeHtml(firstName))
    );

    const text =
        "New quote request received:\n\n" +
        "Service: " + serviceLabel + "\n" +
        (data.eventType ? "Event Type: " + data.eventType + "\n" : "") +
        "Name: " + data.name + "\n" +
        "Email: " + data.email + "\n" +
        "Phone: " + (data.phone || "N/A") + "\n" +
        "Date: " + data.eventDate + "\n" +
        "Guests: " + (data.guestCount || "N/A") + "\n" +
        "Location: " + (data.location || "N/A") + "\n" +
        "Message: " + (data.message || "N/A");

    return {
        subject: "New quote request — " + data.name + " (" + serviceLabel + ")",
        html: html,
        text: text
    };
}

function buildClientEmail(data) {
    const isBar = data.serviceType === "bar-services";
    const serviceLabel = isBar ? "A bar at an event" : "A cocktail workshop";
    const firstName = (data.name || "").trim().split(" ")[0];

    const whatsappLink = "https://wa.me/13393648770?text=" +
        encodeURIComponent("Hi, I would like to get a quote for your services.");

    const rows =
        detailRow("Service", serviceLabel) +
        detailRow("Event type", data.eventType) +
        detailRow("Date", data.eventDate) +
        detailRow("Guests", data.guestCount || "TBD") +
        detailRow("Location", data.location || "TBD");

    const html = emailShell(
        "Request received",
        "We're on it, " + escapeHtml(firstName) + ".",
        '<p style="' + FONT + 'margin:0 0 26px;font-size:16px;line-height:1.6;color:#9b97b3;">Thanks for reaching out. We received your request for <span style="color:#f2eee8;font-weight:700;">' + serviceLabel.toLowerCase() + '</span> and we will be in touch shortly to start designing your bar.</p>' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2e2a44;">' + rows + '</table>' +
        '<p style="' + FONT + 'margin:26px 0 18px;font-size:15px;line-height:1.6;color:#9b97b3;">If you do not hear from us within 24 hours, or anything is urgent, reach us directly on WhatsApp:</p>' +
        mintButton(whatsappLink, "Message us on WhatsApp") +
        '<p style="' + FONT + 'margin:28px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">L\'chaim,<br><span style="color:#f2eee8;font-weight:700;">The Barshtender Team</span></p>'
    );

    const text =
        "Hi " + data.name + ",\n\n" +
        "Thank you for contacting Barshtender! We received your request for: " + serviceLabel + ".\n\n" +
        "Summary:\n" +
        "- Service: " + serviceLabel + "\n" +
        (data.eventType ? "- Event Type: " + data.eventType + "\n" : "") +
        "- Date: " + data.eventDate + "\n" +
        "- Location: " + (data.location || "TBD") + "\n" +
        "- Guests: " + (data.guestCount || "TBD") + "\n\n" +
        "We will review your details and get back to you as soon as possible.\n\n" +
        "If we do not get back to you in the next 24 hours, please reach out on WhatsApp: " + whatsappLink + "\n\n" +
        "L'chaim,\nThe Barshtender Team";

    return {
        subject: "Request received — Barshtender",
        html: html,
        text: text
    };
}

async function sendViaResend(env, message) {
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

// ---------- Request handler ----------

export async function onRequestPost({ request, env }) {
    try {
        const data = await request.json();

        // Validate required fields
        if (!data.name || !data.email || !data.serviceType) {
            return new Response(JSON.stringify({ error: "Missing required fields" }), {
                status: 400,
                headers: { "Content-Type": "application/json" },
            });
        }

        // 1. Save to D1 Database (if available)
        let dbSaveError = null;
        if (env.DB) {
            try {
                const id = crypto.randomUUID();
                const createdAt = new Date().toISOString();

                await env.DB.prepare(`
          INSERT INTO quotes (id, service_type, event_type, name, email, phone, event_date, guest_count, location, message, created_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
                    id,
                    data.serviceType,
                    data.eventType || null,
                    data.name,
                    data.email,
                    data.phone || null,
                    data.eventDate,
                    data.guestCount || null,
                    data.location || null,
                    data.message || null,
                    createdAt
                ).run();

            } catch (dbErr) {
                console.error("Failed to save to D1 database:", dbErr);
                dbSaveError = dbErr.message;
            }
        } else {
            console.warn("DB binding not found. Skipping database save.");
        }

        // 2. Send emails via Resend (when configured)
        const resendConfigured = Boolean(env.RESEND_API_KEY && env.FROM_EMAIL);
        const adminEmail = env.ADMIN_EMAIL || "barshtender@gmail.com";
        let emailError = null;

        if (resendConfigured) {
            try {
                const admin = buildAdminEmail(data);
                const client = buildClientEmail(data);

                await Promise.all([
                    sendViaResend(env, {
                        from: env.FROM_EMAIL,
                        to: [adminEmail],
                        reply_to: data.email,
                        subject: admin.subject,
                        html: admin.html,
                        text: admin.text
                    }),
                    sendViaResend(env, {
                        from: env.FROM_EMAIL,
                        to: [data.email],
                        reply_to: adminEmail,
                        subject: client.subject,
                        html: client.html,
                        text: client.text
                    })
                ]);
            } catch (mailErr) {
                console.error("Failed to send via Resend:", mailErr);
                emailError = mailErr.message;
            }
        }

        // 3. Forward to Google Apps Script.
        //    logOnly: true  -> Sheets row only (Resend already sent the emails)
        //    logOnly: false -> Sheets row + emails (fallback when Resend is
        //    not configured, or a Resend send failed)
        const logOnly = resendConfigured && !emailError;
        try {
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                body: JSON.stringify(Object.assign({}, data, { logOnly: logOnly })),
                headers: { "Content-Type": "application/json" }
            });
        } catch (gsErr) {
            console.error("Failed to forward to Google Script:", gsErr);
            // Don't throw; DB save and/or Resend emails may have succeeded
        }

        return new Response(JSON.stringify({
            status: "success",
            message: "Quote request processed",
            debug_db: dbSaveError ? "DB Save Failed" : "DB Saved",
            debug_email: resendConfigured ? (emailError ? "Resend failed, Apps Script fallback used" : "Sent via Resend") : "Sent via Apps Script"
        }), {
            status: 200,
            headers: { "Content-Type": "application/json" },
        });

    } catch (err) {
        console.error(err);
        return new Response(JSON.stringify({ status: "error", message: "Internal Server Error" }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}

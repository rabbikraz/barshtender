// POST /api/admin/reply
// Sends a branded quote reply to the client via Resend and marks the
// request as "replied".
//
// Body: {
//   id:       quote id (required)
//   subject:  email subject (optional, has default)
//   price:    free text, e.g. "$1,200" (optional)
//   includes: newline-separated list of what's included (optional)
//   message:  personal message, plain text (optional)
// }

import { FONT, escapeHtml, detailRow, mintButton, emailShell, sendViaResend, resendConfigured, isAuthorized, json } from "../../lib/email.js";

export async function onRequestPost({ request, env }) {
    try {
        if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
        if (!env.DB) return json({ error: "DB not configured" }, 500);
        if (!resendConfigured(env)) {
            return json({ error: "Email is not configured yet (set RESEND_API_KEY and FROM_EMAIL env vars)." }, 500);
        }

        const body = await request.json();
        const { id, subject, price, includes, message } = body;
        if (!id) return json({ error: "Missing id" }, 400);
        if (!price && !message) return json({ error: "Add a price or a message before sending." }, 400);

        const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
        if (!quote) return json({ error: "Quote not found" }, 404);

        const isBar = quote.service_type === "bar-services";
        const serviceLabel = isBar ? "A bar at an event" : "A cocktail workshop";
        const firstName = (quote.name || "").trim().split(" ")[0];
        const adminEmail = env.ADMIN_EMAIL || "barshtender@gmail.com";

        // --- Build the email ---
        const rows =
            detailRow("Service", serviceLabel) +
            detailRow("Event type", quote.event_type) +
            detailRow("Date", quote.event_date) +
            detailRow("Guests", quote.guest_count) +
            detailRow("Location", quote.location);

        const priceBlock = price ?
            '<div style="margin-top:26px;padding:24px;background-color:#0e0b1a;border:1px solid #2e2a44;border-radius:14px;text-align:center;">' +
            '<p style="' + FONT + 'margin:0 0 6px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6f6b85;">Your quote</p>' +
            '<p style="' + FONT + 'margin:0;font-size:34px;font-weight:900;letter-spacing:-0.5px;color:#cfe8ca;">' + escapeHtml(price) + '</p>' +
            '</div>' : "";

        // Deposit terms — shown whenever a price is quoted
        const depositBlock = price ?
            '<div style="margin-top:14px;padding:18px 20px;background-color:#0e0b1a;border:1px solid #2e2a44;border-radius:14px;">' +
            '<p style="' + FONT + 'margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#cfe8ca;">Securing your date</p>' +
            '<p style="' + FONT + 'margin:0;font-size:15px;line-height:1.7;color:#cdc9dc;">A <span style="color:#f2eee8;font-weight:700;">50% deposit</span> is required to secure your date.<br>' +
            'Zelle: <span style="color:#f2eee8;font-weight:700;">barshtender@gmail.com</span><br>' +
            '<span style="color:#9b97b3;">For other payment options, just reply to this email or reach us on WhatsApp.</span></p>' +
            '</div>' : "";

        const includeItems = (includes || "").split("\n").map(function (s) { return s.trim(); }).filter(Boolean);
        const includesBlock = includeItems.length ?
            '<div style="margin-top:22px;">' +
            '<p style="' + FONT + 'margin:0 0 10px;font-size:11px;font-weight:700;letter-spacing:2px;text-transform:uppercase;color:#6f6b85;">What\'s included</p>' +
            includeItems.map(function (item, i) {
                const border = i < includeItems.length - 1 ? "border-bottom:1px solid #221d35;" : "";
                return '<p style="' + FONT + 'margin:0;padding:10px 0;' + border + 'font-size:15px;font-weight:600;color:#f2eee8;">' + escapeHtml(item) + '</p>';
            }).join("") +
            '</div>' : "";

        const messageBlock = message ?
            '<p style="' + FONT + 'margin:26px 0 0;font-size:15px;line-height:1.7;color:#cdc9dc;">' + escapeHtml(message).replace(/\n/g, "<br>") + '</p>' : "";

        const html = emailShell(
            "Your quote",
            "Let's build your bar, " + escapeHtml(firstName) + ".",
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2e2a44;">' + rows + '</table>' +
            priceBlock +
            depositBlock +
            includesBlock +
            messageBlock +
            '<p style="' + FONT + 'margin:26px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">Questions or ready to lock it in? Just reply to this email, or reach us on WhatsApp.</p>' +
            mintButton("https://wa.me/13393648770", "Message us on WhatsApp") +
            '<p style="' + FONT + 'margin:28px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">L\'chaim,<br><span style="color:#f2eee8;font-weight:700;">The Barshtender Team</span></p>'
        );

        const text =
            "Hi " + quote.name + ",\n\n" +
            (price ? "Your quote: " + price + "\n\n" : "") +
            (price ? "Securing your date: a 50% deposit is required to secure your date.\nZelle: barshtender@gmail.com\nFor other payment options, just reply to this email or reach us on WhatsApp.\n\n" : "") +
            (includeItems.length ? "What's included:\n" + includeItems.map(function (i) { return "- " + i; }).join("\n") + "\n\n" : "") +
            (message ? message + "\n\n" : "") +
            "Questions or ready to lock it in? Just reply to this email, or WhatsApp us: https://wa.me/13393648770\n\n" +
            "L'chaim,\nThe Barshtender Team";

        await sendViaResend(env, {
            from: env.FROM_EMAIL,
            to: [quote.email],
            reply_to: adminEmail,
            subject: subject || ("Your Barshtender quote" + (quote.event_date ? " — " + quote.event_date : "")),
            html: html,
            text: text
        });

        await env.DB.prepare("UPDATE quotes SET status = 'replied' WHERE id = ?").bind(id).run();

        return json({ success: true });

    } catch (err) {
        console.error(err);
        return json({ error: "Failed to send: " + err.message }, 500);
    }
}

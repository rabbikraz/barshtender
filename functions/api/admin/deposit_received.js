// POST /api/admin/deposit_received
// Marks a quote as deposit-received and emails the client a thank-you
// with their personalized menu-builder link.
//
// Body: { id: quote id }

import { FONT, escapeHtml, mintButton, emailShell, sendViaResend, resendConfigured, isAuthorized, json } from "../../lib/email.js";
import { ensureTables } from "../../lib/db.js";

export async function onRequestPost({ request, env }) {
    try {
        if (!isAuthorized(request)) return json({ error: "Unauthorized" }, 401);
        if (!env.DB) return json({ error: "DB not configured" }, 500);
        if (!resendConfigured(env)) {
            return json({ error: "Email is not configured yet (set RESEND_API_KEY and FROM_EMAIL env vars)." }, 500);
        }

        const { id } = await request.json();
        if (!id) return json({ error: "Missing id" }, 400);

        const quote = await env.DB.prepare("SELECT * FROM quotes WHERE id = ?").bind(id).first();
        if (!quote) return json({ error: "Quote not found" }, 404);

        await ensureTables(env);

        // Reuse an existing menu link for this quote, or create one
        let link = await env.DB.prepare("SELECT * FROM menu_links WHERE quote_id = ? ORDER BY created_at DESC LIMIT 1").bind(id).first();
        if (!link) {
            const token = crypto.randomUUID().replace(/-/g, "");
            await env.DB.prepare("INSERT INTO menu_links (token, quote_id, created_at) VALUES (?, ?, ?)")
                .bind(token, id, new Date().toISOString()).run();
            link = { token: token };
        }

        const origin = new URL(request.url).origin;
        const url = origin + "/menu-builder?t=" + link.token;
        const firstName = (quote.name || "").trim().split(" ")[0];
        const adminEmail = env.ADMIN_EMAIL || "barshtender@gmail.com";

        const html = emailShell(
            "Deposit received",
            "You're locked in, " + escapeHtml(firstName) + ".",
            '<p style="' + FONT + 'margin:0 0 18px;font-size:16px;line-height:1.6;color:#9b97b3;">Thank you — your deposit came through and <span style="color:#f2eee8;font-weight:700;">your date is secured</span>' + (quote.event_date ? ' for <span style="color:#f2eee8;font-weight:700;">' + escapeHtml(quote.event_date) + '</span>' : '') + '.</p>' +
            '<p style="' + FONT + 'margin:0 0 18px;font-size:16px;line-height:1.6;color:#9b97b3;">Now the fun part: let\'s build your menu. Browse the full drink list and choose either:</p>' +
            '<p style="' + FONT + 'margin:0;padding:14px 0;border-top:1px solid #2e2a44;border-bottom:1px solid #221d35;font-size:15px;font-weight:700;color:#f2eee8;">4 cocktails &nbsp;+&nbsp; 1 mocktail</p>' +
            '<p style="' + FONT + 'margin:0 0 4px;padding:14px 0;border-bottom:1px solid #2e2a44;font-size:15px;font-weight:700;color:#f2eee8;">3 cocktails &nbsp;+&nbsp; 2 mocktails</p>' +
            '<p style="' + FONT + 'margin:18px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">Have something in mind that isn\'t on the list? You can add your own — we will build it.</p>' +
            mintButton(url, "Build my menu") +
            '<p style="' + FONT + 'margin:24px 0 0;font-size:13px;line-height:1.6;color:#6f6b85;">This link is personal to your event. If the button doesn\'t work, copy this address:<br><a href="' + url + '" style="color:#8b88a0;">' + url + '</a></p>' +
            '<p style="' + FONT + 'margin:28px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">L\'chaim,<br><span style="color:#f2eee8;font-weight:700;">The Barshtender Team</span></p>'
        );

        const text =
            "Hi " + quote.name + ",\n\n" +
            "Thank you - your deposit came through and your date is secured" + (quote.event_date ? " for " + quote.event_date : "") + ".\n\n" +
            "Now the fun part: build your drink menu! Choose either 4 cocktails + 1 mocktail, or 3 cocktails + 2 mocktails. " +
            "And if you have something in mind that isn't on the list, you can add your own.\n\n" +
            "Build your menu here: " + url + "\n\n" +
            "L'chaim,\nThe Barshtender Team";

        await sendViaResend(env, {
            from: env.FROM_EMAIL,
            to: [quote.email],
            reply_to: adminEmail,
            subject: "Deposit received — let's build your menu",
            html: html,
            text: text
        });

        await env.DB.prepare("UPDATE quotes SET status = 'deposit' WHERE id = ?").bind(id).run();

        return json({ success: true, url: url });

    } catch (err) {
        console.error(err);
        return json({ error: "Failed: " + err.message }, 500);
    }
}

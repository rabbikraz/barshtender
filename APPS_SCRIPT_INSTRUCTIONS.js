function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getActiveSheet();

    // Set up headers if they don't exist
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Service Type", "Event Type", "Name", "Email", "Phone", "Event Date", "Guest Count", "Location", "Message"]);
    }
}

// ============================================================
// Barshtender email theme (matches the site design)
// bg #0a0913 · card #14101f · mint #cfe8ca · text #f2eee8
// muted #9b97b3 · dim #6f6b85 · borders rgba-mint
// Email-safe: table layout, inline styles, web-safe font stack.
// ============================================================

function escapeHtml_(s) {
    return String(s == null ? "" : s)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

var BT_FONT = "font-family:Archivo,'Helvetica Neue',Helvetica,Arial,sans-serif;";

// One row of the details table
function btRow_(label, value) {
    if (!value) return "";
    return '' +
        '<tr>' +
        '<td style="' + BT_FONT + 'padding:10px 0;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6f6b85;vertical-align:top;white-space:nowrap;padding-right:24px;">' + escapeHtml_(label) + '</td>' +
        '<td style="' + BT_FONT + 'padding:10px 0;font-size:15px;font-weight:600;color:#f2eee8;vertical-align:top;">' + escapeHtml_(value) + '</td>' +
        '</tr>';
}

// Shared shell: dark page, centered card, mint headline
function btEmailShell_(kickerText, headlineHtml, bodyHtml) {
    return '' +
        '<div style="margin:0;padding:0;background-color:#0a0913;">' +
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#0a0913;">' +
        '<tr><td align="center" style="padding:40px 16px;">' +

        '<table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%;">' +

        // Wordmark
        '<tr><td align="center" style="padding:0 0 28px;">' +
        '<span style="' + BT_FONT + 'font-size:20px;font-weight:900;letter-spacing:3px;text-transform:uppercase;color:#cfe8ca;">Barshtender</span>' +
        '</td></tr>' +

        // Card
        '<tr><td style="background-color:#14101f;border:1px solid #2e2a44;border-radius:20px;padding:40px 36px;">' +
        '<p style="' + BT_FONT + 'margin:0 0 14px;font-size:12px;font-weight:700;letter-spacing:2.5px;text-transform:uppercase;color:#cfe8ca;">' + kickerText + '</p>' +
        '<h1 style="' + BT_FONT + 'margin:0 0 18px;font-size:30px;line-height:1.05;font-weight:900;letter-spacing:-0.5px;color:#f2eee8;">' + headlineHtml + '</h1>' +
        bodyHtml +
        '</td></tr>' +

        // Footer
        '<tr><td align="center" style="padding:28px 12px 0;">' +
        '<p style="' + BT_FONT + 'margin:0 0 6px;font-size:13px;font-weight:700;color:#cfe8ca;">Kosher cocktails, reimagined.</p>' +
        '<p style="' + BT_FONT + 'margin:0;font-size:12px;line-height:1.6;color:#6f6b85;">Under the supervision of Chabad in South Beach.<br>Serving Miami-Dade &amp; Broward.</p>' +
        '</td></tr>' +

        '</table>' +
        '</td></tr></table>' +
        '</div>';
}

function doPost(e) {
    try {
        const doc = SpreadsheetApp.getActiveSpreadsheet();
        const sheet = doc.getActiveSheet();
        const data = JSON.parse(e.postData.contents);
        const timestamp = new Date();

        // Add row to spreadsheet
        sheet.appendRow([
            timestamp,
            data.serviceType || "",
            data.eventType || "",
            data.name || "",
            data.email || "",
            data.phone || "",
            data.eventDate || "",
            data.guestCount || "",
            data.location || "",
            data.message || ""
        ]);

        const isBar = data.serviceType === "bar-services";
        const serviceLabel = isBar ? "A bar at an event" : "A cocktail workshop";
        const firstName = (data.name || "").trim().split(" ")[0];

        const whatsappMessage = encodeURIComponent("Hi, I would like to get a quote for your services.");
        const whatsappLink = "https://wa.me/13393648770?text=" + whatsappMessage;

        // ---------- 1. Notification to Barshtender ----------
        const adminEmail = "barshtender@gmail.com";
        const subject = "New quote request — " + data.name + " (" + serviceLabel + ")";

        const adminDetailsRows =
            btRow_("Service", serviceLabel) +
            btRow_("Event type", data.eventType) +
            btRow_("Name", data.name) +
            btRow_("Email", data.email) +
            btRow_("Phone", data.phone) +
            btRow_("Date", data.eventDate) +
            btRow_("Guests", data.guestCount) +
            btRow_("Location", data.location);

        const adminMessageBlock = data.message ?
            '<div style="margin-top:22px;padding:18px 20px;background-color:#0e0b1a;border:1px solid #2e2a44;border-radius:14px;">' +
            '<p style="' + BT_FONT + 'margin:0 0 8px;font-size:11px;font-weight:700;letter-spacing:1.5px;text-transform:uppercase;color:#6f6b85;">Message</p>' +
            '<p style="' + BT_FONT + 'margin:0;font-size:15px;line-height:1.6;color:#cdc9dc;">' + escapeHtml_(data.message) + '</p>' +
            '</div>' : "";

        const adminHtml = btEmailShell_(
            "New quote request",
            escapeHtml_(data.name) + " wants " + (isBar ? "a bar." : "a workshop."),
            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2e2a44;">' + adminDetailsRows + '</table>' +
            adminMessageBlock +
            '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-top:28px;"><tr>' +
            '<td style="background-color:#cfe8ca;border-radius:999px;">' +
            '<a href="mailto:' + escapeHtml_(data.email) + '" style="' + BT_FONT + 'display:inline-block;padding:14px 28px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0a0913;text-decoration:none;">Reply to ' + escapeHtml_(firstName) + '</a>' +
            '</td></tr></table>'
        );

        const adminText =
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

        MailApp.sendEmail({
            to: adminEmail,
            subject: subject,
            body: adminText,
            htmlBody: adminHtml
        });

        // ---------- 2. Confirmation to the client ----------
        const clientSubject = "Request received — Barshtender";

        const clientDetailsRows =
            btRow_("Service", serviceLabel) +
            btRow_("Event type", data.eventType) +
            btRow_("Date", data.eventDate) +
            btRow_("Guests", data.guestCount || "TBD") +
            btRow_("Location", data.location || "TBD");

        const clientHtml = btEmailShell_(
            "Request received",
            "We're on it, " + escapeHtml_(firstName) + ".",
            '<p style="' + BT_FONT + 'margin:0 0 26px;font-size:16px;line-height:1.6;color:#9b97b3;">Thanks for reaching out. We received your request for <span style="color:#f2eee8;font-weight:700;">' + serviceLabel.toLowerCase() + '</span> and we will be in touch shortly to start designing your bar.</p>' +

            '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid #2e2a44;">' + clientDetailsRows + '</table>' +

            '<p style="' + BT_FONT + 'margin:26px 0 18px;font-size:15px;line-height:1.6;color:#9b97b3;">If you do not hear from us within 24 hours, or anything is urgent, reach us directly on WhatsApp:</p>' +

            '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>' +
            '<td style="background-color:#cfe8ca;border-radius:999px;">' +
            '<a href="' + whatsappLink + '" style="' + BT_FONT + 'display:inline-block;padding:15px 30px;font-size:13px;font-weight:800;letter-spacing:1px;text-transform:uppercase;color:#0a0913;text-decoration:none;">Message us on WhatsApp</a>' +
            '</td></tr></table>' +

            '<p style="' + BT_FONT + 'margin:28px 0 0;font-size:15px;line-height:1.6;color:#9b97b3;">L\'chaim,<br><span style="color:#f2eee8;font-weight:700;">The Barshtender Team</span></p>'
        );

        const clientText =
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

        MailApp.sendEmail({
            to: data.email,
            subject: clientSubject,
            body: clientText,
            htmlBody: clientHtml
        });

        return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Quote request submitted successfully" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

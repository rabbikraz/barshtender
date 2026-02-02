function setup() {
    const doc = SpreadsheetApp.getActiveSpreadsheet();
    const sheet = doc.getActiveSheet();

    // Set up headers if they don't exist
    if (sheet.getLastRow() === 0) {
        sheet.appendRow(["Timestamp", "Service Type", "Event Type", "Name", "Email", "Phone", "Event Date", "Guest Count", "Location", "Message"]);
    }
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

        // Send email notification to Barshtender Admin
        const adminEmail = "barshtender@gmail.com";
        const subject = `New Quote Request from ${data.name}`;
        const body = `
      New quote request received:
      
      Service Type: ${data.serviceType}
      Event Type: ${data.eventType || "N/A"}
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone}
      Event Date: ${data.eventDate}
      Guests: ${data.guestCount}
      Location: ${data.location}
      Message: ${data.message}
    `;

        MailApp.sendEmail({
            to: adminEmail,
            subject: subject,
            body: body
        });

        // Send confirmation email to client
        const clientSubject = "We received your quote request! - Barshtender";

        // Create WhatsApp link
        // Number: 13393648770
        // Message: "Hi, I would like to get a quote for your services."
        const whatsappMessage = encodeURIComponent("Hi, I would like to get a quote for your services.");
        const whatsappLink = `https://wa.me/13393648770?text=${whatsappMessage}`;

        let clientBody = `
      Hi ${data.name},
      
      Thank you for contacting Barshtender! We have received your request for a ${data.serviceType === 'bar-services' ? 'Bar at your event' : 'Cocktail Workshop'}.
      
      Here is a summary of what you requested:
      - Service: ${data.serviceType === 'bar-services' ? 'Bar Services' : 'Cocktail Workshop'}
      ${data.eventType ? `- Event Type: ${data.eventType}` : ''}
      - Date: ${data.eventDate}
      - Location: ${data.location || 'TBD'}
      - Guests: ${data.guestCount || 'TBD'}
      
      We will review your details and get back to you as soon as possible.
      
      If we do not get back to you in the next 24 hours, please feel free to reach out to us on WhatsApp: ${whatsappLink}
      
      Cheers,
      The Barshtender Team
    `;

        // Send HTML version for better clicking experience
        const clientHtmlBody = `
      <div style="font-family: Arial, sans-serif; color: #333;">
        <h2>Hi ${data.name},</h2>
        
        <p>Thank you for contacting Barshtender! We have received your request for a <strong>${data.serviceType === 'bar-services' ? 'Bar at your event' : 'Cocktail Workshop'}</strong>.</p>
        
        <h3>Here is a summary of what you requested:</h3>
        <ul>
          <li><strong>Service:</strong> ${data.serviceType === 'bar-services' ? 'Bar Services' : 'Cocktail Workshop'}</li>
          ${data.eventType ? `<li><strong>Event Type:</strong> ${data.eventType}</li>` : ''}
          <li><strong>Date:</strong> ${data.eventDate}</li>
          <li><strong>Location:</strong> ${data.location || 'TBD'}</li>
          <li><strong>Guests:</strong> ${data.guestCount || 'TBD'}</li>
        </ul>
        
        <p>We will review your details and get back to you as soon as possible.</p>
        
        <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
        
        <p style="font-size: 0.9em; color: #666;">
          If we do not get back to you in the next 24 hours, please feel free to reach out to us on WhatsApp: 
          <br>
          <a href="${whatsappLink}" style="display: inline-block; background-color: #25D366; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 10px; font-weight: bold;">
            Chat on WhatsApp
          </a>
          <br>
          or click here: <a href="${whatsappLink}">${whatsappLink}</a>
        </p>
        
        <p>Cheers,<br>The Barshtender Team</p>
      </div>
    `;

        MailApp.sendEmail({
            to: data.email,
            subject: clientSubject,
            body: clientBody,
            htmlBody: clientHtmlBody
        });

        return ContentService.createTextOutput(JSON.stringify({ "status": "success", "message": "Quote request submitted successfully" }))
            .setMimeType(ContentService.MimeType.JSON);

    } catch (error) {
        return ContentService.createTextOutput(JSON.stringify({ "status": "error", "message": error.toString() }))
            .setMimeType(ContentService.MimeType.JSON);
    }
}

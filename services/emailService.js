import nodemailer from "nodemailer";
import "dotenv/config";

// Create reusable transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || "smtp.gmail.com",
  port: parseInt(process.env.SMTP_PORT || "587"),
  secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || process.env.EMAIL_USER,
    pass: process.env.SMTP_PASS || process.env.EMAIL_PASSWORD,
  },
});

// Verify transporter configuration
transporter.verify(function (error, success) {
  if (error) {
    console.error("❌ Email service configuration error:", error);
    console.warn("⚠️  Email notifications will not be sent. Please configure SMTP settings in .env");
  } else {
    console.log("✅ Email service is ready to send messages");
  }
});

/**
 * Send reminder email to user
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email address
 * @param {String} options.userName - User's name
 * @param {Object} options.reminder - Reminder object
 * @returns {Promise<Object>} - Email send result
 */
export const sendReminderEmail = async ({ to, userName, reminder }) => {
  // Check if email is configured
  if (!process.env.SMTP_USER && !process.env.EMAIL_USER) {
    console.warn("⚠️  Email not configured. Skipping email send.");
    return { success: false, error: "Email service not configured" };
  }

  // Check if recipient email exists
  if (!to) {
    console.warn("⚠️  User email not found. Skipping email send.");
    return { success: false, error: "User email not found" };
  }

  try {
    const reminderTypeEmoji = {
      medicine: "💊",
      exercise: "💪",
      yoga: "🧘",
      doctor_visit: "🏥",
      other: "📅",
    };

    const priorityLabels = {
      high: "🔴 High Priority",
      medium: "🟡 Medium Priority",
      low: "🟢 Low Priority",
    };

    const reminderTime = new Date(reminder.nextReminder || reminder.scheduledTime).toLocaleString();

    const mailOptions = {
      from: `"Health Analyzer" <${process.env.SMTP_USER || process.env.EMAIL_USER}>`,
      to: to,
      subject: `${reminderTypeEmoji[reminder.type] || "📅"} Health Reminder: ${reminder.title}`,
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
              background-color: #f5f5f5;
            }
            .container {
              background-color: #ffffff;
              border-radius: 8px;
              padding: 30px;
              box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            }
            .header {
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
              color: white;
              padding: 20px;
              border-radius: 8px 8px 0 0;
              margin: -30px -30px 30px -30px;
              text-align: center;
            }
            .reminder-icon {
              font-size: 48px;
              margin-bottom: 10px;
            }
            h1 {
              margin: 0;
              font-size: 24px;
            }
            .reminder-details {
              background-color: #f9fafb;
              border-left: 4px solid #10b981;
              padding: 20px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .detail-row {
              display: flex;
              justify-content: space-between;
              padding: 8px 0;
              border-bottom: 1px solid #e5e7eb;
            }
            .detail-row:last-child {
              border-bottom: none;
            }
            .detail-label {
              font-weight: 600;
              color: #6b7280;
            }
            .detail-value {
              color: #111827;
            }
            .description {
              background-color: #eff6ff;
              border-left: 4px solid #3b82f6;
              padding: 15px;
              margin: 20px 0;
              border-radius: 4px;
            }
            .footer {
              margin-top: 30px;
              padding-top: 20px;
              border-top: 1px solid #e5e7eb;
              text-align: center;
              color: #6b7280;
              font-size: 14px;
            }
            .button {
              display: inline-block;
              padding: 12px 24px;
              background: linear-gradient(135deg, #10b981 0%, #06b6d4 100%);
              color: white;
              text-decoration: none;
              border-radius: 6px;
              margin: 20px 0;
            }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <div class="reminder-icon">${reminderTypeEmoji[reminder.type] || "📅"}</div>
              <h1>Health Reminder</h1>
            </div>
            
            <p>Hello ${userName || "User"},</p>
            
            <p>This is a reminder for your scheduled health activity:</p>
            
            <div class="reminder-details">
              <div class="detail-row">
                <span class="detail-label">Reminder:</span>
                <span class="detail-value"><strong>${reminder.title}</strong></span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Type:</span>
                <span class="detail-value">${reminder.type.charAt(0).toUpperCase() + reminder.type.slice(1).replace("_", " ")}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Scheduled Time:</span>
                <span class="detail-value">${reminderTime}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Frequency:</span>
                <span class="detail-value">${reminder.frequency.charAt(0).toUpperCase() + reminder.frequency.slice(1)}</span>
              </div>
              <div class="detail-row">
                <span class="detail-label">Priority:</span>
                <span class="detail-value">${priorityLabels[reminder.priority] || reminder.priority}</span>
              </div>
            </div>
            
            ${reminder.description ? `
            <div class="description">
              <strong>Additional Notes:</strong>
              <p>${reminder.description}</p>
            </div>
            ` : ""}
            
            <p style="text-align: center;">
              <a href="${process.env.FRONTEND_URL || "http://localhost:5173"}/reminders" class="button">
                View All Reminders
              </a>
            </p>
            
            <div class="footer">
              <p>This is an automated reminder from Health Analyzer</p>
              <p>Please don't reply to this email</p>
            </div>
          </div>
        </body>
        </html>
      `,
      text: `
        Health Reminder
        
        Hello ${userName || "User"},
        
        This is a reminder for your scheduled health activity:
        
        Reminder: ${reminder.title}
        Type: ${reminder.type}
        Scheduled Time: ${reminderTime}
        Frequency: ${reminder.frequency}
        Priority: ${reminder.priority}
        
        ${reminder.description ? `Description: ${reminder.description}` : ""}
        
        View all reminders: ${process.env.FRONTEND_URL || "http://localhost:5173"}/reminders
        
        This is an automated reminder from Health Analyzer.
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✅ Email sent successfully to ${to}:`, info.messageId);
    return { success: true, messageId: info.messageId };
  } catch (error) {
    console.error("❌ Error sending email to", to, ":", error);
    return { success: false, error: error.message };
  }
};

export default transporter;



/**
 * Branded HTML email templates for PetAge reminders.
 * Brand voice: warm, owner-first, never clinical.
 */

const HEADER_COLOR = "#0B1F3A";
const PRIMARY_COLOR = "#1C5EA8";
const SURFACE_COLOR = "#F7F9FC";

function wrapTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:${SURFACE_COLOR};font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:${SURFACE_COLOR};padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="100%" style="max-width:520px;background:#ffffff;border-radius:16px;overflow:hidden;">
          <!-- Header -->
          <tr>
            <td style="background:${HEADER_COLOR};padding:24px 32px;">
              <h1 style="margin:0;color:#ffffff;font-size:20px;font-weight:600;">🐾 PetAge</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:32px;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 32px 24px;border-top:1px solid #DDE4EF;">
              <p style="margin:0;font-size:12px;color:#8896AA;text-align:center;">
                You're receiving this because you have email reminders turned on in PetAge.
                <br />Adjust your preferences anytime in Settings.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function buildVaccineReminderHtml(
  petName: string,
  vaccineName: string,
  expiryDate: string
): string {
  return wrapTemplate(`
    <h2 style="margin:0 0 8px;color:${HEADER_COLOR};font-size:18px;font-weight:600;">
      Vaccine reminder for ${petName} 💉
    </h2>
    <p style="margin:0 0 24px;color:#4A5568;font-size:15px;line-height:1.6;">
      Hey there! Just a friendly heads-up — <strong>${petName}</strong>'s 
      <strong>${vaccineName}</strong> vaccine is due on <strong>${expiryDate}</strong>.
      Time to book that appointment!
    </p>
    <a href="https://petage.app/dashboard" 
       style="display:inline-block;padding:12px 28px;background:${PRIMARY_COLOR};color:#ffffff;
              text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
      View in PetAge →
    </a>
  `);
}

export function buildMedicationReminderHtml(
  petName: string,
  medName: string,
  nextDueDate: string
): string {
  return wrapTemplate(`
    <h2 style="margin:0 0 8px;color:${HEADER_COLOR};font-size:18px;font-weight:600;">
      Time to give ${petName} their meds 💊
    </h2>
    <p style="margin:0 0 24px;color:#4A5568;font-size:15px;line-height:1.6;">
      <strong>${petName}</strong>'s <strong>${medName}</strong> is due on 
      <strong>${nextDueDate}</strong>. You can mark it as given right from the app!
    </p>
    <a href="https://petage.app/dashboard" 
       style="display:inline-block;padding:12px 28px;background:${PRIMARY_COLOR};color:#ffffff;
              text-decoration:none;border-radius:10px;font-size:14px;font-weight:600;">
      Mark as Given →
    </a>
  `);
}

import type { FirstOrderInfo } from './firstOrder';

export const SUPPORT_CONTACT = {
  name: 'Lena Hoffmann',
  role: 'Ihre persönliche Ansprechpartnerin',
  phone: '+49 2433 97 34 120',
  phoneHref: '+4924339734120',
  hours: 'Mo-Fr, 8:00-18:00 Uhr',
};

const MAX_LISTED_ITEMS = 4;

export interface WelcomeEmail {
  to: string | null;
  subject: string;
  html: string;
  text: string;
}

const escapeHtml = (value: string) =>
  value.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

export const formatMoney = (amount: number, currencyIso: string) =>
  new Intl.NumberFormat('de-DE', { style: 'currency', currency: currencyIso }).format(amount);

export const formatDate = (iso: string | null) =>
  iso ? new Intl.DateTimeFormat('de-DE', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(iso)) : null;

const fullName = (info: FirstOrderInfo) => [info.firstName, info.lastName].filter(Boolean).join(' ') || info.company || '';

export function buildWelcomeEmail(info: FirstOrderInfo): WelcomeEmail {
  const shop = info.shopName || 'unser Shop';
  const name = fullName(info);
  const greeting = name ? `Hallo ${name},` : 'Hallo,';
  const date = formatDate(info.orderDate);
  const total = formatMoney(info.totalGross, info.currencyIso);
  const listed = info.items.slice(0, MAX_LISTED_ITEMS);
  const moreCount = info.items.length - listed.length;
  const firstItem = info.items[0]?.name;
  const subject = `Willkommen bei ${shop}! Ihre erste Bestellung ${info.orderNumber}`;

  const intro =
    `schön, dass Sie da sind! Mit Ihrer Bestellung <strong>${escapeHtml(info.orderNumber)}</strong>` +
    (date ? ` vom ${escapeHtml(date)}` : '') +
    ` haben Sie zum ersten Mal bei uns eingekauft. Darüber freuen wir uns sehr` +
    (firstItem ? `, und wir sind sicher, dass Ihnen <strong>${escapeHtml(firstItem)}</strong> gefallen wird.` : '.');

  const itemRows = listed
    .map(
      item => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #E7E5DF;font-size:15px;color:#0B1B45;">
                  <span style="display:inline-block;min-width:28px;color:#6B7280;">${item.quantity}&times;</span>${escapeHtml(item.name)}
                </td>
                <td align="right" style="padding:10px 0;border-bottom:1px solid #E7E5DF;font-size:15px;color:#0B1B45;white-space:nowrap;">
                  ${formatMoney(item.totalGross, info.currencyIso)}
                </td>
              </tr>`,
    )
    .join('');

  const moreRow =
    moreCount > 0
      ? `
              <tr>
                <td colspan="2" style="padding:10px 0;border-bottom:1px solid #E7E5DF;font-size:14px;color:#6B7280;">
                  + ${moreCount} weitere${moreCount === 1 ? 'r Artikel' : ' Artikel'}
                </td>
              </tr>`
      : '';

  const step = (n: number, title: string, body: string) => `
              <tr>
                <td valign="top" style="padding:0 14px 16px 0;width:32px;">
                  <div style="width:32px;height:32px;border-radius:16px;background:#89D2FF;color:#0B1B45;font-weight:700;font-size:15px;line-height:32px;text-align:center;">${n}</div>
                </td>
                <td valign="top" style="padding:0 0 16px 0;font-size:15px;line-height:22px;color:#374151;">
                  <strong style="color:#0B1B45;">${title}</strong><br>${body}
                </td>
              </tr>`;

  const html = `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:#EEEEE7;font-family:Inter,Segoe UI,Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;">Danke für Ihre erste Bestellung ${escapeHtml(info.orderNumber)}. Wir sind für Sie da: ${SUPPORT_CONTACT.phone}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EEEEE7;">
    <tr>
      <td align="center" style="padding:32px 16px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;background:#FFFFFF;border-radius:16px;overflow:hidden;">
          <tr>
            <td style="background:#0B1B45;background-image:linear-gradient(135deg,#0B1B45 0%,#2722F8 100%);padding:40px 40px 36px 40px;">
              <div style="font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#89D2FF;font-weight:600;">${escapeHtml(shop)}</div>
              <h1 style="margin:12px 0 0 0;font-size:30px;line-height:36px;color:#FFFFFF;font-weight:700;">Willkommen an Bord!</h1>
              <p style="margin:10px 0 0 0;font-size:16px;line-height:24px;color:#D6E4FF;">Ihre erste Bestellung ist bei uns angekommen.</p>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 40px 8px 40px;font-size:16px;line-height:25px;color:#374151;">
              <p style="margin:0 0 16px 0;color:#0B1B45;font-weight:600;">${escapeHtml(greeting)}</p>
              <p style="margin:0 0 24px 0;">${intro}</p>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F7F7F3;border-radius:12px;">
                <tr>
                  <td style="padding:20px 24px 8px 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#6B7280;font-weight:600;">Ihre Bestellung</td>
                        <td align="right" style="font-size:13px;color:#6B7280;">Nr. ${escapeHtml(info.orderNumber)}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
                <tr>
                  <td style="padding:0 24px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${itemRows}${moreRow}
                      <tr>
                        <td style="padding:14px 0 18px 0;font-size:15px;font-weight:700;color:#0B1B45;">Gesamtsumme</td>
                        <td align="right" style="padding:14px 0 18px 0;font-size:17px;font-weight:700;color:#0B1B45;white-space:nowrap;">${total}</td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:32px 40px 8px 40px;">
              <h2 style="margin:0 0 18px 0;font-size:18px;color:#0B1B45;">So geht es jetzt weiter</h2>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${step(1, 'Wir packen Ihr Paket', 'Ihre Artikel werden sorgfältig zusammengestellt und verpackt.')}${step(2, 'Versandbestätigung', 'Sobald das Paket unterwegs ist, erhalten Sie eine E-Mail mit Sendungsverfolgung.')}${step(3, 'Viel Freude damit', 'Etwas passt nicht? Rufen Sie uns einfach an, wir finden eine Lösung.')}
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:8px 40px 36px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:2px solid #89D2FF;border-radius:12px;">
                <tr>
                  <td style="padding:22px 24px;">
                    <div style="font-size:12px;letter-spacing:1px;text-transform:uppercase;color:#2722F8;font-weight:700;">Persönlicher Kontakt</div>
                    <div style="margin-top:8px;font-size:16px;color:#0B1B45;font-weight:600;">${escapeHtml(SUPPORT_CONTACT.name)}, ${escapeHtml(SUPPORT_CONTACT.role)}</div>
                    <div style="margin-top:4px;font-size:15px;line-height:22px;color:#374151;">Fragen zu Ihrer Bestellung? Ich bin gerne persönlich für Sie da.</div>
                    <a href="tel:${SUPPORT_CONTACT.phoneHref}" style="display:inline-block;margin-top:16px;padding:12px 22px;background:#FB581F;color:#FFFFFF;text-decoration:none;font-weight:700;font-size:17px;border-radius:999px;">&#9742;&nbsp; ${SUPPORT_CONTACT.phone}</a>
                    <div style="margin-top:10px;font-size:13px;color:#6B7280;">${SUPPORT_CONTACT.hours}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="padding:0 40px 36px 40px;font-size:16px;line-height:25px;color:#374151;">
              Herzliche Grüße<br>
              <strong style="color:#0B1B45;">${escapeHtml(SUPPORT_CONTACT.name)} und das Team von ${escapeHtml(shop)}</strong>
            </td>
          </tr>
          <tr>
            <td style="background:#F7F7F3;padding:20px 40px;font-size:12px;line-height:18px;color:#9CA3AF;text-align:center;">
              Sie erhalten diese E-Mail, weil Sie bei ${escapeHtml(shop)} bestellt haben.${info.customerNumber ? ` Kundennummer: ${escapeHtml(info.customerNumber)}` : ''}
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const textItems = listed.map(item => `  ${item.quantity}x ${item.name} (${formatMoney(item.totalGross, info.currencyIso)})`);
  if (moreCount > 0) textItems.push(`  + ${moreCount} weitere Artikel`);

  const text = [
    greeting,
    '',
    `schön, dass Sie da sind! Mit Ihrer Bestellung ${info.orderNumber}${date ? ` vom ${date}` : ''} haben Sie zum ersten Mal bei ${shop} eingekauft. Darüber freuen wir uns sehr.`,
    '',
    'Ihre Bestellung:',
    ...textItems,
    `  Gesamtsumme: ${total}`,
    '',
    'Wir packen Ihr Paket und schicken Ihnen eine Versandbestätigung mit Sendungsverfolgung, sobald es unterwegs ist.',
    '',
    `Fragen? Ich bin persönlich für Sie da: ${SUPPORT_CONTACT.phone} (${SUPPORT_CONTACT.hours})`,
    '',
    'Herzliche Grüße',
    `${SUPPORT_CONTACT.name} und das Team von ${shop}`,
  ].join('\n');

  return { to: info.email, subject, html, text };
}

import { describe, expect, it } from 'vitest';
import type { FirstOrderInfo } from './firstOrder';
import { buildWelcomeEmail, SUPPORT_CONTACT } from './welcomeEmail';

export const sampleOrder: FirstOrderInfo = {
  orderId: 'o-1',
  orderNumber: 'AU-2026-10418',
  orderDate: '2026-09-30T14:12:00Z',
  customerNumber: '24187',
  shopName: 'Kaffeerösterei Nordlicht',
  salutation: 'Frau',
  firstName: 'Anna',
  lastName: 'Schmidt',
  company: null,
  email: 'anna.schmidt@example.com',
  items: [
    { name: 'Espresso "Polarnacht" 1 kg', quantity: 2, totalGross: 47.8 },
    { name: 'Handmühle Classic', quantity: 1, totalGross: 64.9 },
  ],
  totalGross: 117.6,
  currencyIso: 'EUR',
  orderCount: 1,
  isFirstOrder: true,
  firstOrderNumber: 'AU-2026-10418',
  firstOrderDate: '2026-09-30T14:12:00Z',
};

describe('buildWelcomeEmail', () => {
  it('refers to the order and contains the phone contact', () => {
    const email = buildWelcomeEmail(sampleOrder);
    expect(email.to).toBe('anna.schmidt@example.com');
    expect(email.subject).toContain('AU-2026-10418');
    expect(email.html).toContain('Hallo Anna Schmidt,');
    expect(email.html).toContain(`tel:${SUPPORT_CONTACT.phoneHref}`);
    expect(email.text).toContain(SUPPORT_CONTACT.phone);
    expect(email.text).toContain('2x Espresso');
  });

  it('escapes customer data in the HTML', () => {
    const email = buildWelcomeEmail({ ...sampleOrder, firstName: '<script>', items: [] });
    expect(email.html).not.toContain('<script>');
    expect(email.html).toContain('&lt;script&gt;');
  });
});

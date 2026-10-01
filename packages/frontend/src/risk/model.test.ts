import { describe, expect, it } from 'vitest';
import { assessCustomer, AVAILABLE_WITHOUT_RETURNS } from './model';
import type { Address, Customer, Order } from './types';

const NOW = new Date('2026-10-01');
const addr = (id: string): Address => ({
  id,
  street: `Straße ${id}`,
  zip: '20095',
  city: 'Hamburg',
  country: 'DE',
});

function order(id: string, date: string, ship: Address, bill = ship): Order {
  return {
    id,
    date,
    shippingAddress: ship,
    billingAddress: bill,
    items: [{ sku: 'A', name: 'Artikel', category: 'Mode', quantity: 1, unitPrice: 100 }],
  };
}

function customer(partial: Partial<Customer>): Customer {
  return { id: 'c', name: 'Test', email: 't@e.de', since: '2024-01-01', orders: [], returns: [], ...partial };
}

describe('assessCustomer', () => {
  it('scores a loyal customer with no returns as low risk', () => {
    const home = addr('home');
    const orders = Array.from({ length: 8 }, (_, i) => order(`o${i}`, `2025-0${(i % 9) + 1}-01`, home));
    const result = assessCustomer(customer({ orders, returns: [] }), NOW);
    expect(result.band).toBe('niedrig');
    expect(result.confidence).toBe('hoch');
  });

  it('scores a serial returner as high risk', () => {
    const home = addr('home');
    const orders = Array.from({ length: 8 }, (_, i) => order(`o${i}`, '2026-08-01', home));
    const returns = orders.map((o, i) => ({
      id: `r${i}`,
      orderId: o.id,
      date: '2026-08-15',
      sku: 'A',
      quantity: 1,
      reason: 'Gefällt nicht',
    }));
    const result = assessCustomer(customer({ orders, returns }), NOW);
    expect(result.band).toBe('hoch');
    expect(result.score).toBeGreaterThan(60);
  });

  it('raises risk when many different shipping addresses are used', () => {
    const home = addr('home');
    const same = Array.from({ length: 6 }, (_, i) => order(`o${i}`, '2026-05-01', home));
    const many = Array.from({ length: 6 }, (_, i) => order(`o${i}`, '2026-05-01', addr(`a${i}`)));
    expect(assessCustomer(customer({ orders: many }), NOW).score).toBeGreaterThan(
      assessCustomer(customer({ orders: same }), NOW).score,
    );
  });

  it('keeps every factor contribution within its weight budget', () => {
    const home = addr('home');
    const orders = Array.from({ length: 4 }, (_, i) => order(`o${i}`, '2026-07-01', home));
    for (const f of assessCustomer(customer({ orders }), NOW).factors) {
      expect(f.contribution).toBeLessThanOrEqual(f.weight * 100 + 1e-9);
      expect(f.contribution).toBeGreaterThanOrEqual(0);
    }
  });

  it('renormalizes weights to sum to 100 when scoring without returns factors', () => {
    const home = addr('home');
    const orders = Array.from({ length: 4 }, (_, i) => order(`o${i}`, '2026-07-01', home));
    const result = assessCustomer(customer({ orders }), NOW, { only: AVAILABLE_WITHOUT_RETURNS });
    expect(result.factors).toHaveLength(3);
    const weightSum = result.factors.reduce((s, f) => s + f.weight, 0);
    expect(weightSum).toBeCloseTo(1, 6);
  });
});

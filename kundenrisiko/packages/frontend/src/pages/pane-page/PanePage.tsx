import { useState, useEffect } from 'react';
import IPanePageProps from './IPanePageProps';
import { assessCustomer, AVAILABLE_WITHOUT_RETURNS, BAND_LABEL } from '../../risk/model';
import { CustomerRiskCard } from '../../risk/riskUi';
import { fetchErpCustomer } from '../../risk/graphqlSource';
import type { Customer } from '../../risk/types';
import '../../risk/risk.css';

// Sidebar panel on the ERP customers view: shows the return risk for the selected customer,
// scored from that customer's live Wawi orders (no returns in the Cloud API, no mock data).
const PanePage: React.FC<IPanePageProps> = ({ appBridge }) => {
  const [customerId, setCustomerId] = useState<string | undefined>(undefined);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const unsubscribe = appBridge.event.subscribe('CustomerChanged', (data: unknown) => {
      return new Promise<void>((resolve) => {
        setCustomerId((data as { customerId: string }).customerId);
        resolve();
      });
    });
    appBridge.method
      .call('getCurrentCustomerId')
      .then((id) => setCustomerId(id as string))
      .catch(() => undefined);
    return () => unsubscribe();
  }, [appBridge]);

  useEffect(() => {
    if (!customerId) return;
    let active = true;
    setLoading(true);
    fetchErpCustomer(appBridge, customerId)
      .then((c) => active && setCustomer(c))
      .catch(() => active && setCustomer(null))
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, [appBridge, customerId]);

  if (!customerId) {
    return (
      <div className="kr" style={{ padding: 16 }}>
        <div className="kr-head">
          <h1>Kundenrisiko</h1>
          <p>Wähle einen Kunden in der ERP-Ansicht, um das Retouren-Risiko zu sehen.</p>
        </div>
      </div>
    );
  }

  if (loading || !customer) {
    return (
      <div className="kr" style={{ padding: 16 }}>
        <div className="kr-head">
          <h1>Kundenrisiko</h1>
          <p>{loading ? 'Lade Bestelldaten …' : 'Keine Bestellungen für diesen Kunden gefunden.'}</p>
        </div>
      </div>
    );
  }

  const assessment = assessCustomer(customer, new Date(), { only: AVAILABLE_WITHOUT_RETURNS });
  return (
    <div className="kr" style={{ padding: 16 }}>
      <div className="kr-head">
        <h1>Kundenrisiko</h1>
        <p>
          {BAND_LABEL[assessment.band]} · Score {assessment.score}/100 · ohne Retouren
        </p>
      </div>
      <CustomerRiskCard customer={customer} assessment={assessment} compact />
    </div>
  );
};

export default PanePage;

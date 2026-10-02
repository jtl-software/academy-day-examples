import { useEffect, useState } from 'react';
import IErpPageProps from './IErpPageProps';
import { assessCustomer, AVAILABLE_WITHOUT_RETURNS } from '../../risk/model';
import { fetchErpCustomers } from '../../risk/graphqlSource';
import { RiskOverview, type RiskRow } from '../../risk/riskUi';
import '../../risk/risk.css';

// Kundenrisiko overview, opened from the Cloud ERP sidebar. Scores live Wawi orders per customer.
const ErpPage: React.FC<IErpPageProps> = ({ appBridge }) => {
  const [rows, setRows] = useState<RiskRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    fetchErpCustomers(appBridge)
      .then((customers) => {
        if (!active) return;
        const scored = customers
          .map((customer) => ({ customer, assessment: assessCustomer(customer, new Date(), { only: AVAILABLE_WITHOUT_RETURNS }) }))
          .sort((a, b) => b.assessment.score - a.assessment.score);
        setRows(scored);
      })
      .catch((e) => active && setError(String(e)));
    return () => {
      active = false;
    };
  }, [appBridge]);

  return (
    <div style={{ padding: 20, background: '#eeeee7', minHeight: '100vh' }}>
      {error ? (
        <div className="kr">
          <div className="kr-head">
            <h1>Kundenrisiko</h1>
            <p>Konnte keine Bestelldaten laden. Läuft JTL-Wawi und ist der Tenant verbunden?</p>
          </div>
        </div>
      ) : rows === null ? (
        <div className="kr">
          <div className="kr-head">
            <h1>Kundenrisiko</h1>
            <p>Lade Bestelldaten aus JTL-Wawi …</p>
          </div>
        </div>
      ) : (
        <RiskOverview rows={rows} />
      )}
    </div>
  );
};

export default ErpPage;

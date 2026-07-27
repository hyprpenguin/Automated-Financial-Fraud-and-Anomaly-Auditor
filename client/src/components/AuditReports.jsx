import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AuditReports() {
  //--- Live Data States ---
  const [metrics, setMetrics] = useState({
    totalTransactions: 0,
    totalReports: 0,
    inReview: 0,
    newIssuesToday: 0,
    avgResolutionTime: 2.5,
    anomalyBreakdown: []
  });
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  //Filter Controls State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRisks, setSelectedRisks] = useState(['high', 'med', 'low']);
  const [statuses, setStatuses] = useState({
    PENDING: true,
    FLAGGED: true,
    APPROVED: true,
    DISMISSED: false
  });

  //Fetch Metrics on Component Mount
  const fetchMetrics = async () => {
    try {
      const res = await axios.get('http://localhost:3000/api/v1/audit/metrics');
      if (res.data.success) {
        setMetrics(res.data.data);
      }
    } catch (err) {
      console.error("Failed to load audit metrics:", err);
    }
  };

  //Execute Dynamic Database Search
  const handleSearch = async () => {
    setLoading(true);
    try {
      const activeStatuses = Object.keys(statuses).filter(key => statuses[key]).join(',');
      const activeRisks = selectedRisks.join(',');

      const res = await axios.get('http://localhost:3000/api/v1/audit/search', {
        params: {
          search: searchTerm,
          status: activeStatuses,
          risk: activeRisks
        }
      });

      if (res.data.success) {
        setReports(res.data.data);
      }
    } catch (err) {
      console.error("Failed to fetch reports:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    handleSearch();
  }, []);

  //Helper: Toggle Risk Selection Chips
  const toggleRisk = (risk) => {
    setSelectedRisks(prev => 
      prev.includes(risk) ? prev.filter(r => r !== risk) : [...prev, risk]
    );
  };

  //Helper: Toggle Status Switches
  const toggleStatus = (statusKey) => {
    setStatuses(prev => ({ ...prev, [statusKey]: !prev[statusKey] }));
  };

  //--- Dynamic Donut Chart Calculation ---
  const getDonutGradient = () => {
    if (!metrics.anomalyBreakdown || metrics.anomalyBreakdown.length === 0) {
      return 'conic-gradient(#cbd5e1 0% 100%)';
    }
    const total = metrics.anomalyBreakdown.reduce((acc, curr) => acc + curr.count, 0) || 1;
    let currentPct = 0;
    
    
    const colors = { 
      'Velocity Spike': '#2563eb',    
      'Location Mismatch': '#f97316', 
      'IP Anomaly': '#ef4444',        
      'None': '#94a3b8',              
      'Uncategorized': '#64748b'      
    };
    
    const slices = metrics.anomalyBreakdown.map(item => {
      const pct = (item.count / total) * 100;
      const start = currentPct;
      currentPct += pct;
      const label = item._id || 'Uncategorized';
      const color = colors[label] || '#8b5cf6'; 
      return `${color} ${start}% ${currentPct}%`;
    });

    return `conic-gradient(${slices.join(', ')})`;
  };

  return (
    <div style={{ padding: '24px', backgroundColor: '#f1f5f9', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
    




      {/* HEADER */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Sentinel Audit Reports</h2>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>Live Database Sync Enabled</div>
        </div>
        <button onClick={() => { fetchMetrics(); handleSearch(); }} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '8px 16px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
          🔄 Refresh Reports
        </button>
      </div>

      {/* METRICS CARDS */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '20px' }}>
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>📄 Total Reports Generated</div>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{metrics.totalReports}</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>📄 Audit Reports Evaluated</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: '6px' }}>
              <span style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{metrics.totalReports}</span>
              <span style={{ fontSize: '12px', color: '#94a3b8' }}>/ {metrics.totalTransactions} raw transactions</span>
            </div>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>⚠️ New Issues Today</div>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{metrics.newIssuesToday}</span>
        </div>

        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '8px' }}>🕒 Avg Resolution Time</div>
          <span style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{metrics.avgResolutionTime} hrs</span>
        </div>
      </div>

      {/* MIDDLE SECTION: FILTERS & DONUT CHART */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1.2fr', gap: '16px', marginBottom: '24px' }}>
        
        {/* FILTER PANEL */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>Report Filtering & Advanced Search</h3>
          
          <div style={{ display: 'flex', gap: '24px' }}>
            {/* Risk Chips */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Risk Level</label>
              <div style={{ display: 'flex', gap: '6px' }}>
                {[
                  { key: 'low', label: 'Low Risk', bg: '#dcfce7', text: '#166534' },
                  { key: 'med', label: 'Med Risk', bg: '#ffedd5', text: '#9a3412' },
                  { key: 'high', label: 'High Risk', bg: '#fee2e2', text: '#991b1b' }
                ].map(chip => (
                  <span 
                    key={chip.key}
                    onClick={() => toggleRisk(chip.key)}
                    style={{
                      padding: '4px 10px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
                      backgroundColor: selectedRisks.includes(chip.key) ? chip.bg : '#f1f5f9',
                      color: selectedRisks.includes(chip.key) ? chip.text : '#94a3b8',
                      border: selectedRisks.includes(chip.key) ? '1px solid transparent' : '1px solid #cbd5e1'
                    }}
                  >
                    {chip.label}
                  </span>
                ))}
              </div>

              <div style={{ marginTop: '16px' }}>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>User or Merchant Search</label>
                <input 
                  type="text" 
                  placeholder="Enter User ID or Merchant..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                />
              </div>
            </div>

            {/* Status Toggles */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '8px' }}>Status</label>
              {Object.keys(statuses).map(key => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                  <div 
                    onClick={() => toggleStatus(key)}
                    style={{ 
                      width: '32px', height: '18px', borderRadius: '20px', 
                      backgroundColor: statuses[key] ? '#2563eb' : '#e2e8f0',
                      position: 'relative', cursor: 'pointer'
                    }}
                  >
                    <div style={{ 
                      width: '14px', height: '14px', borderRadius: '50%', backgroundColor: 'white', 
                      position: 'absolute', top: '2px', left: statuses[key] ? '16px' : '2px', transition: '0.2s'
                    }}></div>
                  </div>
                  <span style={{ fontSize: '13px', color: '#334155' }}>{key}</span>
                </div>
              ))}
            </div>

            <div style={{ flex: 1, display: 'flex', alignItems: 'flex-end' }}>
              <button onClick={handleSearch} style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer', width: '100%' }}>
                Execute Search
              </button>
            </div>
          </div>
        </div>

        {/* DYNAMIC DONUT CHART */}
        <div style={{ backgroundColor: '#ffffff', padding: '20px', borderRadius: '10px', border: '1px solid #e2e8f0' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', margin: '0 0 16px 0' }}>Anomaly Type Breakdown</h3>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
            <div style={{ width: '110px', height: '110px', borderRadius: '50%', background: getDonutGradient(), display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ width: '65px', height: '65px', backgroundColor: '#ffffff', borderRadius: '50%' }}></div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '12px' }}>
              {metrics.anomalyBreakdown.length === 0 ? <span style={{ color: '#94a3b8' }}>No anomalies detected yet</span> : (
                metrics.anomalyBreakdown.map((item, i) => (
                  <div key={i} style={{ fontWeight: '600', color: '#334155' }}>
                    ● {item._id || 'Uncategorized'}: <strong>{item.count}</strong>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

      </div>

      {/* FILTERED RESULTS TABLE */}
      <div style={{ backgroundColor: '#ffffff', borderRadius: '10px', border: '1px solid #e2e8f0', padding: '20px' }}>
        <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 16px 0' }}>Matching Audit Logs ({reports.length})</h3>
        {loading ? <div>Querying Database...</div> : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #e2e8f0', color: '#64748b' }}>
                <th style={{ padding: '8px' }}>User ID</th>
                <th style={{ padding: '8px' }}>Merchant</th>
                <th style={{ padding: '8px' }}>Amount</th>
                <th style={{ padding: '8px' }}>Risk Score</th>
                <th style={{ padding: '8px' }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {reports.map((tx) => (
                <tr key={tx._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '10px 8px', fontWeight: '600' }}>{tx.userId}</td>
                  <td style={{ padding: '10px 8px' }}>{tx.merchant}</td>
                  <td style={{ padding: '10px 8px' }}>${tx.amount}</td>
                  <td style={{ padding: '10px 8px', fontWeight: '700', color: tx.aiRiskAssessment?.riskScore >= 75 ? '#ef4444' : '#10b981' }}>
                    {tx.aiRiskAssessment?.riskScore || 0}/100
                  </td>
                  <td style={{ padding: '10px 8px' }}>
                    <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '700', backgroundColor: tx.status === 'FLAGGED' ? '#fee2e2' : '#dcfce7', color: tx.status === 'FLAGGED' ? '#991b1b' : '#166534' }}>
                      {tx.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

    </div>
  );
}
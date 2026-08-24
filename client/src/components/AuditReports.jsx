import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function AuditReports({ timestamp }) {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filtering States
  const [riskFilter, setRiskFilter] = useState(null); 
  const [activeStatuses, setActiveStatuses] = useState({
    'PENDING': true,
    'FLAGGED': true,
    'APPROVED': false,
    'DISMISSED': false
  });

  // Modal States
  const [selectedRecord, setSelectedRecord] = useState(null);
  const [overrideComment, setOverrideComment] = useState('');
  const [overrideRisk, setOverrideRisk] = useState(0);
  const [isOverriding, setIsOverriding] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  // Fetch Data
  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await axios.get('http://localhost:3000/api/v1/fraud/history');
      if (res.data.success) setRecords(res.data.data);
    } catch (err) {
      console.error("Database tracking read failure", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  // --- Modal Actions ---
  const handleManualOverride = async () => {
    if (!selectedRecord) return;
    setIsOverriding(true);
    
    try {
      const res = await axios.put(`http://localhost:3000/api/v1/fraud/override/${selectedRecord._id}`, {
        status: 'APPROVED',
        riskScore: overrideRisk,
        comment: overrideComment
      });
      
      if (res.data.success) {
        setRecords(records.map(r => r._id === selectedRecord._id ? res.data.data : r));
        setSelectedRecord(res.data.data);
        setOverrideComment('');
        setOverrideRisk(0);
      }
    } catch (err) {
      console.error("Override failed", err);
      alert("Failed to override the transaction.");
    } finally {
      setIsOverriding(false);
    }
  };

  const handleDismissRecord = async () => {
    if (!selectedRecord) return;
    setIsDismissing(true);
    
    try {
      const res = await axios.put(`http://localhost:3000/api/v1/fraud/override/${selectedRecord._id}`, {
        status: 'DISMISSED',
        riskScore: selectedRecord.aiRiskAssessment?.riskScore || 0,
        comment: 'Audit file formally dismissed without action.'
      });
      
      if (res.data.success) {
        setRecords(records.map(r => r._id === selectedRecord._id ? res.data.data : r));
        setSelectedRecord(null); 
      }
    } catch (err) {
      console.error("Dismiss failed", err);
      alert("Failed to dismiss the transaction.");
    } finally {
      setIsDismissing(false);
    }
  };

  const handleDownloadReport = () => {
    window.open('http://localhost:3000/api/v1/fraud/export-report', '_blank');
  };

  // --- Calculations & Filtering ---
  const totalTransactionsCount = records.length;
  const flaggedRecords = records.filter(r => r.status === 'FLAGGED' || r.aiRiskAssessment?.isMalicious);
  
  const filteredRecords = records.filter(r => {
    const matchesSearch = searchTerm === '' ||
      r.transactionID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.userId?.toLowerCase().includes(searchTerm.toLowerCase());

    let matchesRisk = true;
    const score = r.aiRiskAssessment?.riskScore || 0;
    if (riskFilter === 'Low' && score >= 40) matchesRisk = false;
    if (riskFilter === 'Med' && (score < 40 || score >= 75)) matchesRisk = false;
    if (riskFilter === 'High' && score < 75) matchesRisk = false;

    const matchesStatus = activeStatuses[r.status] || (!r.status && activeStatuses['PENDING']);

    return matchesSearch && matchesRisk && matchesStatus;
  });

  const toggleStatus = (statusName) => {
    setActiveStatuses(prev => ({ ...prev, [statusName]: !prev[statusName] }));
  };

  const getChipStyle = (type, activeBg, defaultBg, activeColor, defaultColor) => ({
    padding: '6px 14px', borderRadius: '20px', fontSize: '12px', fontWeight: '600', cursor: 'pointer',
    transition: 'all 0.2s ease', textAlign: 'center',
    backgroundColor: riskFilter === type ? activeBg : defaultBg,
    color: riskFilter === type ? activeColor : defaultColor,
    opacity: riskFilter && riskFilter !== type ? 0.4 : 1
  });

  // --- Dynamic Donut Chart Logic ---
  // Count anomalies from records to keep it completely dynamic
  const anomalyCounts = {};
  flaggedRecords.forEach(r => {
    const flag = r.aiRiskAssessment?.patternFlag || 'None';
    anomalyCounts[flag] = (anomalyCounts[flag] || 0) + 1;
  });
  
  const anomalyBreakdown = Object.entries(anomalyCounts).map(([key, val]) => ({ _id: key, count: val }));
  
  const anomalyColors = { 
    'Velocity Spike': '#2563eb',    
    'Location Mismatch': '#f97316', 
    'IP Anomaly': '#ef4444',        
    'None': '#94a3b8',              
    'Uncategorized': '#64748b'      
  };

  const getDonutGradient = () => {
    if (anomalyBreakdown.length === 0) return 'conic-gradient(#cbd5e1 0% 100%)';
    const total = anomalyBreakdown.reduce((acc, curr) => acc + curr.count, 0) || 1;
    let currentPct = 0;
    
    const slices = anomalyBreakdown.map(item => {
      const pct = (item.count / total) * 100;
      const start = currentPct;
      currentPct += pct;
      const label = item._id;
      const color = anomalyColors[label] || '#8b5cf6'; 
      return `${color} ${start}% ${currentPct}%`;
    });

    return `conic-gradient(${slices.join(', ')})`;
  };

  if (loading) return <div style={{ color: '#64748b', fontSize: '14px', fontFamily: 'monospace', padding: '24px' }}>Syncing telemetry clusters...</div>;

  return (
    <div style={{ position: 'relative' }}>
      
      {/* Top Header Section */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>
            Sentinel Audit Reports
          </h2>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '500' }}>
            Live Database Sync Enabled
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button 
            onClick={handleDownloadReport}
            style={{ 
              backgroundColor: '#ffffff', color: '#0f172a', padding: '10px 18px', 
              border: '1px solid #cbd5e1', borderRadius: '8px', fontWeight: '600', 
              fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
            }}
          >
            📥 Download CSV
          </button>

          <button 
            onClick={fetchReports} 
            style={{ 
              backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 18px', 
              border: 'none', borderRadius: '8px', fontWeight: '600', 
              fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px',
              boxShadow: '0 1px 2px rgba(37,99,235,0.2)'
            }}
          >
            🔄 Refresh Reports
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>📄 Total Reports Generated</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{totalTransactionsCount}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>📄 Audit Reports Evaluated</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>{totalTransactionsCount} <span style={{fontSize: '12px', color: '#94a3b8', fontWeight: '500'}}>/ {totalTransactionsCount} raw transactions</span></div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>⚠️ New Issues Today</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#ef4444' }}>{flaggedRecords.filter(record => new Date(record.createdAt).toDateString() === new Date().toDateString()).length}</div>
        </div>
        <div style={{ backgroundColor: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <div style={{ color: '#64748b', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>🕒 Avg Resolution Time</div>
          <div style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a' }}>5 mins</div>
        </div>
      </div>

      {/* Main Grid: Filters & Chart */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '20px', marginBottom: '24px' }}>
        
        {/* Filters Box */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Report Filtering & Advanced Search</h4>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>Risk Level</label>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span onClick={() => setRiskFilter(riskFilter === 'Low' ? null : 'Low')} style={getChipStyle('Low', '#10b981', 'rgba(16,185,129,0.15)', '#ffffff', '#10b981')}>Low<br/>Risk</span>
                <span onClick={() => setRiskFilter(riskFilter === 'Med' ? null : 'Med')} style={getChipStyle('Med', '#f59e0b', 'rgba(245,158,11,0.15)', '#ffffff', '#f59e0b')}>Med<br/>Risk</span>
                <span onClick={() => setRiskFilter(riskFilter === 'High' ? null : 'High')} style={getChipStyle('High', '#ef4444', 'rgba(239,68,68,0.15)', '#ffffff', '#ef4444')}>High<br/>Risk</span>
              </div>

              <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginTop: '24px', marginBottom: '8px' }}>User or Merchant Search</label>
              <input 
                type="text" 
                placeholder="Enter User ID or Merchant..." 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ width: '100%', padding: '10px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} 
              />
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '12px' }}>Status</label>
                {['PENDING', 'FLAGGED', 'APPROVED', 'DISMISSED'].map((status, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px', fontSize: '13px', fontWeight: '500', color: '#334155' }}>
                    <div 
                      onClick={() => toggleStatus(status)}
                      style={{ 
                        width: '36px', height: '20px', borderRadius: '10px', backgroundColor: activeStatuses[status] ? '#2563eb' : '#cbd5e1', 
                        position: 'relative', cursor: 'pointer', transition: '0.2s' 
                      }}
                    >
                      <div style={{ width: '16px', height: '16px', borderRadius: '50%', backgroundColor: '#fff', position: 'absolute', top: '2px', left: activeStatuses[status] ? '18px' : '2px', transition: '0.2s' }}></div>
                    </div>
                    {status}
                  </div>
                ))}
              </div>
              <button style={{ width: '100%', backgroundColor: '#2563eb', color: '#ffffff', padding: '10px', border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' }}>
                Execute Search
              </button>
            </div>
          </div>
        </div>

        {/* Anomaly Chart Box */}
        <div style={{ backgroundColor: '#fff', padding: '24px', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
          <h4 style={{ margin: '0 0 20px 0', fontSize: '16px', fontWeight: '700' }}>Anomaly Type Breakdown</h4>
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <div style={{ 
              width: '120px', height: '120px', borderRadius: '50%', 
              background: getDonutGradient(),
              position: 'relative'
            }}>
              <div style={{ 
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', 
                width: '70px', height: '70px', backgroundColor: '#fff', borderRadius: '50%' 
              }}></div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '13px', color: '#1e293b' }}>
              {anomalyBreakdown.length > 0 ? (
                anomalyBreakdown.map((item, index) => {
                  const label = item._id;
                  const color = anomalyColors[label] || '#8b5cf6';
                  return (
                    <div key={index} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: color }}></div>
                      <span>{label}: <strong>{item.count}</strong></span>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b' }}>
                   <div style={{ width: '10px', height: '10px', borderRadius: '50%', backgroundColor: '#cbd5e1' }}></div>
                   <span>No anomaly data</span>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>

      {/* Data Table */}
      <div style={{ backgroundColor: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Matching Audit Logs ({filteredRecords.length})</h3>
          <span style={{ fontSize: '12px', color: '#64748b' }}>Cols ▾ | Data Grid</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0', color: '#64748b', fontWeight: '700' }}>
                <th style={{ padding: '14px 20px' }}>User ID</th>
                <th style={{ padding: '14px 20px' }}>Merchant</th>
                <th style={{ padding: '14px 20px' }}>Amount</th>
                <th style={{ padding: '14px 20px' }}>Risk Score</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => {
                const isThreat = item.status === 'FLAGGED' || item.aiRiskAssessment?.isMalicious;
                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid #e2e8f0', backgroundColor: isThreat ? 'rgba(239,68,68,0.01)' : 'transparent' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '600' }}>{item.userId}</td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>{item.merchant}</td>
                    <td style={{ padding: '14px 20px', color: '#334155' }}>${item.amount}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: '700', color: isThreat ? '#ef4444' : '#10b981' }}>
                        {item.aiRiskAssessment?.riskScore || 0}/100
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ 
                        padding: '4px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '700',
                        backgroundColor: isThreat ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isThreat ? '#ef4444' : '#10b981'
                      }}>
                        {item.status || 'PENDING'}
                      </span>
                    </td>
                    {/* ADDED: Actions Column aligned with Dashboard! */}
                    <td style={{ padding: '14px 20px', color: '#2563eb', fontWeight: '500', lineHeight: '1.4' }}>
                      <span 
                        style={{ cursor: 'pointer', display: 'block', textDecoration: 'underline' }} 
                        onClick={() => setSelectedRecord(item)}
                      >
                        [View]
                      </span>
                      <span style={{ cursor: 'pointer', display: 'block', color: '#64748b' }}>[Assign]</span>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: '#64748b' }}>No audit logs found matching criteria.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* --- UNIFIED INSPECTION FILE MODAL --- */}
      {selectedRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', width: '550px', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid #e2e8f0',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            
            <div style={{ padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Inspection File: #{selectedRecord.transactionID}
                </h3>
                <span style={{ fontSize: '11px', color: '#64748b' }}>Logged Node Security Manifest</span>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: '#64748b', cursor: 'pointer', fontWeight: '700' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>USER ASSOCIATION</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{selectedRecord.userId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TARGET MERCHANT</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{selectedRecord.merchant}</div>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>TRANSACTION VOLUME</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>${selectedRecord.amount}</div>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>PIPELINE STATUS</div>
                  <div style={{ 
                    fontSize: '13px', fontWeight: '700', marginTop: '4px',
                    color: selectedRecord.status === 'FLAGGED' ? '#ef4444' : '#10b981' 
                  }}>{selectedRecord.status}</div>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '6px' }}>RAW PAYLOAD DESCRIPTION</label>
                <div style={{ 
                  backgroundColor: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: '8px', 
                  fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5', maxHeight: '100px', overflowY: 'auto' 
                }}>
                  "{selectedRecord.description}"
                </div>
              </div>

              <div style={{ height: '1px', backgroundColor: '#e2e8f0', margin: '4px 0' }}></div>

              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: '#64748b', marginBottom: '8px' }}>🛡️ AI COGNITIVE AUDIT ASSESSMENTS</label>
                
                <div style={{ 
                  border: `1px solid ${selectedRecord.status === 'FLAGGED' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  backgroundColor: selectedRecord.status === 'FLAGGED' ? 'rgba(239,68,68,0.02)' : 'rgba(16,185,129,0.02)',
                  padding: '16px', borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Computed Threat Index Rating:</span>
                    <span style={{ 
                      fontSize: '15px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px',
                      color: selectedRecord.status === 'FLAGGED' ? '#ef4444' : '#10b981',
                      backgroundColor: selectedRecord.status === 'FLAGGED' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
                    }}>
                      {selectedRecord.aiRiskAssessment?.riskScore} / 100
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: '#64748b', fontWeight: '700', marginBottom: '4px' }}>TECHNICAL JUSTIFICATION:</div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{selectedRecord.aiRiskAssessment?.justification || 'No technical assessment log found in schema payload.'}"
                  </p>
                </div>
              </div>

            </div>

            {selectedRecord.status === 'FLAGGED' && (
              <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#0f172a' }}>🛠️ Manual Auditor Override</h4>
                
                <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                  <div style={{ flexGrow: 1 }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Override Justification (Optional)</label>
                    <input 
                      type="text" 
                      placeholder="e.g., Verified identity via phone call." 
                      value={overrideComment}
                      onChange={(e) => setOverrideComment(e.target.value)}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                  <div style={{ width: '120px' }}>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: '#64748b', marginBottom: '4px' }}>Set Risk (0-100)</label>
                    <input 
                      type="number" 
                      min="0" 
                      max="100" 
                      value={overrideRisk}
                      onChange={(e) => setOverrideRisk(Number(e.target.value))}
                      style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                    />
                  </div>
                </div>

                <button 
                  onClick={handleManualOverride}
                  disabled={isOverriding}
                  style={{ 
                    width: '100%', padding: '10px', backgroundColor: '#10b981', color: 'white', 
                    border: 'none', borderRadius: '6px', fontWeight: '600', fontSize: '13px',
                    cursor: isOverriding ? 'not-allowed' : 'pointer', transition: '0.2s',
                    opacity: isOverriding ? 0.7 : 1
                  }}
                >
                  {isOverriding ? 'Updating Matrix...' : '✓ Approve & Mark as Safe'}
                </button>
              </div>
            )}

            <div style={{ padding: '14px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ 
                  backgroundColor: 'transparent', color: '#64748b', padding: '8px 16px', border: '1px solid #e2e8f0', 
                  borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' 
                }}
              >
                Close
              </button>
              <button 
                onClick={handleDismissRecord}
                disabled={isDismissing}
                style={{ 
                  backgroundColor: '#0f172a', color: '#ffffff', padding: '8px 16px', border: 'none', 
                  borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: isDismissing ? 'not-allowed' : 'pointer' 
                }}
              >
                {isDismissing ? 'Dismissing...' : 'Dismiss Audit File'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
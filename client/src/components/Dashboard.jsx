import React, { useState, useEffect } from 'react';
import axios from 'axios';



export default function Dashboard({ timestamp }) {

  const [isSweeping, setIsSweeping] = useState(false);
  const [sweepMessage, setSweepMessage] = useState(null);

  const [records, setRecords] = useState([]);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRecord, setSelectedRecord] = useState(null);
  
  const [overrideComment, setOverrideComment] = useState('');
  const [overrideRisk, setOverrideRisk] = useState(0);
  const [isOverriding, setIsOverriding] = useState(false);

  
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








  const triggerDatabaseSweep = async () => {
    setIsSweeping(true);
    setSweepMessage(null);
    
    try {
      const response = await axios.post('http://localhost:3000/api/v1/fraud/database-sweep');
      
      
      if (response.data.message) {
        setSweepMessage(response.data.message);
      }
      
      

    } catch (error) {
      console.error("Sweep Failed:", error);
      setSweepMessage("❌ Error: Failed to communicate with the sweep engine.");
    } finally {
      setIsSweeping(false);
    }
  };

  useEffect(() => {
    const fetchSystemData = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/fraud/history');
        if (res.data.success) setRecords(res.data.data);
      } catch (err) {
        console.error("Database tracking read failure", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSystemData();
  }, []);
  
  const totalTransactionsCount = records.length;
  const flaggedRecords = records.filter(r => r.status === 'FLAGGED' || r.aiRiskAssessment?.isMalicious);
  const flaggedCount = flaggedRecords.length;
  const averageRisk = totalTransactionsCount > 0 
    ? Math.round(records.reduce((acc, r) => acc + (r.aiRiskAssessment?.riskScore || 0), 0) / totalTransactionsCount) 
    : 0;

  const filteredRecords = records.filter(r => 
    r.transactionID?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.merchant?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    r.userId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div style={{ color: 'var(--text-muted)', fontSize: '14px', fontFamily: 'monospace' }}>Syncing telemetry clusters...</div>;

  return (
    <div style={{ position: 'relative' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Sentinel Audit Reports</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>{timestamp}</div>
        </div>
        <button style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 18px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}>
          📈 Report Analytics
        </button>
      </div>

{/*--- ENTERPRISE SWEEP PANEL --- */}
<div style={{ backgroundColor: '#0f172a', padding: '24px', borderRadius: '12px', border: '1px solid #334155', marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
  <div>
    <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '700', color: '#ffffff' }}>
      Enterprise Database Sweep
    </h3>
    <p style={{ margin: 0, fontSize: '13px', color: '#94a3b8' }}>
      Scan all pending or historically unaudited database records through the Gemini security matrix.
    </p>
    
    {/* Dynamic Result Message */}
    {sweepMessage && (
      <div style={{ marginTop: '12px', fontSize: '13px', color: sweepMessage.includes('❌') ? '#ef4444' : '#10b981', fontWeight: '600' }}>
        {sweepMessage.includes('❌') ? sweepMessage : `✓ ${sweepMessage}`}
      </div>
    )}
  </div>

  <button
    onClick={triggerDatabaseSweep}
    disabled={isSweeping}
    style={{
      backgroundColor: isSweeping ? '#475569' : '#8b5cf6', 
      color: '#ffffff',
      padding: '12px 24px',
      border: 'none',
      borderRadius: '8px',
      fontWeight: '700',
      fontSize: '14px',
      cursor: isSweeping ? 'not-allowed' : 'pointer',
      display: 'flex',
      alignItems: 'center',
      gap: '8px',
      transition: '0.2s',
      boxShadow: isSweeping ? 'none' : '0 4px 14px rgba(139, 92, 246, 0.4)'
    }}
  >
    {isSweeping ? '🔄 AI Scanning Database...' : '🔍 Run System Sweep'}
  </button>
</div>


      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { title: 'Total Transactions', value: totalTransactionsCount.toLocaleString(), icon: '💳' },
          { title: 'Audits Run', value: totalTransactionsCount, icon: '👁️' },
          { title: 'Flagged Flags', value: flaggedCount, icon: '🏳️' },
          { title: 'Avg Risk Score', value: `${averageRisk}/100`, icon: '🕒', sub: true }
        ].map((card, idx) => (
          <div key={idx} style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-muted)', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
              <span>{card.title}</span> <span>{card.icon}</span>
            </div>
            <div style={{ fontSize: '28px', fontWeight: '700', color: 'var(--text-main)' }}>{card.value}</div>
            {card.sub && (
              <div style={{ marginTop: '8px', height: '4px', width: '100%', backgroundColor: '#e2e8f0', borderRadius: '2px', overflow: 'hidden' }}>
                <div style={{ width: `${averageRisk}%`, height: '100%', backgroundColor: averageRisk > 60 ? 'var(--danger-red)' : 'var(--accent-blue)' }}></div>
              </div>
            )}
          </div>
        ))}
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr 280px', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 16px 0', fontSize: '14px', fontWeight: '700' }}>Report Filtering & Advanced Search</h4>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>Risk Level (Chips)</label>
            <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(16,185,129,0.15)', color: 'var(--success-green)' }}>Low Risk</span>
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(245,158,11,0.15)', color: 'var(--warning-orange)' }}>Med Risk</span>
              <span style={{ padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600', backgroundColor: 'rgba(239,68,68,0.15)', color: 'var(--danger-red)' }}>High Risk</span>
            </div>
          </div>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>Status Toggle Matrix</label>
            {['Pending', 'In Review', 'Resolved', 'Dismissed'].map((status, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', justify: 'space-between', marginBottom: '6px', fontSize: '13px' }}>
                <span>{status}</span>
                <input type="checkbox" defaultChecked={i < 2} style={{ cursor: 'pointer' }} />
              </div>
            ))}
          </div>
          <div>
            <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>User Association</label>
            <input 
              type="text" 
              placeholder="User ID or Name" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid var(--border-color)', fontSize: '13px' }} 
            />
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
          <div>
            <h4 style={{ margin: '0 0 4px 0', fontSize: '14px', fontWeight: '700' }}>Anomalies Over Time</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Security Incident Tracking Trend Line</span>
          </div>
          <div style={{ height: '130px', display: 'flex', alignItems: 'flex-end', gap: '12px', paddingBottom: '10px', borderBottom: '1px solid var(--border-color)' }}>
            {[20, 45, 28, 35, 70, 40, 95].map((h, i) => (
              <div key={i} style={{ flexGrow: 1, backgroundColor: 'rgba(37,99,235,0.15)', borderTop: '2px solid #2563eb', height: `${h}%`, borderRadius: '2px 2px 0 0' }}></div>
            ))}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
            <span>Jun 24</span><span>Jun 25</span><span>Jun 26</span><span>Jun 27</span>
          </div>
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>Recent High-Risk Cases</h4>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {flaggedRecords.slice(0, 3).map((item, index) => (
              <div key={index} style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '8px', cursor: 'pointer' }} onClick={() => setSelectedRecord(item)}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', fontWeight: '700', marginBottom: '2px' }}>
                  <span style={{ color: '#2563eb' }}>#{item.transactionID}</span>
                  <span style={{ color: 'var(--danger-red)', fontSize: '11px' }}>High Risk</span>
                </div>
                <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Score: {item.aiRiskAssessment?.riskScore}/100</div>
              </div>
            ))}
            {flaggedRecords.length === 0 && <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>No critical alerts active.</div>}
          </div>
        </div>
      </div>

      
      <div style={{ backgroundColor: 'var(--card-bg)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>Recent Audit Reports</h3>
          <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Cols ▾ | Data Grid</span>
        </div>
        
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '13px' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)', fontWeight: '600' }}>
                <th style={{ padding: '14px 20px' }}>Report ID</th>
                <th style={{ padding: '14px 20px' }}>User Association</th>
                <th style={{ padding: '14px 20px' }}>Merchant / Scope</th>
                <th style={{ padding: '14px 20px' }}>Description Summary</th>
                <th style={{ padding: '14px 20px' }}>Risk Index</th>
                <th style={{ padding: '14px 20px' }}>Status</th>
                <th style={{ padding: '14px 20px' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRecords.map((item) => {
                const isThreat = item.status === 'FLAGGED' || item.aiRiskAssessment?.isMalicious;
                return (
                  <tr key={item._id} style={{ borderBottom: '1px solid var(--border-color)', backgroundColor: isThreat ? 'rgba(239,68,68,0.01)' : 'transparent' }}>
                    <td style={{ padding: '14px 20px', fontWeight: '600', color: '#2563eb' }}>#{item.transactionID}</td>
                    <td style={{ padding: '14px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <div style={{ width: '24px', height: '24px', borderRadius: '50%', backgroundColor: '#e2e8f0', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 'bold' }}>U</div>
                        <span>{item.userId}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 20px', fontWeight: '500' }}>{item.merchant}</td>
                    <td style={{ padding: '14px 20px', color: 'var(--text-muted)', maxWidth: '220px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {item.description}
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ 
                        padding: '3px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: '700',
                        backgroundColor: isThreat ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)',
                        color: isThreat ? 'var(--danger-red)' : 'var(--success-green)'
                      }}>
                        {item.aiRiskAssessment?.riskScore || 0}/100
                      </span>
                    </td>
                    <td style={{ padding: '14px 20px' }}>
                      <span style={{ fontWeight: '600', color: isThreat ? 'var(--danger-red)' : 'var(--text-main)' }}>{item.status}</span>
                    </td>
                    <td style={{ padding: '14px 20px', color: '#2563eb', fontWeight: '500' }}>
                      
                      <span 
                        style={{ cursor: 'pointer', marginRight: '10px', textDecoration: 'underline' }} 
                        onClick={() => setSelectedRecord(item)}
                      >
                        [View]
                      </span>
                      <span style={{ cursor: 'pointer', color: 'var(--text-muted)' }}>[Assign]</span>
                    </td>
                  </tr>
                );
              })}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan="7" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No records indexed.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      
      {selectedRecord && (
        <div style={{
          position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
          backgroundColor: 'rgba(15, 23, 42, 0.6)', display: 'flex', alignItems: 'center',
          justifyContent: 'center', zIndex: 9999, backdropFilter: 'blur(4px)'
        }}>
          <div style={{
            backgroundColor: '#ffffff', width: '550px', borderRadius: '16px',
            boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)', border: '1px solid var(--border-color)',
            overflow: 'hidden', animation: 'fadeIn 0.2s ease-out'
          }}>
            
            <div style={{ padding: '20px 24px', backgroundColor: '#f8fafc', borderBottom: '1px solid var(--border-color)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>
                  Inspection File: #{selectedRecord.transactionID}
                </h3>
                <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Logged Node Security Manifest</span>
              </div>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ background: 'transparent', border: 'none', fontSize: '20px', color: 'var(--text-muted)', cursor: 'pointer', fontWeight: '700' }}
              >
                ✕
              </button>
            </div>

            
            <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>USER ASSOCIATION</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{selectedRecord.userId}</div>
                </div>
                <div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>TARGET MERCHANT</div>
                  <div style={{ fontSize: '14px', fontWeight: '700', color: '#1e293b', marginTop: '2px' }}>{selectedRecord.merchant}</div>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>TRANSACTION VOLUME</div>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#0f172a', marginTop: '2px' }}>${selectedRecord.amount}</div>
                </div>
                <div style={{ marginTop: '4px' }}>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '600' }}>PIPELINE STATUS</div>
                  <div style={{ 
                    fontSize: '13px', fontWeight: '700', marginTop: '4px',
                    color: selectedRecord.status === 'FLAGGED' ? 'var(--danger-red)' : 'var(--success-green)' 
                  }}>{selectedRecord.status}</div>
                </div>
              </div>

              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '6px' }}>RAW PAYLOAD DESCRIPTION</label>
                <div style={{ 
                  backgroundColor: '#0f172a', color: '#e2e8f0', padding: '14px', borderRadius: '8px', 
                  fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5', maxHeght: '100px', overflowY: 'auto' 
                }}>
                  "{selectedRecord.description}"
                </div>
              </div>

              
              <div style={{ height: '1px', backgroundColor: 'var(--border-color)', margin: '4px 0' }}></div>

              
              <div>
                <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '8px' }}>🛡️ GEMINI COGNITIVE AUDIT ASSESSMENTS</label>
                
                <div style={{ 
                  border: `1px solid ${selectedRecord.status === 'FLAGGED' ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`,
                  backgroundColor: selectedRecord.status === 'FLAGGED' ? 'rgba(239,68,68,0.02)' : 'rgba(16,185,129,0.02)',
                  padding: '16px', borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <span style={{ fontSize: '13px', fontWeight: '600', color: '#334155' }}>Computed Threat Index Rating:</span>
                    <span style={{ 
                      fontSize: '15px', fontWeight: '800', padding: '4px 12px', borderRadius: '20px',
                      color: selectedRecord.status === 'FLAGGED' ? 'var(--danger-red)' : 'var(--success-green)',
                      backgroundColor: selectedRecord.status === 'FLAGGED' ? 'rgba(239,68,68,0.1)' : 'rgba(16,185,129,0.1)'
                    }}>
                      {selectedRecord.aiRiskAssessment?.riskScore} / 100
                    </span>
                  </div>
                  
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: '700', marginBottom: '4px' }}>TECHNICAL JUSTIFICATION:</div>
                  <p style={{ margin: 0, fontSize: '13.5px', color: '#334155', lineHeight: '1.5', fontStyle: 'italic' }}>
                    "{selectedRecord.aiRiskAssessment?.justification || 'No technical assessment log found in schema payload.'}"
                  </p>
                </div>
              </div>

            </div>

            {/*--- HUMAN OVERRIDE PANEL --- */}
              {selectedRecord.status === 'FLAGGED' && (
                <div style={{ marginTop: '16px', padding: '16px', backgroundColor: '#f8fafc', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                  <h4 style={{ margin: '0 0 12px 0', fontSize: '13px', color: '#0f172a' }}>🛠️ Manual Auditor Override</h4>
                  
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '12px' }}>
                    <div style={{ flexGrow: 1 }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>Override Justification (Optional)</label>
                      <input 
                        type="text" 
                        placeholder="e.g., Verified identity via phone call." 
                        value={overrideComment}
                        onChange={(e) => setOverrideComment(e.target.value)}
                        style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px' }}
                      />
                    </div>
                    <div style={{ width: '120px' }}>
                      <label style={{ display: 'block', fontSize: '11px', fontWeight: '700', color: 'var(--text-muted)', marginBottom: '4px' }}>Set Risk (0-100)</label>
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
              {/*------------------------------- */}


            <div style={{ padding: '14px 24px', backgroundColor: '#f8fafc', borderTop: '1px solid var(--border-color)', display: 'flex', justifyContent: 'flex-end' }}>
              <button 
                onClick={() => setSelectedRecord(null)}
                style={{ 
                  backgroundColor: '#0f172a', color: '#ffffff', padding: '8px 16px', border: 'none', 
                  borderRadius: '6px', fontWeight: '600', fontSize: '13px', cursor: 'pointer' 
                }}
              >
                Dismiss Audit File
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
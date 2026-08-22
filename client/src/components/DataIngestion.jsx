import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { io } from 'socket.io-client';




export default function DataIngestion({ timestamp }) {
  const [logs, setLogs] = useState([]);
  const [dbCount, setDbCount] = useState(0); 
  const [avgSpeed, setAvgSpeed] = useState(0);

  
useEffect(() => {
    const socket = io('http://localhost:3000');
    
    socket.on('ingestion-stream', (newLog) => {
      setLogs((prevLogs) => [...prevLogs, newLog].slice(-50));
    });

    
    socket.on('ingestion-metrics', (data) => {
      setAvgSpeed(data.speed);
      setScanning(false); 
      
      
      axios.get('http://localhost:3000/api/v1/fraud/history')
        .then(res => { if (res.data.success) setDbCount(res.data.data.length); })
        .catch(err => console.error(err));
    });

    return () => socket.disconnect();
  }, []);

  
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({ userId: '', merchant: '', amount: '', description: '' });
  const [auditResult, setAuditResult] = useState(null);

  const handleManualSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setAuditResult(null);

    try {
      const res = await axios.post('http://localhost:3000/api/v1/fraud/manual-entry', formData);
      if (res.data.success) {
        setAuditResult(res.data.data);
        setFormData({ userId: '', merchant: '', amount: '', description: '' });
      }
    } catch (err) {
      alert("Failed to audit manual entry: " + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const [targetPayload, setTargetPayload] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
 


  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await axios.get('http://localhost:3000/api/v1/fraud/history');
        if (res.data.success) {
          setDbCount(res.data.data.length);
        }
      } catch (err) {
        console.error("Failed to read database volume metrics", err);
      }
    };
    fetchStats();
  }, [scanResult]); 

  const triggerFileParsing = (e) => {
    const targetFile = e.target.files[0];
    if (!targetFile) return;
    setLoadedFileName(targetFile.name);
    setLogs([]); 
    setScanResult(null);

    const docReader = new FileReader();
    docReader.onload = (event) => {
      try {
        const structuralJson = JSON.parse(event.target.result);
        setTargetPayload(structuralJson);
      } catch (err) {
        alert("Execution halted: System detected non-compliant file structuring.");
      }
    };
    docReader.readAsText(targetFile);
  };

  const dispatchVerificationScan = async () => {
    if (!targetPayload) return alert("Select an active transaction verification file.");
    
    setScanning(true);
    setScanResult(null);
    setAvgSpeed(0); 
    setLogs([]); 

    const token = localStorage.getItem('auditorToken');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};

    try {
      const payloadArray = Array.isArray(targetPayload) ? targetPayload : [targetPayload];

      
      await axios.post(
        'http://localhost:3000/api/v1/ingestion/trigger',
        { payload: payloadArray },
        { headers }
      );
      
    } catch (error) {
      console.error("Pipeline communication failure:", error);
      alert("Security pipeline processing engine error.");
      setScanning(false);
    }
  };

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0', color: '#0f172a' }}>Data Ingestion Center</h2>
          <div style={{ color: 'var(--text-muted)', fontSize: '13px', fontWeight: '500' }}>{timestamp}</div>
        </div>
        <button onClick={() => setShowModal(true)}
        style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 18px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
          ➕ Manual Entry
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Active Ingestion Jobs', data: scanning ? '1 Job' : '0 Jobs', subtitle: scanning ? 'AI scanning active' : 'Processing idle' },
          { label: 'Total Records Ingested', data: dbCount.toLocaleString(), subtitle: 'Live MongoDB count' },
          { label: 'Avg Ingestion Speed', data: avgSpeed > 0 ? `${avgSpeed} rec/sec` : '0 rec/sec', subtitle: 'Pipeline transmission velocity' },
          { label: 'Last Batch Status', data: dbCount > 0 ? 'Success' : 'N/A', subtitle: scanResult ? 'Completed just now' : 'Waiting for input', highlight: dbCount > 0 }
        ].map((stat, i) => (
          <div key={i} style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)' }}>
            <div style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: '600', marginBottom: '6px' }}>{stat.label}</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: stat.highlight ? 'var(--success-green)' : 'var(--text-main)' }}>{stat.data}</div>
            <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stat.subtitle}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '24px' }}>
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '40px 20px', borderRadius: '12px', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <div style={{ fontSize: '48px', marginBottom: '16px', color: 'var(--text-muted)' }}>📄</div>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: '0 0 8px 0' }}>Drag & Drop File to Ingest</h3>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 20px 0' }}>Supported formats: JSON. Max upload limit: 50MB</p>
          
          <label style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 20px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
            Browse Files
            <input type="file" accept=".json" onChange={triggerFileParsing} style={{ display: 'none' }} />
          </label>
          {loadedFileName && <div style={{ marginTop: '14px', fontSize: '12px', fontFamily: 'monospace', color: 'var(--success-green)', fontWeight: '600' }}>✔️ Manifest loaded: {loadedFileName}</div>}
        </div>

        <div style={{ backgroundColor: 'var(--card-bg)', padding: '20px', borderRadius: '12px', border: '1px solid var(--border-color)', display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
            <h4 style={{ margin: '0', fontSize: '14px', fontWeight: '700' }}>Ingestion Staging Vector</h4>
            <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              {logs.length > 0 ? 'Live WebSocket Feed' : targetPayload ? 'Preview Mode' : 'Idle'}
            </span>
          </div>
          
          <div style={{ flexGrow: 1, backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', overflowY: 'auto', maxHeight: '180px', minHeight: '180px' }}>
            
            {/* TERMINAL UI LOGIC */}
            {logs.length > 0 ? (
              logs.map((log, index) => (
                <div key={index} style={{ marginBottom: '4px', fontSize: '12px', fontFamily: 'monospace' }}>
                  <span style={{ color: '#64748b' }}>[{log.timestamp}]</span>{' '}
                  <span style={{ color: log.type === 'error' ? '#ef4444' : log.type === 'success' ? '#10b981' : log.type === 'warning' ? '#f59e0b' : '#38bdf8', marginLeft: '6px' }}>
                    {log.message}
                  </span>
                </div>
              ))
            ) : targetPayload ? (
              <pre style={{ margin: 0, color: '#38bdf8', fontSize: '12px', fontFamily: 'monospace' }}>{JSON.stringify(targetPayload, null, 2)}</pre>
            ) : (
              <div style={{ color: '#475569', fontSize: '13px', fontFamily: 'monospace', textAlign: 'center', marginTop: '60px' }}>[Waiting system payload allocation staging manifests]</div>
            )}

          </div>
          <button
            onClick={dispatchVerificationScan}
            disabled={scanning || !targetPayload}
            style={{ width: '100%', marginTop: '16px', padding: '12px', backgroundColor: scanning ? '#94a3b8' : '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', fontWeight: '700', cursor: scanning ? 'not-allowed' : 'pointer', fontSize: '14px' }}
          >
            {scanning ? 'Initializing AI Threat Audits...' : 'Execute Audit Pipeline'}
          </button>
        </div>
      </div>

      {/*--- MANUAL ENTRY MODAL --- */}
      {showModal && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#fff', padding: '28px', borderRadius: '12px', width: '450px', boxShadow: '0 20px 25px -5px rgba(0,0,0,0.1)' }}>
            
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px' }}>
              <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: '#0f172a' }}>⚡ Real-Time Manual Transaction Audit</h3>
              <button onClick={() => { setShowModal(false); setAuditResult(null); }} style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '16px', color: '#64748b' }}>✕</button>
            </div>

            {!auditResult ? (
              <form onSubmit={handleManualSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>User ID</label>
                  <input 
                    type="text" 
                    placeholder="e.g. USR_9921" 
                    value={formData.userId}
                    onChange={(e) => setFormData({...formData, userId: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Merchant Name *</label>
                  <input 
                    type="text" 
                    required
                    placeholder="e.g. Foreign Crypto Exchange LLC" 
                    value={formData.merchant}
                    onChange={(e) => setFormData({...formData, merchant: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Amount ($) *</label>
                  <input 
                    type="number" 
                    step="0.01"
                    required
                    placeholder="e.g. 4999.99" 
                    value={formData.amount}
                    onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '12px', fontWeight: '700', marginBottom: '4px', color: '#334155' }}>Description / Context</label>
                  <textarea 
                    placeholder="e.g. Transfer from non-standard IP subnet" 
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    style={{ width: '100%', padding: '8px 12px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '13px', height: '60px', boxSizing: 'border-box' }} 
                  />
                </div>

                <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                  <button type="button" onClick={() => setShowModal(false)} style={{ flex: 1, padding: '10px', border: '1px solid #cbd5e1', borderRadius: '6px', background: '#fff', cursor: 'pointer', fontWeight: '600', color: '#475569' }}>Cancel</button>
                  <button type="submit" disabled={loading} style={{ flex: 1, padding: '10px', border: 'none', borderRadius: '6px', background: '#2563eb', color: '#fff', cursor: 'pointer', fontWeight: '600' }}>
                    {loading ? "AI Auditing..." : "Audit Transaction"}
                  </button>
                </div>
              </form>
            ) : (
              <div style={{ backgroundColor: auditResult.status === 'FLAGGED' ? '#fef2f2' : '#f0fdf4', padding: '16px', borderRadius: '8px', border: `1px solid ${auditResult.status === 'FLAGGED' ? '#fca5a5' : '#86efac'}` }}>
                <h4 style={{ margin: '0 0 8px 0', color: auditResult.status === 'FLAGGED' ? '#991b1b' : '#166534', display: 'flex', justifyContent: 'space-between' }}>
                  <span>Status: {auditResult.status}</span>
                  <span>Score: {auditResult.aiRiskAssessment?.riskScore}/100</span>
                </h4>
                <p style={{ fontSize: '13px', color: '#334155', margin: '0 0 8px 0' }}><strong>Category Flag:</strong> {auditResult.aiRiskAssessment?.patternFlag}</p>
                <p style={{ fontSize: '12px', color: '#475569', margin: 0 }}><strong>AI Reasoning:</strong> {auditResult.aiRiskAssessment?.justification}</p>

                <button onClick={() => setAuditResult(null)} style={{ marginTop: '16px', width: '100%', padding: '8px', backgroundColor: '#0f172a', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  + Add Another Entry
                </button>
              </div>
            )}

          </div>
        </div>
      )}

      {scanResult && (
        <div style={{ backgroundColor: 'var(--card-bg)', padding: '24px', borderRadius: '12px', border: `2px solid ${scanResult.status === 'FLAGGED' ? 'var(--danger-red)' : 'var(--success-green)'}` }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
            <h3 style={{ margin: 0, fontSize: '18px', fontWeight: '700', color: scanResult.status === 'FLAGGED' ? 'var(--danger-red)' : 'var(--success-green)' }}>
              Audit Concluded: {scanResult.status}
            </h3>
            <span style={{ fontSize: '14px', fontWeight: '700', padding: '4px 12px', borderRadius: '20px', backgroundColor: '#f1f5f9' }}>
              Risk Rating: {scanResult.aiRiskAssessment?.riskScore} / 100
            </span>
          </div>
          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-main)', lineHeight: '1.6', backgroundColor: '#f8fafc', padding: '14px', borderRadius: '6px', border: '1px solid var(--border-color)' }}>
            <strong>Security Engine Justification:</strong> {scanResult.aiRiskAssessment?.justification}
          </p>
        </div>
      )}
    </div>
  );
}
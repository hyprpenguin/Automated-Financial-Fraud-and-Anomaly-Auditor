import React, { useState, useEffect } from 'react';
import axios from 'axios';

export default function DataIngestion({ timestamp }) {

  const [targetPayload, setTargetPayload] = useState(null);
  const [loadedFileName, setLoadedFileName] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState(null);
  

  const [dbCount, setDbCount] = useState(0); 

  
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

  try {
    if (Array.isArray(targetPayload)) {
      let lastResult = null;
      
      for (const currentTransaction of targetPayload) {
        const response = await axios.post('http://localhost:3000/api/v1/fraud/validate', currentTransaction);
        lastResult = response.data.data;
      }
      
      setScanResult(lastResult);
      alert(`Batch processing complete! Ingested ${targetPayload.length} transactions successfully.`);
    } else {
      const response = await axios.post('http://localhost:3000/api/v1/fraud/validate', targetPayload);
      setScanResult(response.data.data);
    }
  } catch (error) {
    console.error("Pipeline communication failure:", error);
    alert("Security pipeline processing engine error.");
  } finally {
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
        <button onClick
        style={{ backgroundColor: '#2563eb', color: '#ffffff', padding: '10px 18px', border: 'none', borderRadius: '8px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}>
          ➕ Manual Entry
        </button>
      </div>

      
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Active Ingestion Jobs', data: scanning ? '1 Job' : '0 Jobs', subtitle: scanning ? 'AI scanning active' : 'Processing idle' },
          { label: 'Total Records Ingested', data: dbCount.toLocaleString(), subtitle: 'Live MongoDB count' }, // 🌟 Dynamic Count!
          { label: 'Avg Ingestion Speed', data: dbCount > 0 ? '1,850 rec/sec' : '0 rec/sec', subtitle: 'Pipeline transmission velocity' },
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
          <h4 style={{ margin: '0 0 12px 0', fontSize: '14px', fontWeight: '700' }}>Ingestion Staging Vector</h4>
          <div style={{ flexGrow: 1, backgroundColor: '#0f172a', padding: '14px', borderRadius: '8px', overflowY: 'auto', maxHeight: '180px' }}>
            {targetPayload ? (
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
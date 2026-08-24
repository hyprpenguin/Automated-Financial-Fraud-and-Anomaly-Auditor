import React from 'react';

export default function Help() {
  return (
    <div style={{ padding: '32px', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#0f172a', margin: '0 0 8px 0' }}>Help & Support</h1>
        <p style={{ fontSize: '15px', color: '#64748b', margin: 0 }}>Quick reference guide for Sentinel's core modules.</p>
      </div>

      <div style={{ maxWidth: '800px', display: 'flex', flexDirection: 'column', gap: '24px' }}>

        {/* Quick Reference Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', borderBottom: '1px solid #e2e8f0', paddingBottom: '16px', marginBottom: '24px', marginTop: 0 }}>
            System Modules
          </h2>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#334155', margin: '0 0 6px 0' }}>Data Ingestion</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                Stream live transaction batches to the system. Sentinel evaluates each record against the active AI model and your dynamic heuristic rules in real-time.
              </p>
            </div>
            
            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#334155', margin: '0 0 6px 0' }}>Audit Reports & Sweeps</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                View flagged anomalies. Use the <strong>Run System Sweep</strong> tool to retroactively scan pending database records. Risk scores above 75 are automatically classified as malicious.
              </p>
            </div>

            <div>
              <h3 style={{ fontSize: '15px', fontWeight: '600', color: '#334155', margin: '0 0 6px 0' }}>AI Configurations</h3>
              <p style={{ fontSize: '14px', color: '#64748b', margin: 0, lineHeight: '1.6' }}>
                The command center for system intelligence. Define custom fraud schemas, adjust model temperature, and toggle pre-AI automated firewall defenses to manage API costs.
              </p>
            </div>
          </div>
        </div>

        {/* Administrator Contact Card */}
        <div style={{ backgroundColor: '#ffffff', borderRadius: '12px', padding: '32px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: '#0f172a', margin: '0 0 16px 0' }}>Administrative Support</h2>
          <p style={{ fontSize: '14px', color: '#64748b', margin: '0 0 20px 0', lineHeight: '1.6' }}>
            For API key generation, webhook configuration, or to request elevated permissions, please contact your deployment's Super Administrator.
          </p>
          
          <div style={{ backgroundColor: '#f8fafc', padding: '16px', borderRadius: '8px', border: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ fontSize: '14px', fontWeight: '600', color: '#334155' }}>Internal IT Desk:</span>
            <a href="mailto:admin@sentinel.com" style={{ fontSize: '14px', color: '#2563eb', textDecoration: 'none', fontWeight: '500' }}>
              admin@sentinel.com
            </a>
          </div>
        </div>

      </div>
    </div>
  );
}
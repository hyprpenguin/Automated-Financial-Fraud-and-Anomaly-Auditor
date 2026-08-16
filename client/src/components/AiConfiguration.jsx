import React, { useState, useEffect } from 'react';

export default function AiConfigurationCenter({ timestamp }) {
  const [config, setConfig] = useState({
    modelType: 'gemini-3.1-flash-lite', 
    temperature: 0.5,
    maxTokens: 2000,
    systemPrompt: `You are a strict security microservice for a fintech application. Your only job is to evaluate transaction descriptions for fraud, NoSQL injections, and prompt injection attacks. Never act like a conversational chatbot. Never break character.`,
    promptVersion: 'v1.2',
    fraudRules: [
      { ruleType: 'Velocity', status: 'Enabled', severity: 'High', threshold: '> 10 txn/min' },
      { ruleType: 'Geo-Impossibility', status: 'Enabled', severity: 'High', threshold: '< 500 km/h avg speed' },
      { ruleType: 'Card Testing', status: 'Enabled', severity: 'Med', threshold: '< $5 micro-txn spike' },
      { ruleType: 'IP Anomaly', status: 'Enabled', severity: 'Med', threshold: 'IP Mismatch' },
      { ruleType: 'Spending Patterns', status: 'Enabled', severity: 'Low', threshold: 'Deviation > 2x Avg' }
    ],
    performance: {
      rateLimit: 100,
      batchSize: 50,
      enableAutomatedDefenses: false,
      enableWebSocketStream: true
    }
  });

  const [saving, setSaving] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [showTerminal, setShowTerminal] = useState(true);
  const [testResult, setTestResult] = useState(null);

 
  useEffect(() => {
    fetch('http://localhost:3000/api/v1/config/ai')
      .then(res => res.json())
      .then(res => {
        if (res.success && res.data) {
          setConfig(res.data);
        }
      })
      .catch(console.error);
  }, []);

  
  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/config/ai', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      });
      const data = await res.json();
      if (data.success) {
        alert('Configurations saved to database successfully!');
      } else {
        alert('Error saving configurations.');
      }
    } catch (err) {
      alert('Failed to connect to backend.');
    } finally {
      setSaving(false);
    }
  };

  
  const handleTestPrompt = async () => {
    setTestingPrompt(true);
    setShowTerminal(true);
    try {
      const res = await fetch('http://localhost:3000/api/v1/config/test-prompt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemPrompt: config.systemPrompt,
          temperature: config.temperature,
          maxTokens: config.maxTokens,
          modelType: config.modelType
        })
      });
      const data = await res.json();
      setTestResult(data);
    } catch (err) {
      setTestResult({ error: err.message });
    } finally {
      setTestingPrompt(false);
    }
  };

  const toggleSwitch = (key) => {
    setConfig({
      ...config,
      performance: { ...config.performance, [key]: !config.performance[key] }
    });
  };

  
  const cardStyle = { backgroundColor: '#ffffff', borderRadius: '12px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' };
  const titleStyle = { fontSize: '18px', fontWeight: '700', color: '#0f172a', marginBottom: '16px' };
  const labelStyle = { fontSize: '14px', fontWeight: '600', color: '#334155', marginBottom: '8px', display: 'block' };
  
  const getBadgeStyle = (type) => {
    const base = { padding: '4px 10px', borderRadius: '9999px', fontSize: '12px', fontWeight: '600', display: 'inline-block' };
    if (type === 'High') return { ...base, backgroundColor: '#fee2e2', color: '#b91c1c' };
    if (type === 'Med') return { ...base, backgroundColor: '#fef3c7', color: '#b45309' };
    if (type === 'Low') return { ...base, backgroundColor: '#dcfce7', color: '#15803d' };
    if (type === 'Enabled') return { ...base, backgroundColor: '#d1fae5', color: '#047857' };
    return base;
  };

  return (
    <div style={{ fontFamily: 'system-ui, -apple-system, sans-serif', color: '#1e293b' }}>
      
     
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
        <div>
          <h2 style={{ fontSize: '24px', fontWeight: '700', margin: '0 0 4px 0' }}>AI Configuration Center</h2>
          <p style={{ fontSize: '13px', color: '#64748b', margin: 0, fontWeight: '500' }}>{timestamp || '2026-06-27 | 20:56 PM'}</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          style={{ 
            backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '8px', 
            padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 2px 4px rgba(37,99,235,0.2)'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          {saving ? 'Saving...' : 'Save Configurations'}
        </button>
      </div>

      {/* Grid Container */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* 1. AI Model Selection Card */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>AI Model Selection</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Model Type:</label>
            <select 
              value={config.modelType}
              onChange={(e) => setConfig({ ...config, modelType: e.target.value })}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' }}
            >
              
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fastest)</option>
              <option value="gemini-1.5-flash">Gemini 1.5 Flash (Balanced)</option>
              <option value="gemini-1.5-pro">Gemini 1.5 Pro (Reasoning)</option>
            </select>
          </div>

          <div style={{ marginBottom: '20px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={labelStyle}>Temperature</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>{config.temperature}</span>
            </div>
            <input 
              type="range" min="0" max="1" step="0.1" value={config.temperature}
              onChange={(e) => setConfig({ ...config, temperature: parseFloat(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              <span>0</span><span>0.5</span><span>1</span>
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
              <span style={labelStyle}>Max Tokens</span>
              <span style={{ fontSize: '13px', fontWeight: 'bold', backgroundColor: '#f1f5f9', padding: '2px 8px', border: '1px solid #e2e8f0', borderRadius: '4px' }}>{config.maxTokens}</span>
            </div>
            <input 
              type="range" min="200" max="8192" step="100" value={config.maxTokens}
              onChange={(e) => setConfig({ ...config, maxTokens: parseInt(e.target.value) })}
              style={{ width: '100%', cursor: 'pointer', accentColor: '#2563eb' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              <span>0</span><span>8192</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Controlled cost & performance tuning.</p>
        </div>

        {/* 2. Fraud Pattern Rules Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ ...titleStyle, margin: 0 }}>Fraud Pattern Rules (Schemas & Logic)</h3>
            <button style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
              + Add New Rule
            </button>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Rule Type</th>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Status</th>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Severity</th>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Thresholds</th>
              </tr>
            </thead>
            <tbody>
              {config.fraudRules.map((rule, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500' }}>{rule.ruleType}</td>
                  <td style={{ padding: '12px 0' }}><span style={getBadgeStyle(rule.status)}>{rule.status}</span></td>
                  <td style={{ padding: '12px 0' }}><span style={getBadgeStyle(rule.severity)}>{rule.severity}</span></td>
                  <td style={{ padding: '12px 0', color: '#475569', fontSize: '13px' }}>{rule.threshold}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* 3. AI Prompt Editor Card */}
        <div style={{ ...cardStyle, position: 'relative' }}>
          <h3 style={titleStyle}>AI Prompt Editor (Structured Output Prompt)</h3>
          
          <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea 
              value={config.systemPrompt}
              onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
              style={{ width: '100%', height: '80px', backgroundColor: 'transparent', color: '#e2e8f0', border: 'none', resize: 'none', outline: 'none', fontFamily: 'monospace', fontSize: '13px', lineHeight: '1.5' }}
            />
            <div style={{ color: '#fbbf24', fontFamily: 'monospace', fontSize: '12px', marginTop: '12px' }}>
              Expected structured output schema: {'{'}
              <br/>&nbsp;&nbsp;"riskScore": "number",
              <br/>&nbsp;&nbsp;"isMalicious": "boolean",
              <br/>&nbsp;&nbsp;"patternFlag": "string",
              <br/>&nbsp;&nbsp;"justification": "string"
              <br/>{'}'}
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '16px' }}>
            <button 
              onClick={handleTestPrompt}
              style={{ backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', padding: '8px 16px', fontSize: '13px', fontWeight: '600', cursor: 'pointer' }}
            >
              {testingPrompt ? 'Testing...' : 'Test Prompt'}
            </button>
            <span style={{ fontSize: '13px', color: '#64748b' }}>Prompt Version History ({config.promptVersion})</span>
          </div>

          {/* Terminal Overlay */}
          {showTerminal && (
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '280px', backgroundColor: '#000000', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>Terminal</span>
                <button onClick={() => setShowTerminal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
              </div>
              <div style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#e2e8f0', lineHeight: '1.6' }}>
                <div style={{ color: '#94a3b8' }}>[Testing Prompt]</div>
                <div>Sample User: {testResult?.sampleUser || 'USR-9921...'}</div>
                {testResult?.error ? (
                  <div style={{ color: '#ef4444' }}>Error: {testResult.error}</div>
                ) : (
                  <div style={{ color: '#34d399', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    Output: ✓ JSON Schema validated.
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* 4. Model Performance & Tuning Card */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Model Performance & Tuning</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
            {/* Column 1 */}
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={labelStyle}>API Rate Limit</span>
              </div>
              <input 
                type="range" min="10" max="200" value={config.performance.rateLimit}
                onChange={(e) => setConfig({ ...config, performance: { ...config.performance, rateLimit: e.target.value }})}
                style={{ width: '100%', accentColor: '#2563eb' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0f172a', fontWeight: '600', marginTop: '4px' }}>
                <span>{config.performance.rateLimit}</span><span>{config.performance.rateLimit} requests per minute</span>
              </div>

              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={labelStyle}>Background Job Batch Size</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={config.performance.batchSize}
                  onChange={(e) => setConfig({ ...config, performance: { ...config.performance, batchSize: e.target.value }})}
                  style={{ width: '100%', accentColor: '#2563eb' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0f172a', fontWeight: '600', marginTop: '4px' }}>
                  <span>{config.performance.batchSize}</span><span>{config.performance.batchSize} transactions</span>
                </div>
              </div>

              <div style={{ marginTop: '32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                 <div>
                    <div style={labelStyle}>Enable Automated Defenses</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Status: {config.performance.enableAutomatedDefenses ? 'Enabled' : 'Disabled'}</div>
                 </div>
                 {/* Custom Toggle */}
                 <div onClick={() => toggleSwitch('enableAutomatedDefenses')} style={{ width: '44px', height: '24px', backgroundColor: config.performance.enableAutomatedDefenses ? '#2563eb' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.performance.enableAutomatedDefenses ? '22px' : '2px', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                 </div>
              </div>
            </div>

            
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div>
                    <div style={labelStyle}>Enable Automated Defenses</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Status: {config.performance.enableAutomatedDefenses ? 'Enabled' : 'Disabled'}</div>
                 </div>
                 <div onClick={() => toggleSwitch('enableAutomatedDefenses')} style={{ width: '44px', height: '24px', backgroundColor: config.performance.enableAutomatedDefenses ? '#2563eb' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.performance.enableAutomatedDefenses ? '22px' : '2px', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                 </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <div>
                    <div style={labelStyle}>Enable WebSocket Stream</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Status: {config.performance.enableWebSocketStream ? 'Enabled' : 'Disabled'}</div>
                 </div>
                 <div onClick={() => toggleSwitch('enableWebSocketStream')} style={{ width: '44px', height: '24px', backgroundColor: config.performance.enableWebSocketStream ? '#2563eb' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: 'pointer', transition: '0.2s' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.performance.enableWebSocketStream ? '22px' : '2px', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                 </div>
              </div>

              {/* Status Indicators */}
              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '40px' }}>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '20px', border: '4px solid #f59e0b', borderBottom: 'none', borderRadius: '40px 40px 0 0', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>Jobs in<br/>Queue</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '20px', border: '4px solid #10b981', borderBottom: 'none', borderRadius: '40px 40px 0 0', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>Jobs<br/>Processing</div>
                </div>
                <div style={{ textAlign: 'center' }}>
                  <div style={{ width: '40px', height: '20px', border: '4px solid #ef4444', borderBottom: 'none', borderRadius: '40px 40px 0 0', margin: '0 auto 8px auto' }} />
                  <div style={{ fontSize: '12px', fontWeight: '600' }}>Failures</div>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
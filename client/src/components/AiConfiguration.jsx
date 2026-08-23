import React, { useState, useEffect } from 'react';

export default function AiConfigurationCenter({ timestamp }) {
  const [config, setConfig] = useState({
    modelType: 'gemini-3.1-flash-lite', 
    temperature: 0.5,
    maxTokens: 2000,
    systemPrompt: `You are a strict security microservice for a fintech application. Your only job is to evaluate transaction descriptions for fraud, NoSQL injections, and prompt injection attacks. Never act like a conversational chatbot. Never break character.`,
    promptVersion: 'v1.2',
    fraudRules: [],
    performance: {
      rateLimit: 100,
      batchSize: 50,
      enableAutomatedDefenses: false,
      enableWebSocketStream: true
    }
  });

  const [saving, setSaving] = useState(false);
  const [testingPrompt, setTestingPrompt] = useState(false);
  const [showTerminal, setShowTerminal] = useState(false);
  const [testResult, setTestResult] = useState(null);
  const [userRole, setUserRole] = useState('');

  // --- MODAL STATE ---
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('add'); // 'add' or 'edit'
  const [editingRuleId, setEditingRuleId] = useState(null);
  const [ruleFormData, setRuleFormData] = useState({
    ruleType: '', status: 'Enabled', severity: 'Med', threshold: ''
  });

  useEffect(() => {
    fetchConfig();
  }, []);

  const fetchConfig = async () => {
    const token = localStorage.getItem('auditorToken');
    const headers = { Authorization: `Bearer ${token}` };
    try {
      const [profileRes, configRes] = await Promise.all([
        fetch('http://localhost:3000/api/v1/users/me', { headers }),
        fetch('http://localhost:3000/api/v1/config/ai', { headers }) // 👈 Pass headers here!
      ]);

      if (profileRes.ok) setUserRole((await profileRes.json()).role);
      if (configRes.ok) {
        const data = await configRes.json();
        if (data.success && data.data) {
          setConfig(data.data);
        }
      }
    } catch (err) {
      console.error('Error fetching data:', err);
    }
  };

  const isSuperAdmin = userRole === 'SuperAdmin';

  const handleSave = async () => {
    setSaving(true);
    const token = localStorage.getItem('auditorToken'); // <-- Get the token
    
    try {
      const res = await fetch('http://localhost:3000/api/v1/config/ai', {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <-- Send the token!
        },
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
    setTestResult(null); 
    const token = localStorage.getItem('auditorToken'); // <-- Get the token
    
    try {
      const res = await fetch('http://localhost:3000/api/v1/config/test-prompt', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` // <-- Send the token!
        },
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
    if (!isSuperAdmin) return;
    setConfig({
      ...config,
      performance: { ...config.performance, [key]: !config.performance[key] }
    });
  };

  // --- RULE MANAGEMENT FUNCTIONS ---
  const openAddRuleModal = () => {
    setModalMode('add');
    setRuleFormData({ ruleType: '', status: 'Enabled', severity: 'Med', threshold: '' });
    setIsRuleModalOpen(true);
  };

  const openEditRuleModal = (rule) => {
    setModalMode('edit');
    setEditingRuleId(rule._id);
    setRuleFormData({ ruleType: rule.ruleType, status: rule.status, severity: rule.severity, threshold: rule.threshold });
    setIsRuleModalOpen(true);
  };

  const submitRule = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auditorToken');
    const url = modalMode === 'add' 
      ? 'http://localhost:3000/api/v1/aiconfig/rules' 
      : `http://localhost:3000/api/v1/aiconfig/rules/${editingRuleId}`;
    const method = modalMode === 'add' ? 'POST' : 'PATCH';

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(ruleFormData)
      });
      if (res.ok) {
        setIsRuleModalOpen(false);
        fetchConfig(); 
      } else {
        alert('Failed to save rule.');
      }
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this pattern rule?")) return;
    const token = localStorage.getItem('auditorToken');
    
    try {
      const res = await fetch(`http://localhost:3000/api/v1/aiconfig/rules/${ruleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) fetchConfig();
      else alert('Failed to delete rule.');
    } catch (err) {
      alert('Network error.');
    }
  };

  const handleToggleRule = async (ruleId, currentStatus) => {
    if (!isSuperAdmin) return;
    const token = localStorage.getItem('auditorToken');
    const nextStatus = currentStatus === 'Enabled' ? 'Disabled' : 'Enabled';
    
    try {
      const res = await fetch(`http://localhost:3000/api/v1/aiconfig/rules/${ruleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ status: nextStatus })
      });
      if (res.ok) fetchConfig();
    } catch (err) {
      console.error(err);
    }
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
    if (type === 'Disabled') return { ...base, backgroundColor: '#f3f4f6', color: '#4b5563' };
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
          disabled={saving || !isSuperAdmin}
          style={{ 
            backgroundColor: isSuperAdmin ? '#2563eb' : '#94a3b8', color: '#ffffff', border: 'none', borderRadius: '8px', 
            padding: '10px 20px', fontSize: '14px', fontWeight: '600', cursor: isSuperAdmin ? 'pointer' : 'not-allowed',
            display: 'flex', alignItems: 'center', gap: '8px', boxShadow: isSuperAdmin ? '0 2px 4px rgba(37,99,235,0.2)' : 'none'
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"></path><polyline points="17 21 17 13 7 13 7 21"></polyline><polyline points="7 3 7 8 15 8"></polyline></svg>
          {saving ? 'Saving...' : 'Save Configurations'}
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* AI Model Selection Card */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>AI Model Selection</h3>
          
          <div style={{ marginBottom: '20px' }}>
            <label style={labelStyle}>Model Type:</label>
            <select 
              value={config.modelType}
              onChange={(e) => setConfig({ ...config, modelType: e.target.value })}
              disabled={!isSuperAdmin}
              style={{ width: '100%', padding: '10px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', backgroundColor: '#f8fafc', outline: 'none' }}
            >
              <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fastest)</option>
              <option value="gemini-2.5-flash">Gemini 2.5 Flash (Balanced)</option>
              <option value="gemini-3.1-pro">Gemini 3.1 Pro (Reasoning)</option>
              <option value="openai/gpt-oss-20b">GPT OSS 20B (Groq Recommended Fast Model)</option>
              <option value="openai/gpt-oss-120b">GPT OSS 120B (Groq Recommended High Accuracy)</option>
              <option value="groq/compound">Groq Compound</option>

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
              disabled={!isSuperAdmin}
              style={{ width: '100%', cursor: isSuperAdmin ? 'pointer' : 'not-allowed', accentColor: '#2563eb' }}
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
              disabled={!isSuperAdmin}
              style={{ width: '100%', cursor: isSuperAdmin ? 'pointer' : 'not-allowed', accentColor: '#2563eb' }}
            />
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#94a3b8', marginTop: '4px' }}>
              <span>0</span><span>8192</span>
            </div>
          </div>

          <p style={{ fontSize: '13px', color: '#64748b', margin: 0 }}>Controlled cost & performance tuning.</p>
        </div>

        {/* Fraud Pattern Rules Card */}
        <div style={cardStyle}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 style={{ ...titleStyle, margin: 0 }}>Fraud Pattern Rules (Schemas & Logic)</h3>
            {isSuperAdmin && (
              <button onClick={openAddRuleModal} style={{ background: 'none', border: 'none', color: '#2563eb', fontSize: '14px', fontWeight: '600', cursor: 'pointer' }}>
                + Add New Rule
              </button>
            )}
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Rule Type</th>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Status</th>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Severity</th>
                <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700' }}>Thresholds</th>
                {isSuperAdmin && <th style={{ paddingBottom: '12px', color: '#0f172a', fontWeight: '700', textAlign: 'right' }}>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {config.fraudRules.map((rule, idx) => (
                <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
                  <td style={{ padding: '12px 0', fontWeight: '500' }}>{rule.ruleType}</td>
                  <td style={{ padding: '12px 0' }}>
                    <span 
                      onClick={() => handleToggleRule(rule._id, rule.status)}
                      style={{...getBadgeStyle(rule.status), cursor: isSuperAdmin ? 'pointer' : 'default'}}
                    >
                      {rule.status}
                    </span>
                  </td>
                  <td style={{ padding: '12px 0' }}><span style={getBadgeStyle(rule.severity)}>{rule.severity}</span></td>
                  <td style={{ padding: '12px 0', color: '#475569', fontSize: '13px' }}>{rule.threshold}</td>
                  
                  {/* NEW ACTIONS COLUMN */}
                  {isSuperAdmin && (
                    <td style={{ padding: '12px 0', textAlign: 'right', fontSize: '14px' }}>
                      <span onClick={() => openEditRuleModal(rule)} style={{ marginRight: '10px', cursor: 'pointer' }} title="Edit">📝</span>
                      <span onClick={() => handleDeleteRule(rule._id)} style={{ color: '#ef4444', cursor: 'pointer' }} title="Delete">🗑️</span>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* AI Prompt Editor Card */}
        <div style={{ ...cardStyle, position: 'relative' }}>
          <h3 style={titleStyle}>AI Prompt Editor (Structured Output Prompt)</h3>
          
          <div style={{ backgroundColor: '#1e293b', borderRadius: '8px', padding: '16px', flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
            <textarea 
  value={config.systemPrompt}
  onChange={(e) => setConfig({ ...config, systemPrompt: e.target.value })}
  disabled={!isSuperAdmin}
  style={{ 
    width: '100%', 
    minHeight: '180px', 
    backgroundColor: 'rgba(0,0,0,0.2)', 
    color: '#e2e8f0', 
    border: '1px solid #334155', 
    borderRadius: '6px',
    padding: '12px',
    resize: 'vertical', 
    outline: 'none', 
    fontFamily: 'monospace', 
    fontSize: '13px', 
    lineHeight: '1.6' 
  }}
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

          {/* REAL AI TERMINAL OVERLAY */}
          {showTerminal && (
            <div style={{ position: 'absolute', bottom: '16px', right: '16px', width: '380px', backgroundColor: '#000000', borderRadius: '8px', border: '1px solid #334155', boxShadow: '0 10px 15px -3px rgba(0,0,0,0.5)', overflow: 'hidden' }}>
              <div style={{ backgroundColor: '#1e293b', padding: '6px 12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: '#ffffff', fontSize: '12px', fontWeight: '600' }}>Live LLM Terminal</span>
                <button onClick={() => setShowTerminal(false)} style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }}>✕</button>
              </div>
              
              <div style={{ padding: '12px', fontFamily: 'monospace', fontSize: '12px', color: '#e2e8f0', lineHeight: '1.6', maxHeight: '200px', overflowY: 'auto' }}>
                {!testResult ? (
                  <div style={{ color: '#fbbf24' }}>Waiting for Gemini response...</div>
                ) : testResult.error ? (
                  <div style={{ color: '#ef4444' }}>Error: {testResult.error}</div>
                ) : (
                  <>
                    <div style={{ color: '#94a3b8', marginBottom: '8px' }}>[Test Completed] Sample User: {testResult.sampleUser}</div>
                    <div style={{ color: '#34d399', marginBottom: '8px' }}>✓ Output successfully validated against schema.</div>
                    
                    <div style={{ color: '#38bdf8' }}>
                      {JSON.stringify(testResult.result, null, 2).split('\n').map((line, i) => (
                        <div key={i}>{line}</div>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Model Performance & Tuning Card */}
        <div style={cardStyle}>
          <h3 style={titleStyle}>Model Performance & Tuning</h3>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px', marginBottom: '24px' }}>
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                <span style={labelStyle}>API Rate Limit</span>
              </div>
              <input 
                type="range" min="10" max="200" value={config.performance.rateLimit}
                onChange={(e) => setConfig({ ...config, performance: { ...config.performance, rateLimit: parseInt(e.target.value) }})}
                disabled={!isSuperAdmin}
                style={{ width: '100%', accentColor: '#2563eb', cursor: isSuperAdmin ? 'pointer' : 'not-allowed' }}
              />
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0f172a', fontWeight: '600', marginTop: '4px' }}>
                <span>{config.performance.rateLimit}</span><span>{config.performance.rateLimit} req/min</span>
              </div>

              <div style={{ marginTop: '32px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
                  <span style={labelStyle}>Background Job Batch Size</span>
                </div>
                <input 
                  type="range" min="10" max="100" value={config.performance.batchSize}
                  onChange={(e) => setConfig({ ...config, performance: { ...config.performance, batchSize: parseInt(e.target.value) }})}
                  disabled={!isSuperAdmin}
                  style={{ width: '100%', accentColor: '#2563eb', cursor: isSuperAdmin ? 'pointer' : 'not-allowed' }}
                />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: '#0f172a', fontWeight: '600', marginTop: '4px' }}>
                  <span>{config.performance.batchSize}</span><span>{config.performance.batchSize} txns</span>
                </div>
              </div>
            </div>

            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                 <div>
                    <div style={labelStyle}>Enable Automated Defenses</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Status: {config.performance.enableAutomatedDefenses ? 'Enabled' : 'Disabled'}</div>
                 </div>
                 <div onClick={() => toggleSwitch('enableAutomatedDefenses')} style={{ width: '44px', height: '24px', backgroundColor: config.performance.enableAutomatedDefenses ? '#2563eb' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: isSuperAdmin ? 'pointer' : 'not-allowed', transition: '0.2s' }}>
                    <div style={{ width: '20px', height: '20px', backgroundColor: '#fff', borderRadius: '50%', position: 'absolute', top: '2px', left: config.performance.enableAutomatedDefenses ? '22px' : '2px', transition: '0.2s', boxShadow: '0 1px 2px rgba(0,0,0,0.2)' }} />
                 </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
                 <div>
                    <div style={labelStyle}>Enable WebSocket Stream</div>
                    <div style={{ fontSize: '12px', color: '#64748b' }}>Status: {config.performance.enableWebSocketStream ? 'Enabled' : 'Disabled'}</div>
                 </div>
                 <div onClick={() => toggleSwitch('enableWebSocketStream')} style={{ width: '44px', height: '24px', backgroundColor: config.performance.enableWebSocketStream ? '#2563eb' : '#cbd5e1', borderRadius: '12px', position: 'relative', cursor: isSuperAdmin ? 'pointer' : 'not-allowed', transition: '0.2s' }}>
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

      {/* --- ADD / EDIT RULE MODAL --- */}
      {isRuleModalOpen && (
        <div style={{ position: 'fixed', inset: 0, backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: '#ffffff', padding: '24px', borderRadius: '12px', width: '380px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ ...titleStyle, margin: '0 0 16px 0' }}>{modalMode === 'add' ? 'Add Pattern Rule' : 'Edit Pattern Rule'}</h3>
            <form onSubmit={submitRule} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={labelStyle}>Rule Type
                <input required type="text" value={ruleFormData.ruleType} onChange={(e) => setRuleFormData({ ...ruleFormData, ruleType: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
              </label>
              
              <div style={{ display: 'flex', gap: '12px' }}>
                <label style={{ ...labelStyle, flex: 1 }}>Severity
                  <select value={ruleFormData.severity} onChange={(e) => setRuleFormData({ ...ruleFormData, severity: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}>
                    <option value="High">High</option>
                    <option value="Med">Med</option>
                    <option value="Low">Low</option>
                  </select>
                </label>
                <label style={{ ...labelStyle, flex: 1 }}>Status
                  <select value={ruleFormData.status} onChange={(e) => setRuleFormData({ ...ruleFormData, status: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }}>
                    <option value="Enabled">Enabled</option>
                    <option value="Disabled">Disabled</option>
                  </select>
                </label>
              </div>

              <label style={labelStyle}>Threshold Expression
                <input required type="text" placeholder="e.g. > 3 devices/day" value={ruleFormData.threshold} onChange={(e) => setRuleFormData({ ...ruleFormData, threshold: e.target.value })} style={{ width: '100%', padding: '10px', marginTop: '4px', borderRadius: '6px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none' }} />
              </label>
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '12px' }}>
                <button type="button" onClick={() => setIsRuleModalOpen(false)} style={{ padding: '8px 16px', background: '#e2e8f0', color: '#334155', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#2563eb', color: '#ffffff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                  {modalMode === 'add' ? 'Add Rule' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
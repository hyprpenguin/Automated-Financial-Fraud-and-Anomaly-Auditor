import React, { useState } from 'react';

export default function Login({ onLoginSuccess }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('http://localhost:3000/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (res.ok && data.success) {
        localStorage.setItem('auditorToken', data.token);
        if (onLoginSuccess) onLoginSuccess(); 
      } else {
        setError(data.error || 'Invalid credentials');
      }
    } catch (err) {
      setError('Failed to connect to the server.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      
      {/* LEFT SIDE ) */}
      <div style={{ 
        flex: 1, 
        backgroundColor: '#0f172a', 
        color: '#ffffff', 
        display: 'flex', 
        flexDirection: 'column', 
        justifyContent: 'center', 
        padding: '10%',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative Background Elements */}
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '300px', height: '300px', background: 'radial-gradient(circle, rgba(37,99,235,0.2) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '-5%', width: '400px', height: '400px', background: 'radial-gradient(circle, rgba(16,185,129,0.1) 0%, rgba(15,23,42,0) 70%)', borderRadius: '50%' }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '24px' }}>
            <div style={{ backgroundColor: '#ffffff', color: '#0f172a', width: '40px', height: '40px', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '20px' }}>
              S
            </div>
            <h1 style={{ fontSize: '32px', fontWeight: '800', letterSpacing: '2px', margin: 0 }}>SENTINEL</h1>
          </div>
          <h2 style={{ fontSize: '42px', fontWeight: '700', lineHeight: '1.2', marginBottom: '24px' }}>
            Automated Financial Fraud & Anomaly Detector
          </h2>
          <p style={{ fontSize: '16px', color: '#94a3b8', lineHeight: '1.6', maxWidth: '400px' }}>
            Enterprise-grade fraud detection powered by generative AI and adaptive heuristics. Secure your transaction pipeline in real-time.
          </p>
        </div>
      </div>

      {/* AUTHENTICATION FORM */}
      <div style={{ flex: 1, backgroundColor: '#f8fafc', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', backgroundColor: '#ffffff', borderRadius: '12px', padding: '40px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.05), 0 2px 4px -1px rgba(0,0,0,0.03)', border: '1px solid #e2e8f0' }}>
          
          <h3 style={{ fontSize: '24px', fontWeight: '700', color: '#0f172a', marginBottom: '8px', marginTop: 0 }}>Auditor Portal Access</h3>
          <p style={{ fontSize: '14px', color: '#64748b', marginBottom: '32px', marginTop: 0 }}>Enter your credentials to access the command center.</p>

          {error && (
            <div style={{ backgroundColor: '#fef2f2', borderLeft: '4px solid #ef4444', color: '#b91c1c', padding: '12px', fontSize: '13px', borderRadius: '4px', marginBottom: '24px' }}>
              {error}
            </div>
          )}

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Email Address</label>
              <input 
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@sentinel.com"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#334155', marginBottom: '6px' }}>Password</label>
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={{ width: '100%', padding: '12px 16px', borderRadius: '8px', border: '1px solid #cbd5e1', fontSize: '14px', outline: 'none', transition: 'border-color 0.2s', boxSizing: 'border-box' }}
                onFocus={(e) => e.target.style.borderColor = '#2563eb'}
                onBlur={(e) => e.target.style.borderColor = '#cbd5e1'}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading}
              style={{ 
                marginTop: '12px',
                width: '100%', 
                padding: '12px', 
                backgroundColor: loading ? '#94a3b8' : '#2563eb', 
                color: '#ffffff', 
                border: 'none', 
                borderRadius: '8px', 
                fontSize: '14px', 
                fontWeight: '600', 
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'background-color 0.2s'
              }}
            >
              {loading ? 'Authenticating...' : 'Secure Login'}
            </button>
          </form>

          <div style={{ marginTop: '32px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
            <p>Authorized personnel only. All access attempts are logged.</p>
          </div>

        </div>
      </div>
    </div>
  );
}
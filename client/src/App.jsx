import React, { useState, useEffect } from 'react';
import Dashboard from './components/Dashboard';
import DataIngestion from './components/DataIngestion';
import AuditReports from './components/AuditReports'; 
import VulnerabilitySandbox from './components/VulnerabilitySandbox';
import AiConfigurationCenter from './components/AiConfiguration';
import Login from './components/Login'; 
import Settings from './components/Settings';
import Help from './components/Help';

export default function App() {
  // 1. ADDED AUTHENTICATION STATE 👇
  const [isAuthenticated, setIsAuthenticated] = useState(
    !!localStorage.getItem('auditorToken')
  );

  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentDateStr, setCurrentDateStr] = useState('');

  const [currentUser, setCurrentUser] = useState(null);

  const getFormattedDateTime = () => {
    const now = new Date();
    const yyyy = now.getFullYear();
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const dd = String(now.getDate()).padStart(2, '0');
    
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    
    hours = hours % 12;
    hours = hours ? hours : 12; 
    const formattedHours = String(hours).padStart(2, '0');

    return `${yyyy}-${mm}-${dd} | ${formattedHours}:${minutes}:${seconds} ${ampm}`;
  };

  useEffect(() => {
    setCurrentDateStr(getFormattedDateTime());

    const timer = setInterval(() => {
      setCurrentDateStr(getFormattedDateTime());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const isTabEnabled = (tabId) => ['dashboard', 'ingestion', 'reports', 'sandbox', 'aiconfiguration', 'settings','help'].includes(tabId);

  const getHeaderTitle = () => {
    switch (activeTab) {
      case 'ingestion': return 'Data Ingestion';
      case 'reports': return 'Audit Reports';
      case 'sandbox': return 'Vulnerability Sandbox Center';
      case 'aiconfiguration': return 'AI Configuration Center';  
      default: return 'Fraud Detection';
    }
  };



  useEffect(() => {
    // Only try to fetch if the user is actually logged in!
    if (isAuthenticated) {
      const fetchUser = async () => {
        try {
          const token = localStorage.getItem('auditorToken');
          const res = await fetch('http://localhost:3000/api/v1/users/me', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
            setCurrentUser(await res.json());
          }
        } catch (err) {
          console.error("Failed to fetch user for header", err);
        }
      };
      fetchUser();
    }
  }, [isAuthenticated]); // Re-run this if they log in/out

  // 2. THE GATEKEEPER 👇
  // If the user is NOT logged in, stop right here and show the Login screen.
  if (!isAuthenticated) {
    return <Login onLoginSuccess={() => setIsAuthenticated(true)} />;
  }

  // 3. LOGOUT FUNCTION 👇
  const handleLogout = () => {
    localStorage.removeItem('auditorToken'); // Destroy the VIP pass
    setIsAuthenticated(false); // Flip the state to force the Login screen to show
  };

  // If they ARE logged in, React ignores the block above and renders your full layout below!
  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <aside style={{ width: '260px', backgroundColor: 'var(--sidebar-bg)', color: '#ffffff', padding: '24px 16px', display: 'flex', flexDirection: 'column', flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '40px', paddingLeft: '8px' }}>
          <div style={{ backgroundColor: '#ffffff', color: 'var(--sidebar-bg)', width: '32px', height: '32px', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '18px' }}>S</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', margin: 0, letterSpacing: '0.5px' }}>SENTINEL</h1>
        </div>

        <nav style={{ display: 'flex', flexDirection: 'column', gap: '8px', flexGrow: 1 }}>
          {[
            { id: 'dashboard', label: 'Dashboard', icon: '📊' },
            { id: 'ingestion', label: 'Data Ingestion', icon: '📥' },
            { id: 'reports', label: 'Audit Reports', icon: '📋' },
            { id: 'aiconfiguration', label: 'AI Configurations', icon: '⚙️' },
            { id: 'sandbox', label: 'Vulnerability Sandbox', icon: '🧪' }, 
            { id: 'settings', label: 'Settings', icon: '🔧' },
            { id: 'help', label: 'Help', icon: '❓' }
          ].map((tab) => {
            const isSelected = activeTab === tab.id;
            const enabled = isTabEnabled(tab.id);

            return (
              <button
                key={tab.id}
                onClick={() => enabled && setActiveTab(tab.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px',
                  backgroundColor: isSelected ? 'rgba(255,255,255,0.15)' : 'transparent',
                  color: isSelected ? '#ffffff' : '#94a3b8', border: 'none', borderRadius: '8px',
                  textAlign: 'left', cursor: enabled ? 'pointer' : 'not-allowed',
                  fontWeight: isSelected ? '600' : '400', fontSize: '14px', transition: '0.2s'
                }}
              >
                <span>{tab.icon}</span> {tab.label}
              </button>
            );
          })}
        </nav>
      </aside>

      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        <header style={{ height: '70px', backgroundColor: '#ffffff', borderBottom: '1px solid var(--border-color)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 32px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-main)', margin: 0 }}>
            {getHeaderTitle()}
          </h2>
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
            {/* DYNAMIC HEADER PROFILE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{ width: '36px', height: '36px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--sidebar-bg)' }}>
                {/* Dynamically grab the first letter of their name */}
                {currentUser?.name ? currentUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div style={{ fontSize: '13px' }}>
                <div style={{ fontWeight: '600', color: 'var(--text-main)' }}>
                  {currentUser?.name || 'Loading...'}
                </div>
                <div style={{ color: 'var(--text-muted)', fontSize: '11px' }}>
                  {currentUser?.role === 'SuperAdmin' ? 'Super Administrator' : currentUser?.role}
                </div>
              </div>
              
              <button 
                onClick={handleLogout}
                style={{ marginLeft: '12px', padding: '6px 12px', backgroundColor: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold', color: 'var(--danger-red)' }}
              >
                Logout
              </button>
            </div>
          </div>
        </header>

        <main style={{ flexGrow: 1, padding: '32px', overflowY: 'auto' }}>
          {activeTab === 'dashboard' && <Dashboard timestamp={currentDateStr} />}
          {activeTab === 'ingestion' && <DataIngestion timestamp={currentDateStr} />}
          {activeTab === 'reports' && <AuditReports timestamp={currentDateStr} />}
          {activeTab === 'aiconfiguration' && <AiConfigurationCenter timestamp={currentDateStr} />}
          {activeTab === 'sandbox' && <VulnerabilitySandbox timestamp={currentDateStr} />}
          {activeTab === 'settings' && <Settings timestamp={currentDateStr}/>}
          {activeTab === 'help' && <Help timestamp={currentDateStr}/>}

        </main>
      </div>
    </div>
  );
}
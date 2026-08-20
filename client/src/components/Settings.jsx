import React, { useState, useEffect } from 'react';

const Settings = ({ timestamp }) => {
  const [profile, setProfile] = useState(null);
  const [team, setTeam] = useState([]);
  const [integrations, setIntegrations] = useState(null); 
  const [loading, setLoading] = useState(true);

  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('invite'); 
  const [editUserId, setEditUserId] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', role: 'Auditor', password: '', status: 'Active', phone: ''
  });

  const fetchSettingsData = async () => {
    const token = localStorage.getItem('auditorToken');
    const headers = { 'Authorization': `Bearer ${token}` };

    try {
      const profileRes = await fetch('http://localhost:3000/api/v1/users/me', { headers });
      const profileData = await profileRes.json();
      setProfile(profileData);

      // Only fetch admin-level data if they are a SuperAdmin!
      if (profileData.role === 'SuperAdmin') {
        const teamRes = await fetch('http://localhost:3000/api/v1/users', { headers });
        if (teamRes.ok) setTeam(await teamRes.json());

        // Fetch Integrations Config
        const intRes = await fetch('http://localhost:3000/api/v1/settings/integrations', { headers });
        if (intRes.ok) setIntegrations(await intRes.json());
      }
    } catch (err) {
      console.error("Failed to fetch settings data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSettingsData();
  }, []);

  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(integrations?.apiKey);
    alert("API Key copied to clipboard!");
  };

  const handleGenerateKey = async () => {
    if (!window.confirm("WARNING: Generating a new API key will instantly break existing integrations. Continue?")) return;
    const token = localStorage.getItem('auditorToken');
    const res = await fetch('http://localhost:3000/api/v1/settings/integrations/apikey', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}` }
    });
    if (res.ok) setIntegrations(await res.json());
  };

  const handleConfigureWebhook = async () => {
    const newUrl = window.prompt("Enter new Webhook URL:", integrations?.webhookUrl);
    if (!newUrl || newUrl === integrations?.webhookUrl) return;
    
    const token = localStorage.getItem('auditorToken');
    const res = await fetch('http://localhost:3000/api/v1/settings/integrations/webhook', {
      method: 'PUT',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ webhookUrl: newUrl })
    });
    if (res.ok) setIntegrations(await res.json());
  };

  
  const openInviteModal = () => {
    setModalMode('invite');
    setFormData({ name: '', email: '', role: 'Auditor', password: '', status: 'Active', phone: '' });
    setIsModalOpen(true);
  };

  const openEditTeamModal = (member) => {
    setModalMode('editTeam');
    setEditUserId(member._id);
    setFormData({ name: member.name || '', email: member.email, role: member.role, password: '', status: member.status, phone: '' });
    setIsModalOpen(true);
  };

  const openEditProfileModal = () => {
    setModalMode('editProfile');
    setFormData({ 
      name: profile?.name || '', email: profile?.email || '', phone: profile?.phone || '', 
      password: '', role: profile?.role, status: profile?.status 
    });
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this user?")) return;
    const token = localStorage.getItem('auditorToken');
    const res = await fetch(`http://localhost:3000/api/v1/users/${id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${token}` } });
    if (res.ok) fetchSettingsData(); 
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('auditorToken');
    let url = '', method = '';

    if (modalMode === 'invite') {
      url = 'http://localhost:3000/api/v1/auth/create-user'; method = 'POST';
      formData.tempPassword = formData.password;
    } else if (modalMode === 'editProfile') {
      url = 'http://localhost:3000/api/v1/users/me'; method = 'PUT';
    } else {
      url = `http://localhost:3000/api/v1/users/${editUserId}`; method = 'PUT';
    }

    const res = await fetch(url, { method, headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' }, body: JSON.stringify(formData) });
    if (res.ok) { setIsModalOpen(false); fetchSettingsData(); } 
    else { alert((await res.json()).error || 'Error'); }
  };

  
  const maskApiKey = (key) => {
    if (!key) return '';
    return key.substring(0, 12) + '••••••••••' + key.substring(key.length - 4);
  };

  const getRelativeTime = (dateString) => {
    if (!dateString) return "Never used";
    
    const now = new Date();
    const past = new Date(dateString);
    const diffInSeconds = Math.floor((now - past) / 1000);

    if (diffInSeconds < 60) return "just now";
    
    const minutes = Math.floor(diffInSeconds / 60);
    if (minutes < 60) return `${minutes} minute${minutes === 1 ? '' : 's'} ago`;
    
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} hour${hours === 1 ? '' : 's'} ago`;
    
    const days = Math.floor(hours / 24);
    return `${days} day${days === 1 ? '' : 's'} ago`;
  };

  if (loading) return <div>Loading settings...</div>;

  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', position: 'relative' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div>
          <h2 style={{ margin: 0, fontSize: '24px', color: '#1e293b' }}>Settings Center</h2>
          <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>{timestamp}</p>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>
        
        {/* MY PROFILE CARD */}
        <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', display: 'flex', flexDirection: 'column' }}>
          <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>My Profile</h3>
          <p style={{ margin: '0 0 20px 0', color: '#64748b', fontSize: '14px' }}>User management</p>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-start', flexGrow: 1 }}>
            <div style={{ width: '80px', height: '80px', borderRadius: '50%', backgroundColor: '#cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: '#475569', flexShrink: 0 }}>
              {profile?.name ? profile.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div style={{ flexGrow: 1 }}>
              <div style={{ marginBottom: '8px' }}><strong>Name:</strong> {profile?.name}</div>
              <div style={{ marginBottom: '8px' }}><strong>Email:</strong> {profile?.email}</div>
              <div style={{ marginBottom: '8px' }}><strong>Phone:</strong> {profile?.phone}</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <strong>Role:</strong> 
                <span style={{ backgroundColor: '#bfdbfe', color: '#1d4ed8', padding: '2px 10px', borderRadius: '12px', fontSize: '12px', fontWeight: '600' }}>
                  {profile?.role === 'SuperAdmin' ? 'Super Administrator' : profile?.role}
                </span>
              </div>
            </div>
          </div>
          <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid #f1f5f9' }}>
            <button onClick={openEditProfileModal} style={{ padding: '8px 16px', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', cursor: 'pointer', fontWeight: '500', color: '#0f172a' }}>
              ✏️ Edit Profile & Password
            </button>
          </div>
        </div>

        {/* TEAM & ROLE-BASED ACCESS CARD */}
        {profile?.role === 'SuperAdmin' && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>Team & Role-Based Access</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>RBAC management</p>
              </div>
              <button onClick={openInviteModal} style={{ padding: '6px 12px', border: '1px solid #cbd5e1', backgroundColor: 'white', borderRadius: '6px', cursor: 'pointer', color: '#3b82f6', fontWeight: '500' }}>
                + Invite Member
              </button>
            </div>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: '14px' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '8px 0', color: '#475569', fontWeight: '600' }}>Member</th>
                  <th style={{ padding: '8px 0', color: '#475569', fontWeight: '600' }}>Role</th>
                  <th style={{ padding: '8px 0', color: '#475569', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '8px 0', color: '#475569', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {team.map((member) => (
                  <tr key={member._id} style={{ borderBottom: '1px solid #f1f5f9' }}>
                    <td style={{ padding: '12px 0', fontWeight: '500' }}>{member.name || 'New User'}<br/><span style={{fontSize: '11px', color: '#94a3b8'}}>{member.email}</span></td>
                    <td style={{ padding: '12px 0', color: '#64748b' }}>{member.role === 'SuperAdmin' ? 'Super Admin' : member.role}</td>
                    <td style={{ padding: '12px 0' }}>
                      <span style={{ backgroundColor: member.status === 'Active' ? '#dcfce7' : '#f1f5f9', color: member.status === 'Active' ? '#166534' : '#475569', padding: '2px 8px', borderRadius: '12px', fontSize: '12px', fontWeight: '500' }}>{member.status || 'Active'}</span>
                    </td>
                    <td style={{ padding: '12px 0', textAlign: 'right', cursor: 'pointer', fontSize: '16px' }}>
                      <span onClick={() => openEditTeamModal(member)} style={{ marginRight: '10px' }} title="Edit">📝</span>
                      {member._id !== profile._id && (
                        <span onClick={() => handleDelete(member._id)} style={{ color: '#ef4444' }} title="Delete">🗑️</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* API KEYS & INTEGRATIONS CARD (Super Admin Only) */}
        {profile?.role === 'SuperAdmin' && integrations && (
          <div style={{ backgroundColor: 'white', borderRadius: '8px', padding: '24px', border: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)', gridColumn: '2 / 3' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
              <div>
                <h3 style={{ margin: '0 0 4px 0', fontSize: '18px' }}>API Keys & Integrations</h3>
                <p style={{ margin: 0, color: '#64748b', fontSize: '14px' }}>Developer settings</p>
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '14px', marginBottom: '6px' }}>
                <span style={{ fontWeight: '600' }}>Masked API key</span>
                <span style={{ color: '#16a34a', fontWeight: '600' }}>Status: Active</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', backgroundColor: '#f8fafc', border: '1px solid #cbd5e1', borderRadius: '6px', overflow: 'hidden' }}>
                <div style={{ flexGrow: 1, padding: '10px 12px', fontFamily: 'monospace', color: '#475569' }}>
                  {maskApiKey(integrations.apiKey)}
                </div>
                <button onClick={copyToClipboard} style={{ padding: '10px 16px', border: 'none', borderLeft: '1px solid #cbd5e1', backgroundColor: 'white', cursor: 'pointer', color: '#64748b' }} title="Copy to clipboard">
                  📋
                </button>
              </div>
              <p style={{ margin: '6px 0 0 0', fontSize: '12px', color: '#64748b' }}>
                Used {getRelativeTime(integrations.apiKeyLastUsed)} by Sentinel Ingestion Engine.
              </p>
            </div>

            <div style={{ marginBottom: '24px', fontSize: '14px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                <span style={{ fontWeight: '600' }}>Configured Endpoint: POST /api/v1/fraud/notify</span>
              </div>
              <div style={{ color: '#475569', wordBreak: 'break-all' }}>
                <strong>URL:</strong> {integrations.webhookUrl}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={handleGenerateKey} style={{ flex: 1, padding: '8px 0', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Generate New Key</button>
              <button onClick={handleConfigureWebhook} style={{ flex: 1, padding: '8px 0', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '500' }}>Configure Webhook</button>
            </div>
          </div>
        )}
      </div>

      {/* --- POP-UP MODAL (Remains Unchanged) --- */}
      {isModalOpen && (
        <div style={{ position: 'fixed', top: 0, left: 0, width: '100%', height: '100%', backgroundColor: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
          <div style={{ backgroundColor: 'white', padding: '24px', borderRadius: '8px', width: '400px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
            <h3 style={{ marginTop: 0 }}>
              {modalMode === 'invite' ? 'Invite New Member' : modalMode === 'editProfile' ? 'Edit My Profile' : 'Edit Member'}
            </h3>
            
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label>Name<input required type="text" value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} /></label>
              <label>Email<input required disabled={modalMode !== 'invite'} type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc', backgroundColor: modalMode !== 'invite' ? '#f1f5f9' : 'white' }} /></label>
              
              {modalMode === 'editProfile' && (
                <label>Phone Number<input type="text" value={formData.phone} onChange={(e) => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} /></label>
              )}

              {(modalMode === 'invite' || modalMode === 'editProfile') && (
                <label>{modalMode === 'editProfile' ? 'New Password (leave blank to keep current)' : 'Temporary Password'}
                  <input required={modalMode === 'invite'} type="password" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }} />
                </label>
              )}

              {(modalMode === 'invite' || modalMode === 'editTeam') && (
                <div style={{ display: 'flex', gap: '12px' }}>
                  <label style={{ flex: 1 }}>Role
                    <select value={formData.role} onChange={(e) => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                      <option value="Auditor">Auditor</option><option value="Analyst">Analyst</option><option value="SuperAdmin">SuperAdmin</option>
                    </select>
                  </label>
                  {modalMode === 'editTeam' && (
                    <label style={{ flex: 1 }}>Status
                      <select value={formData.status} onChange={(e) => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '8px', marginTop: '4px', borderRadius: '4px', border: '1px solid #ccc' }}>
                        <option value="Active">Active</option><option value="Inactive">Inactive</option>
                      </select>
                    </label>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '16px' }}>
                <button type="button" onClick={() => setIsModalOpen(false)} style={{ padding: '8px 16px', backgroundColor: '#e2e8f0', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>Cancel</button>
                <button type="submit" style={{ padding: '8px 16px', backgroundColor: '#3b82f6', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>{modalMode === 'invite' ? 'Send Invite' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
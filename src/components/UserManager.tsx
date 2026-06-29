import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/db';
import { User, UserRole, ProgrammeName } from '../types';
import { UserPlus, Shield, Eye, Settings, RefreshCw, KeyRound, Ban, CheckCircle2 } from 'lucide-react';

export const UserManager: React.FC = () => {
  const { t } = useAuth();
  
  // States
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  // Form states
  const [username, setUsername] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('trainer');
  const [prog, setProg] = useState<ProgrammeName | 'All'>('All');
  const [schoolsStr, setSchoolsStr] = useState('');
  const [districtsStr, setDistrictsStr] = useState('');

  // Permission choices
  const ALL_PERMISSIONS = [
    'View Students', 'Add Students', 'Edit Students', 'Delete Students',
    'View Attendance', 'Mark Attendance', 'View Reports', 'Export Reports',
    'Manage Inventory', 'Manage Users', 'Manage Fleet', 'View Financials', 'AI Insight Access'
  ];

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = () => {
    setUsers(db.getUsers());
  };

  const handleCreateUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !name) return;

    // Set default permissions based on role
    let defaultPermissions: string[] = ['View Students'];
    if (role === 'super_admin') {
      defaultPermissions = [...ALL_PERMISSIONS];
    } else if (role === 'programme_head') {
      defaultPermissions = ['View Students', 'Add Students', 'Edit Students', 'View Attendance', 'View Reports', 'Export Reports', 'Manage Inventory', 'AI Insight Access'];
    } else if (role === 'programme_coordinator') {
      defaultPermissions = ['View Students', 'Add Students', 'Edit Students', 'View Attendance', 'Mark Attendance', 'View Reports', 'Export Reports'];
    } else if (role === 'trainer') {
      defaultPermissions = ['View Students', 'View Attendance', 'Mark Attendance'];
    } else if (role === 'counsellor') {
      defaultPermissions = ['View Students', 'View Reports'];
    } else if (role === 'inventory_team') {
      defaultPermissions = ['Manage Inventory', 'View Reports'];
    } else if (role === 'transport_team') {
      defaultPermissions = ['Manage Fleet', 'View Reports'];
    }

    const newUser: User = {
      username: username.trim().toLowerCase(),
      name,
      role,
      assignedProgramme: prog,
      assignedSchools: schoolsStr.split(',').map(s => s.trim()).filter(Boolean),
      assignedDistricts: districtsStr.split(',').map(d => d.trim()).filter(Boolean),
      permissions: defaultPermissions,
      isActive: true,
      activityLogs: [
        { id: 'log_' + Math.floor(100+Math.random()*900), timestamp: new Date().toISOString(), action: 'Account Created', details: `Super Admin created profile for ${name}` }
      ]
    };

    db.saveUser(newUser);
    loadUsers();
    setShowAddModal(false);

    // Reset
    setUsername('');
    setName('');
    setRole('trainer');
    setProg('All');
    setSchoolsStr('');
    setDistrictsStr('');
  };

  const handleTogglePermission = (username: string, permission: string) => {
    const user = db.getUsers().find(u => u.username === username);
    if (!user) return;

    let updatedPerms = [...user.permissions];
    if (updatedPerms.includes(permission)) {
      updatedPerms = updatedPerms.filter(p => p !== permission);
    } else {
      updatedPerms.push(permission);
    }

    const updatedUser = { ...user, permissions: updatedPerms };
    db.saveUser(updatedUser);
    setSelectedUser(updatedUser);
    loadUsers();
  };

  const handleToggleActive = (username: string) => {
    const user = db.getUsers().find(u => u.username === username);
    if (!user) return;

    const updatedUser = { ...user, isActive: !user.isActive };
    db.saveUser(updatedUser);
    setSelectedUser(updatedUser);
    loadUsers();
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex justify-between items-center pb-4 border-b border-slate-200 dark:border-dark-border">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight font-heading">{t('users')}</h1>
          <p className="text-sm text-slate-500 mt-1">Super Admin dashboard to configure team profiles, roles, and granular scopes</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="btn-primary"
        >
          <UserPlus size={18} />
          <span>Create User Profile</span>
        </button>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        
        {/* Left side Roster grid */}
        <div className="xl:col-span-2 bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border rounded-md shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50 dark:bg-dark-card border-b border-slate-200 dark:border-dark-border text-slate-500 font-bold uppercase tracking-wider">
                  <th className="p-3">Username & Name</th>
                  <th className="p-3">Security Role</th>
                  <th className="p-3">Program / District Scopes</th>
                  <th className="p-3">Status</th>
                  <th className="p-3 text-right">Configure</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-dark-border font-medium text-slate-700 dark:text-slate-300">
                {users.map(user => (
                  <tr 
                    key={user.username}
                    onClick={() => setSelectedUser(user)}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/20 cursor-pointer transition-colors ${
                      selectedUser?.username === user.username ? 'bg-primary/5 dark:bg-primary/10' : ''
                    }`}
                  >
                    <td className="p-3">
                      <div>
                        <div className="font-bold text-slate-900 dark:text-white">{user.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono mt-0.5">@{user.username}</div>
                      </div>
                    </td>
                    <td className="p-3 capitalize font-bold text-slate-950 dark:text-slate-200">
                      {user.role.replace(/_/g, ' ')}
                    </td>
                    <td className="p-3">
                      <div className="text-[11px]">Prog: <span className="font-bold">{user.assignedProgramme}</span></div>
                      <div className="text-[9px] text-slate-400 mt-0.5 truncate w-40">Districts: {user.assignedDistricts.join(', ') || 'None'}</div>
                    </td>
                    <td className="p-3">
                      <span className={`inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        user.isActive ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {user.isActive ? 'Active' : 'Disabled'}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <button className="text-primary hover:text-primary-dark font-bold inline-flex items-center gap-0.5">
                        Edit <Settings size={14} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right side Detail Configuration Drawer */}
        <div className="xl:col-span-1">
          {selectedUser ? (
            <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border p-5 rounded-md shadow-sm space-y-6">
              
              <div className="flex justify-between items-start pb-4 border-b border-slate-200 dark:border-dark-border">
                <div>
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white truncate">Scope: @{selectedUser.username}</h2>
                  <p className="text-[10px] text-slate-500 font-semibold">{selectedUser.name}</p>
                </div>
                
                {/* Active / Disable toggle */}
                <button
                  onClick={() => handleToggleActive(selectedUser.username)}
                  className={`p-1.5 rounded border text-xs font-semibold ${
                    selectedUser.isActive 
                      ? 'border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400' 
                      : 'border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-500'
                  }`}
                  title={selectedUser.isActive ? 'Disable User' : 'Activate User'}
                >
                  <Ban size={14} />
                </button>
              </div>

              {/* Password simulation info */}
              <div className="p-3 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border rounded text-xs leading-relaxed text-slate-500">
                <div className="flex items-center gap-2 mb-1.5 font-bold text-slate-700 dark:text-slate-300">
                  <KeyRound size={14} className="text-primary" />
                  <span>Security Credentials</span>
                </div>
                <span>Initial login pass: <span className="font-mono text-slate-900 dark:text-white font-bold select-all">password123</span></span>
                <span className="block mt-1">Force Password Reset flag can be managed via Cloud auth.</span>
              </div>

              {/* Granular Permission Checklist */}
              <div className="space-y-3">
                <span className="block text-xs font-bold text-slate-400 uppercase tracking-wider">Granular Permission Gates</span>
                <div className="max-h-64 overflow-y-auto space-y-1 bg-slate-50 dark:bg-dark-card border border-slate-200 dark:border-dark-border p-2 rounded-md">
                  {ALL_PERMISSIONS.map(p => {
                    const isGranted = selectedUser.permissions.includes(p);
                    return (
                      <label 
                        key={p} 
                        className="flex items-center justify-between p-2 rounded hover:bg-slate-100 dark:hover:bg-slate-800 text-[11px] font-medium cursor-pointer"
                      >
                        <span className="text-slate-800 dark:text-slate-300">{p}</span>
                        <input
                          type="checkbox"
                          checked={isGranted}
                          onChange={() => handleTogglePermission(selectedUser.username, p)}
                          className="rounded border-slate-300 dark:border-dark-border text-primary focus:ring-0 w-3.5 h-3.5"
                        />
                      </label>
                    );
                  })}
                </div>
              </div>

            </div>
          ) : (
            <div className="bg-slate-100/50 dark:bg-dark-surface/40 border border-dashed border-slate-200 dark:border-dark-border p-12 rounded-md text-center text-xs text-slate-500">
              <Shield size={24} className="mx-auto text-slate-400 mb-2" />
              Select any user account from the registry list to modify their security roles, active statuses, or configure granular access permissions.
            </div>
          )}
        </div>

      </div>

      {/* --- CREATE USER MODAL --- */}
      {showAddModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-dark-surface border border-slate-200 dark:border-dark-border w-full max-w-[450px] rounded-lg shadow-xl p-6 relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-500 hover:text-white text-xs font-bold"
            >
              Close
            </button>

            <h2 className="text-base font-bold font-heading mb-4 text-slate-900 dark:text-white">Create Staff Account</h2>

            <form onSubmit={handleCreateUser} className="space-y-4">
              
              {/* Username */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Username *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. trainer.john"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Name */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Role */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Security Role</label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="super_admin">Super Admin</option>
                    <option value="programme_head">Programme Head</option>
                    <option value="programme_coordinator">Coordinator</option>
                    <option value="trainer">Trainer</option>
                    <option value="counsellor">Counsellor</option>
                    <option value="inventory_team">Inventory Team</option>
                    <option value="transport_team">Transport Team</option>
                    <option value="viewer">Viewer (Read-only)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-500 mb-1">Programme Limit</label>
                  <select
                    value={prog}
                    onChange={(e) => setProg(e.target.value as any)}
                    className="input-field"
                  >
                    <option value="All">All Programmes</option>
                    <option value="Vocational">Vocational</option>
                    <option value="Pre-Vocational">Pre-Vocational</option>
                    <option value="Udyam">Udyam</option>
                    <option value="Magic Touch">Magic Touch</option>
                  </select>
                </div>
              </div>

              {/* Assigned schools */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned School Codes (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. S101, S102"
                  value={schoolsStr}
                  onChange={(e) => setSchoolsStr(e.target.value)}
                  className="input-field"
                />
              </div>

              {/* Assigned districts */}
              <div>
                <label className="block text-xs font-semibold text-slate-500 mb-1">Assigned Districts (comma separated)</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad, Surendranagar"
                  value={districtsStr}
                  onChange={(e) => setDistrictsStr(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="flex gap-2 justify-end pt-3 border-t border-slate-100 dark:border-dark-border/60">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="btn-secondary"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  className="btn-primary"
                >
                  Create Account
                </button>
              </div>

            </form>
          </div>
        </div>
      )}
    </div>
  );
};

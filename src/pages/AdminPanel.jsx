import React, { useEffect, useState } from 'react';
import { useOutletContext } from 'react-router-dom';
import { Shield, Users, Trophy, Radio, AlertTriangle, BarChart3, Eye, Trash2, Check, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/ui/StatusBadge';

const TABS = [
  { id: 'users', label: 'Users', icon: Users },
  { id: 'competitions', label: 'Competitions', icon: Trophy },
  { id: 'streams', label: 'Streams', icon: Radio },
  { id: 'reports', label: 'Reports', icon: AlertTriangle },
  { id: 'audit', label: 'Audit Logs', icon: BarChart3 },
];

export default function AdminPanel() {
  const { user, profile } = useOutletContext() || {};
  const [tab, setTab] = useState('users');
  const [users, setUsers] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [streams, setStreams] = useState([]);
  const [reports, setReports] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (profile?.is_admin) loadTab(tab);
  }, [tab, profile]);

  const loadTab = async (t) => {
    setLoading(true);
    try {
      if (t === 'users') {
        const [u, p] = await Promise.all([
          base44.entities.User.list(),
          base44.entities.UserProfile.list(),
        ]);
        setUsers(u);
        setProfiles(p);
      } else if (t === 'competitions') {
        const c = await base44.entities.Competition.list('-created_date', 50);
        setCompetitions(c);
      } else if (t === 'streams') {
        const s = await base44.entities.Stream.list('-created_date', 50);
        setStreams(s);
      } else if (t === 'reports') {
        const r = await base44.entities.Report.list('-created_date', 50);
        setReports(r);
      } else if (t === 'audit') {
        const a = await base44.entities.AuditLog.list('-created_date', 100);
        setAuditLogs(a);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReport = async (reportId, status) => {
    await base44.entities.Report.update(reportId, { status });
    setReports(prev => prev.map(r => r.id === reportId ? { ...r, status } : r));
  };

  if (!user) return <div className="text-center py-24"><p className="text-muted-foreground">Sign in required.</p></div>;
  if (!profile?.is_admin) return (
    <div className="text-center py-24">
      <Shield size={40} className="mx-auto mb-4 text-muted-foreground/40" />
      <h2 className="font-bold text-lg mb-2">Admin Access Required</h2>
      <p className="text-muted-foreground text-sm">You don't have permission to access this panel.</p>
    </div>
  );

  const formatDate = (dt) => dt ? new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—';

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-indigo-arena/10 flex items-center justify-center">
          <Shield size={20} className="text-indigo-arena" />
        </div>
        <div>
          <h1 className="text-2xl font-bold font-heading">Admin Panel</h1>
          <p className="text-muted-foreground text-sm">Platform management</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="arena-card overflow-hidden">
        <div className="flex border-b border-border overflow-x-auto">
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-arena-fast border-b-2 -mb-px ${
                tab === t.id ? 'border-foreground text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {loading ? (
            <div className="flex justify-center py-16">
              <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
            </div>
          ) : (
            <>
              {/* USERS */}
              {tab === 'users' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Name / Email', 'Roles', 'Joined', 'Actions'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {users.map(u => {
                        const p = profiles.find(pr => pr.user_id === u.id);
                        return (
                          <tr key={u.id} className="hover:bg-secondary/50 transition-arena-fast">
                            <td className="py-3 px-3">
                              <p className="font-medium">{u.full_name || '—'}</p>
                              <p className="text-xs text-muted-foreground">{u.email}</p>
                            </td>
                            <td className="py-3 px-3">
                              <div className="flex flex-wrap gap-1">
                                {p?.is_admin && <span className="text-xs px-1.5 py-0.5 bg-indigo-arena/10 text-indigo-arena rounded font-medium">Admin</span>}
                                {p?.is_moderator && <span className="text-xs px-1.5 py-0.5 bg-secondary text-muted-foreground rounded font-medium">Mod</span>}
                                {p?.is_creator && <span className="text-xs px-1.5 py-0.5 bg-ember-light text-ember rounded font-medium">Creator</span>}
                                {p?.is_organizer && <span className="text-xs px-1.5 py-0.5 bg-live-light text-live rounded font-medium">Organizer</span>}
                                {!p?.is_admin && !p?.is_creator && !p?.is_organizer && !p?.is_moderator && (
                                  <span className="text-xs text-muted-foreground">User</span>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-3 text-muted-foreground">{formatDate(u.created_date)}</td>
                            <td className="py-3 px-3">
                              <button className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-arena-fast">
                                <Eye size={13} />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                  {users.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No users found</p>}
                </div>
              )}

              {/* COMPETITIONS */}
              {tab === 'competitions' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Competition', 'Type', 'Status', 'Created'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {competitions.map(c => (
                        <tr key={c.id} className="hover:bg-secondary/50 transition-arena-fast">
                          <td className="py-3 px-3 font-medium">{c.name}</td>
                          <td className="py-3 px-3 capitalize text-muted-foreground">{c.competition_type}</td>
                          <td className="py-3 px-3"><StatusBadge status={c.status} /></td>
                          <td className="py-3 px-3 text-muted-foreground">{formatDate(c.created_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {competitions.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No competitions found</p>}
                </div>
              )}

              {/* STREAMS */}
              {tab === 'streams' && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        {['Stream', 'Status', 'Viewers', 'Created'].map(h => (
                          <th key={h} className="text-left py-3 px-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                      {streams.map(s => (
                        <tr key={s.id} className="hover:bg-secondary/50 transition-arena-fast">
                          <td className="py-3 px-3 font-medium">{s.title}</td>
                          <td className="py-3 px-3"><StatusBadge status={s.status} /></td>
                          <td className="py-3 px-3 text-muted-foreground">{s.viewer_count || 0}</td>
                          <td className="py-3 px-3 text-muted-foreground">{formatDate(s.created_date)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {streams.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No streams found</p>}
                </div>
              )}

              {/* REPORTS */}
              {tab === 'reports' && (
                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="p-4 bg-secondary rounded-lg flex items-start gap-3">
                      <AlertTriangle size={16} className="text-ember shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{r.reason}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <StatusBadge status={r.status} />
                          <span className="text-xs text-muted-foreground">{formatDate(r.created_date)}</span>
                        </div>
                      </div>
                      {r.status === 'open' && (
                        <div className="flex items-center gap-2">
                          <button onClick={() => handleUpdateReport(r.id, 'reviewing')} className="p-1.5 text-muted-foreground hover:text-foreground rounded transition-arena-fast text-xs">
                            Review
                          </button>
                          <button onClick={() => handleUpdateReport(r.id, 'resolved')} className="p-1.5 text-live hover:opacity-70 rounded transition-arena-fast">
                            <Check size={14} />
                          </button>
                          <button onClick={() => handleUpdateReport(r.id, 'rejected')} className="p-1.5 text-destructive hover:opacity-70 rounded transition-arena-fast">
                            <X size={14} />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                  {reports.length === 0 && (
                    <div className="text-center py-12">
                      <Check size={32} className="mx-auto mb-3 text-live/50" />
                      <p className="text-muted-foreground">No reports to review</p>
                    </div>
                  )}
                </div>
              )}

              {/* AUDIT LOGS */}
              {tab === 'audit' && (
                <div className="space-y-2">
                  {auditLogs.map(log => (
                    <div key={log.id} className="flex items-start gap-3 p-3 rounded-lg hover:bg-secondary/50 transition-arena-fast">
                      <div className="w-2 h-2 rounded-full bg-ember shrink-0 mt-1.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="text-sm font-mono font-medium text-foreground">{log.action}</span>
                          {log.entity_type && (
                            <span className="text-xs text-muted-foreground bg-secondary px-1.5 py-0.5 rounded">{log.entity_type}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">{formatDate(log.created_date)} · User ID: {log.user_id?.slice(-8)}</p>
                      </div>
                    </div>
                  ))}
                  {auditLogs.length === 0 && <p className="text-center py-8 text-muted-foreground text-sm">No audit logs yet</p>}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Trophy, Users, BarChart3, Radio, Plus, ChevronRight, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CompetitionCard from '@/components/ui/CompetitionCard';
import StatusBadge from '@/components/ui/StatusBadge';

export default function OrganizerDashboard() {
  const { user, profile } = useOutletContext() || {};
  const [competitions, setCompetitions] = useState([]);
  const [allRegistrations, setAllRegistrations] = useState([]);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updatingReg, setUpdatingReg] = useState(null);

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [comps, cats, discs, plansList, subs] = await Promise.all([
        base44.entities.Competition.filter({ organizer_id: user.id }, '-created_date', 50),
        base44.entities.Category.list(),
        base44.entities.Discipline.list(),
        base44.entities.OrganizerPlan.list(),
        base44.entities.UserSubscription.filter({ user_id: user.id }),
      ]);
      setCompetitions(comps);
      setCategories(cats);
      setDisciplines(discs);
      const sub = subs[0] || null;
      setSubscription(sub);
      let activePlan = null;
      if (sub?.organizer_plan_id) activePlan = plansList.find(p => p.id === sub.organizer_plan_id);
      if (!activePlan) activePlan = plansList.find(p => p.name === 'Free');
      setPlan(activePlan);

      if (comps.length > 0) {
        const regs = await base44.entities.CompetitionRegistration.list('-created_date', 200);
        const myCompIds = new Set(comps.map(c => c.id));
        setAllRegistrations(regs.filter(r => myCompIds.has(r.competition_id)));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReg = async (regId, status) => {
    setUpdatingReg(regId);
    try {
      await base44.entities.CompetitionRegistration.update(regId, { status });
      setAllRegistrations(prev => prev.map(r => r.id === regId ? { ...r, status } : r));
    } finally {
      setUpdatingReg(null);
    }
  };

  if (!user) return <div className="text-center py-24"><p className="text-muted-foreground">Sign in to access Organizer Dashboard.</p></div>;
  if (!profile?.is_organizer) return (
    <div className="text-center py-24 max-w-md mx-auto">
      <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/40" />
      <h2 className="font-bold text-lg mb-2">Organizer Access Required</h2>
      <p className="text-muted-foreground text-sm mb-4">Enable Organizer mode on your profile to manage competitions.</p>
      <Link to="/profile" className="px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium">Enable Organizer Mode</Link>
    </div>
  );
  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;

  const activeComps = competitions.filter(c => ['live', 'registration_open', 'registration_closed'].includes(c.status));
  const pendingRegs = allRegistrations.filter(r => r.status === 'pending');
  const maxComps = plan?.max_active_competitions || 3;
  const isAtLimit = activeComps.length >= maxComps;

  const getCategory = (id) => categories.find(c => c.id === id);
  const getDiscipline = (id) => disciplines.find(d => d.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Organizer Dashboard</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {activeComps.length > 0
              ? `${activeComps.length} active competition${activeComps.length !== 1 ? 's' : ''}`
              : 'No active competitions'}
          </p>
        </div>
        <Link
          to="/create-competition"
          className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-arena-fast ${
            isAtLimit
              ? 'bg-secondary text-muted-foreground cursor-not-allowed'
              : 'bg-foreground text-background hover:bg-foreground/90'
          }`}
          onClick={e => isAtLimit && e.preventDefault()}
        >
          <Plus size={16} />
          {isAtLimit ? 'Plan Limit Reached' : 'Create Competition'}
        </Link>
      </div>

      {/* Plan limit warning */}
      {isAtLimit && (
        <div className="arena-card p-4 border-l-4 border-l-ember flex items-start gap-3">
          <AlertCircle size={18} className="text-ember shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-semibold text-sm">Active competition limit reached</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Your {plan?.name} plan allows {maxComps} active competitions. Upgrade to create more.
            </p>
          </div>
          <Link to="/pricing" className="shrink-0 px-3 py-1.5 bg-ember text-white rounded-lg text-xs font-semibold">
            Upgrade Plan
          </Link>
        </div>
      )}

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active Competitions', value: activeComps.length, icon: Trophy },
          { label: 'Pending Registrations', value: pendingRegs.length, icon: Users },
          { label: 'Total Registrations', value: allRegistrations.length, icon: BarChart3 },
          { label: 'Plan Limit', value: `${activeComps.length}/${maxComps}`, icon: Radio },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="arena-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon size={14} />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="text-2xl font-bold font-display">{value}</p>
          </div>
        ))}
      </div>

      {/* Pending Registrations */}
      {pendingRegs.length > 0 && (
        <div className="arena-card overflow-hidden">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-bold text-base">Pending Registrations</h2>
            <span className="text-xs font-bold text-ember bg-ember-light px-2 py-0.5 rounded-full">{pendingRegs.length}</span>
          </div>
          <div className="divide-y divide-border">
            {pendingRegs.slice(0, 10).map(reg => {
              const comp = competitions.find(c => c.id === reg.competition_id);
              return (
                <div key={reg.id} className="p-4 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium">{comp?.name || 'Competition'}</p>
                    <p className="text-xs text-muted-foreground mt-0.5 capitalize">{reg.registration_type} registration</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleUpdateReg(reg.id, 'approved')}
                      disabled={updatingReg === reg.id}
                      className="px-3 py-1.5 bg-live-light text-live rounded-lg text-xs font-semibold hover:opacity-80 transition-arena-fast disabled:opacity-40"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleUpdateReg(reg.id, 'rejected')}
                      disabled={updatingReg === reg.id}
                      className="px-3 py-1.5 bg-destructive/10 text-destructive rounded-lg text-xs font-semibold hover:opacity-80 transition-arena-fast disabled:opacity-40"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* My Competitions */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-bold text-lg font-heading">My Competitions</h2>
          <Link to="/competitions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
            Browse all <ChevronRight size={14} />
          </Link>
        </div>
        {competitions.length === 0 ? (
          <div className="arena-card p-12 text-center">
            <Trophy size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="font-semibold text-muted-foreground">No competitions yet</p>
            <Link to="/create-competition" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium">
              <Plus size={14} /> Create your first
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {competitions.map(comp => (
              <CompetitionCard
                key={comp.id}
                competition={comp}
                discipline={getDiscipline(comp.discipline_id)}
                category={getCategory(comp.category_id)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
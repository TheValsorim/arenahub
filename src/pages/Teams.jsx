import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Users, Plus, Search, Flag, Trophy } from 'lucide-react';
import { base44 } from '@/api/base44Client';

export default function Teams() {
  const { user, profile } = useOutletContext() || {};
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [creating, setCreating] = useState(false);
  const [newTeam, setNewTeam] = useState({ name: '', description: '', country: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    base44.entities.Team.list('-created_date', 50).then(setTeams).finally(() => setLoading(false));
  }, []);

  const filtered = teams.filter(t =>
    !search || t.name?.toLowerCase().includes(search.toLowerCase()) ||
    t.description?.toLowerCase().includes(search.toLowerCase())
  );

  const handleCreate = async () => {
    if (!newTeam.name.trim()) return;
    setSaving(true);
    try {
      const team = await base44.entities.Team.create({
        ...newTeam,
        captain_id: user.id,
      });
      await base44.entities.TeamMember.create({
        team_id: team.id,
        user_id: user.id,
        role: 'captain',
        status: 'active',
        joined_at: new Date().toISOString(),
      });
      setTeams(prev => [team, ...prev]);
      setNewTeam({ name: '', description: '', country: '' });
      setCreating(false);
    } finally {
      setSaving(false);
    }
  };

  const myTeams = teams.filter(t => t.captain_id === user?.id);

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Teams</h1>
          <p className="text-muted-foreground text-sm mt-1">{loading ? 'Loading...' : `${filtered.length} teams`}</p>
        </div>
        {user && (
          <button
            onClick={() => setCreating(!creating)}
            className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast"
          >
            <Plus size={15} /> Create Team
          </button>
        )}
      </div>

      {/* Create Team Form */}
      {creating && (
        <div className="arena-card p-5 space-y-4 border-2 border-foreground">
          <h3 className="font-bold">Create New Team</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Team Name *</label>
              <input
                value={newTeam.name}
                onChange={e => setNewTeam(t => ({ ...t, name: e.target.value }))}
                placeholder="Team Phoenix"
                className="w-full px-3 py-2 border border-accessible rounded-lg text-sm focus:outline-none bg-background"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Country</label>
              <input
                value={newTeam.country}
                onChange={e => setNewTeam(t => ({ ...t, country: e.target.value }))}
                placeholder="Country"
                className="w-full px-3 py-2 border border-accessible rounded-lg text-sm focus:outline-none bg-background"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground mb-1">Description</label>
            <textarea
              value={newTeam.description}
              onChange={e => setNewTeam(t => ({ ...t, description: e.target.value }))}
              placeholder="About your team..."
              rows={2}
              className="w-full px-3 py-2 border border-accessible rounded-lg text-sm focus:outline-none bg-background resize-none"
            />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setCreating(false)} className="px-4 py-2 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">Cancel</button>
            <button
              onClick={handleCreate}
              disabled={!newTeam.name.trim() || saving}
              className="px-5 py-2 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-50"
            >
              {saving ? 'Creating...' : 'Create Team'}
            </button>
          </div>
        </div>
      )}

      {/* Search */}
      <div className="relative">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search teams..."
          className="w-full pl-9 pr-4 py-2.5 text-sm bg-card border border-border rounded-lg focus:outline-none focus:border-foreground/30 transition-arena-fast"
        />
      </div>

      {/* My Teams */}
      {myTeams.length > 0 && (
        <div>
          <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-3">My Teams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {myTeams.map(team => (
              <TeamCard key={team.id} team={team} isCaptain />
            ))}
          </div>
        </div>
      )}

      {/* All Teams */}
      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div>
          {myTeams.length > 0 && <h2 className="font-semibold text-sm uppercase tracking-widest text-muted-foreground mb-3">All Teams</h2>}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.filter(t => !myTeams.find(m => m.id === t.id)).map(team => (
              <TeamCard key={team.id} team={team} />
            ))}
          </div>
        </div>
      ) : (
        <div className="arena-card p-12 text-center">
          <Users size={32} className="mx-auto mb-3 text-muted-foreground/40" />
          <p className="text-muted-foreground">No teams found</p>
        </div>
      )}
    </div>
  );
}

function TeamCard({ team, isCaptain }) {
  return (
    <div className="arena-card p-5 hover:shadow-md transition-arena">
      <div className="flex items-start gap-3">
        <div className="w-12 h-12 rounded-xl bg-foreground/5 flex items-center justify-center overflow-hidden shrink-0">
          {team.logo_url ? (
            <img src={team.logo_url} alt={team.name} className="w-full h-full object-cover" />
          ) : (
            <Users size={20} className="text-muted-foreground" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-bold text-sm truncate">{team.name}</h3>
            {isCaptain && <span className="text-xs px-1.5 py-0.5 bg-ember-light text-ember rounded font-semibold shrink-0">Captain</span>}
          </div>
          {team.country && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
              <Flag size={10} />
              {team.country}
            </div>
          )}
          {team.description && (
            <p className="text-xs text-muted-foreground mt-2 line-clamp-2">{team.description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
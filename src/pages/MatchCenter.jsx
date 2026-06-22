import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { ChevronLeft, Trophy, Plus, Trash2, Check, AlertCircle } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/ui/StatusBadge';
import StreamCard from '@/components/ui/StreamCard';

const MATCH_STATUSES = ['scheduled', 'live', 'completed', 'cancelled', 'disputed'];

export default function MatchCenter() {
  const { id } = useParams();
  const { user, profile } = useOutletContext() || {};
  const [match, setMatch] = useState(null);
  const [competition, setCompetition] = useState(null);
  const [scores, setScores] = useState([]);
  const [streams, setStreams] = useState([]);
  const [round, setRound] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newUnit, setNewUnit] = useState({ unit_name: '', team_a_score: '', team_b_score: '' });

  useEffect(() => {
    loadData();
  }, [id]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [matches] = await Promise.all([
        base44.entities.Match.filter({ id }),
      ]);
      if (matches.length === 0) { setLoading(false); return; }
      const m = matches[0];
      setMatch(m);
      const [comps, scoreList, streamList] = await Promise.all([
        base44.entities.Competition.filter({ id: m.competition_id }),
        base44.entities.MatchScore.filter({ match_id: m.id }),
        base44.entities.Stream.filter({ match_id: m.id }),
      ]);
      setCompetition(comps[0] || null);
      setScores(scoreList.sort((a, b) => a.unit_number - b.unit_number));
      setStreams(streamList);
      if (m.round_id) {
        const rounds = await base44.entities.Round.filter({ id: m.round_id });
        setRound(rounds[0] || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const isOrganizer = user && competition && competition.organizer_id === user.id;

  const handleUpdateStatus = async (status) => {
    setSaving(true);
    try {
      const updates = { status };
      if (status === 'live') updates.started_at = new Date().toISOString();
      if (status === 'completed') updates.ended_at = new Date().toISOString();
      await base44.entities.Match.update(match.id, updates);
      setMatch(m => ({ ...m, ...updates }));
      await base44.entities.AuditLog.create({
        user_id: user.id, action: 'updated_match_score', entity_type: 'Match', entity_id: match.id,
        metadata: JSON.stringify({ status }),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddScore = async () => {
    if (!newUnit.unit_name) return;
    setSaving(true);
    try {
      const scoreA = parseInt(newUnit.team_a_score) || 0;
      const scoreB = parseInt(newUnit.team_b_score) || 0;
      const winnerId = scoreA > scoreB ? match.team_a_id : scoreB > scoreA ? match.team_b_id : null;
      const created = await base44.entities.MatchScore.create({
        match_id: match.id,
        unit_number: scores.length + 1,
        unit_name: newUnit.unit_name,
        team_a_score: scoreA,
        team_b_score: scoreB,
        winner_team_id: winnerId,
      });
      setScores(prev => [...prev, created]);
      setNewUnit({ unit_name: '', team_a_score: '', team_b_score: '' });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteScore = async (scoreId) => {
    await base44.entities.MatchScore.delete(scoreId);
    setScores(prev => prev.filter(s => s.id !== scoreId));
  };

  const handleSetWinner = async (teamId) => {
    setSaving(true);
    try {
      await base44.entities.Match.update(match.id, { winner_team_id: teamId, status: 'completed', ended_at: new Date().toISOString() });
      setMatch(m => ({ ...m, winner_team_id: teamId, status: 'completed' }));
    } finally {
      setSaving(false);
    }
  };

  const teamAWins = scores.filter(s => s.winner_team_id === match?.team_a_id).length;
  const teamBWins = scores.filter(s => s.winner_team_id === match?.team_b_id).length;

  const formatDateTime = (dt) => dt ? new Date(dt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—';

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;
  if (!match) return <div className="text-center py-24"><p className="text-muted-foreground">Match not found.</p></div>;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {competition && (
        <Link to={`/competitions/${competition.id}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
          <ChevronLeft size={15} /> {competition.name}
        </Link>
      )}

      {/* Match Header */}
      <div className="arena-card overflow-hidden">
        <div className="ignition-gradient p-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <StatusBadge status={match.status} />
              {round && <span className="text-white/60 text-xs font-medium">{round.name}</span>}
            </div>
            {match.scheduled_at && (
              <span className="text-white/60 text-xs">{formatDateTime(match.scheduled_at)}</span>
            )}
          </div>
          {/* Scoreboard */}
          <div className="flex items-center justify-between mt-4">
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xl">A</span>
              </div>
              <p className="text-white font-semibold text-sm">Team A</p>
              {match.winner_team_id === match.team_a_id && (
                <span className="text-xs text-emerald-400 font-bold mt-1 block">🏆 Winner</span>
              )}
            </div>
            <div className="text-center px-6">
              <div className="flex items-center gap-3">
                <span className="text-5xl font-bold text-white font-display">{teamAWins}</span>
                <span className="text-2xl text-white/40 font-light">:</span>
                <span className="text-5xl font-bold text-white font-display">{teamBWins}</span>
              </div>
              <p className="text-white/40 text-xs mt-1 uppercase tracking-wide">
                {scores.length > 0 ? `${scores.length} unit${scores.length !== 1 ? 's' : ''} played` : 'No scores yet'}
              </p>
            </div>
            <div className="flex-1 text-center">
              <div className="w-14 h-14 rounded-full bg-white/10 flex items-center justify-center mx-auto mb-2">
                <span className="text-white font-bold text-xl">B</span>
              </div>
              <p className="text-white font-semibold text-sm">Team B</p>
              {match.winner_team_id === match.team_b_id && (
                <span className="text-xs text-emerald-400 font-bold mt-1 block">🏆 Winner</span>
              )}
            </div>
          </div>
        </div>

        {/* Status controls (organizer) */}
        {isOrganizer && match.status !== 'completed' && (
          <div className="p-4 bg-secondary border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Update Match Status</p>
            <div className="flex flex-wrap gap-2">
              {MATCH_STATUSES.filter(s => s !== match.status).map(s => (
                <button
                  key={s}
                  onClick={() => handleUpdateStatus(s)}
                  disabled={saving}
                  className="px-3 py-1.5 text-xs font-medium border border-border rounded-lg capitalize hover:bg-card hover:shadow-sm transition-arena-fast disabled:opacity-40"
                >
                  Set {s.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Score Units */}
      <div className="arena-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h2 className="font-bold">Score Breakdown</h2>
          <p className="text-xs text-muted-foreground mt-0.5">Sets, Maps, Quarters, or Rounds</p>
        </div>

        {scores.length > 0 ? (
          <div className="divide-y divide-border">
            {scores.map(score => (
              <div key={score.id} className="p-4 flex items-center gap-3">
                <div className="flex-1">
                  <p className="font-medium text-sm">{score.unit_name}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xl font-bold font-display ${score.winner_team_id === match.team_a_id ? 'text-live' : 'text-foreground'}`}>
                    {score.team_a_score}
                  </span>
                  <span className="text-muted-foreground text-sm">—</span>
                  <span className={`text-xl font-bold font-display ${score.winner_team_id === match.team_b_id ? 'text-live' : 'text-foreground'}`}>
                    {score.team_b_score}
                  </span>
                </div>
                {score.winner_team_id && (
                  <span className="text-xs text-live bg-live-light px-2 py-0.5 rounded-full">
                    {score.winner_team_id === match.team_a_id ? 'A wins' : 'B wins'}
                  </span>
                )}
                {isOrganizer && (
                  <button onClick={() => handleDeleteScore(score.id)} className="p-1.5 text-muted-foreground hover:text-destructive transition-arena-fast rounded">
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-muted-foreground text-sm">
            No score units recorded yet
          </div>
        )}

        {/* Add score unit (organizer) */}
        {isOrganizer && (
          <div className="p-4 bg-secondary border-t border-border">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Add Score Unit</p>
            <div className="flex items-center gap-2">
              <input
                value={newUnit.unit_name}
                onChange={e => setNewUnit(u => ({ ...u, unit_name: e.target.value }))}
                placeholder="Unit name (e.g. Set 1, Map 2)"
                className="flex-1 px-3 py-2 border border-accessible rounded-lg text-sm focus:outline-none bg-card"
              />
              <input
                type="number"
                value={newUnit.team_a_score}
                onChange={e => setNewUnit(u => ({ ...u, team_a_score: e.target.value }))}
                placeholder="A"
                className="w-16 px-3 py-2 border border-accessible rounded-lg text-sm focus:outline-none bg-card text-center"
              />
              <span className="text-muted-foreground">:</span>
              <input
                type="number"
                value={newUnit.team_b_score}
                onChange={e => setNewUnit(u => ({ ...u, team_b_score: e.target.value }))}
                placeholder="B"
                className="w-16 px-3 py-2 border border-accessible rounded-lg text-sm focus:outline-none bg-card text-center"
              />
              <button
                onClick={handleAddScore}
                disabled={!newUnit.unit_name || saving}
                className="px-3 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-arena-fast disabled:opacity-40"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Declare Winner (organizer) */}
      {isOrganizer && match.status !== 'completed' && scores.length > 0 && !match.winner_team_id && (
        <div className="arena-card p-5">
          <h3 className="font-semibold mb-3">Declare Match Winner</h3>
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => handleSetWinner(match.team_a_id)}
              disabled={saving || !match.team_a_id}
              className="flex items-center justify-center gap-2 py-3 bg-live-light text-live rounded-lg font-semibold text-sm border border-live/20 hover:bg-live-light/80 transition-arena-fast disabled:opacity-40"
            >
              <Trophy size={15} /> Team A Wins
            </button>
            <button
              onClick={() => handleSetWinner(match.team_b_id)}
              disabled={saving || !match.team_b_id}
              className="flex items-center justify-center gap-2 py-3 bg-live-light text-live rounded-lg font-semibold text-sm border border-live/20 hover:bg-live-light/80 transition-arena-fast disabled:opacity-40"
            >
              <Trophy size={15} /> Team B Wins
            </button>
          </div>
        </div>
      )}

      {/* Related Streams */}
      {streams.length > 0 && (
        <div>
          <h2 className="font-bold mb-4">Match Streams</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {streams.map(s => <StreamCard key={s.id} stream={s} />)}
          </div>
        </div>
      )}
    </div>
  );
}
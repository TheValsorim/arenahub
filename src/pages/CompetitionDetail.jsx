import React, { useEffect, useState } from 'react';
import { useParams, Link, useOutletContext } from 'react-router-dom';
import { Calendar, MapPin, Users, Trophy, Radio, MessageSquare, BarChart3, Shield, ChevronLeft, Plus } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StatusBadge from '@/components/ui/StatusBadge';
import StreamCard from '@/components/ui/StreamCard';

const TABS = [
  { id: 'overview', label: 'Overview', icon: Trophy },
  { id: 'participants', label: 'Teams', icon: Users },
  { id: 'matches', label: 'Matches', icon: BarChart3 },
  { id: 'live', label: 'Live', icon: Radio },
  { id: 'streams', label: 'Streams', icon: Radio },
];

export default function CompetitionDetail() {
  const { id } = useParams();
  const { user, profile } = useOutletContext() || {};
  const [competition, setCompetition] = useState(null);
  const [category, setCategory] = useState(null);
  const [discipline, setDiscipline] = useState(null);
  const [matches, setMatches] = useState([]);
  const [rounds, setRounds] = useState([]);
  const [streams, setStreams] = useState([]);
  const [registrations, setRegistrations] = useState([]);
  const [tab, setTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [regStatus, setRegStatus] = useState(null);

  useEffect(() => {
    loadCompetition();
  }, [id]);

  const loadCompetition = async () => {
    setLoading(true);
    try {
      const comps = await base44.entities.Competition.filter({ id });
      if (comps.length === 0) { setLoading(false); return; }
      const comp = comps[0];
      setCompetition(comp);
      const [cats, discs, matchList, roundList, streamList, regList] = await Promise.all([
        base44.entities.Category.filter({ id: comp.category_id }),
        base44.entities.Discipline.filter({ id: comp.discipline_id }),
        base44.entities.Match.filter({ competition_id: id }),
        base44.entities.Round.filter({ competition_id: id }),
        base44.entities.Stream.filter({ competition_id: id }),
        base44.entities.CompetitionRegistration.filter({ competition_id: id }),
      ]);
      setCategory(cats[0] || null);
      setDiscipline(discs[0] || null);
      setMatches(matchList);
      setRounds(roundList);
      setStreams(streamList);
      setRegistrations(regList);
      if (user) {
        const myReg = regList.find(r => r.user_id === user.id);
        setRegStatus(myReg?.status || null);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) { window.location.href = '/login'; return; }
    setRegistering(true);
    try {
      await base44.entities.CompetitionRegistration.create({
        competition_id: id,
        user_id: user.id,
        registration_type: 'solo',
        status: 'pending',
      });
      setRegStatus('pending');
    } finally {
      setRegistering(false);
    }
  };

  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' });
  };

  const formatTime = (dt) => {
    if (!dt) return '';
    return new Date(dt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  if (loading) return (
    <div className="flex items-center justify-center py-32">
      <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
    </div>
  );

  if (!competition) return (
    <div className="text-center py-24">
      <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/40" />
      <p className="font-semibold">Competition not found</p>
      <Link to="/competitions" className="mt-4 inline-block text-sm text-ember">← Back to competitions</Link>
    </div>
  );

  const isOrganizer = user && competition.organizer_id === user.id;
  const canRegister = ['registration_open'].includes(competition.status) && !regStatus && !isOrganizer;
  const approvedCount = registrations.filter(r => r.status === 'approved').length;
  const pendingCount = registrations.filter(r => r.status === 'pending').length;
  const liveStreams = streams.filter(s => s.status === 'live');

  return (
    <div className="w-full max-w-full space-y-4">
      {/* Back */}
      <Link to="/competitions" className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
        <ChevronLeft size={15} /> Competitions
      </Link>

      {/* Hero Banner */}
      <div className="relative rounded-xl overflow-hidden">
        <div className="h-40 sm:h-56 md:h-64">
          {competition.banner_url ? (
            <img src={competition.banner_url} alt={competition.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full ignition-gradient" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
        </div>
        <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6">
          {/* Status + category row */}
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <StatusBadge status={competition.status} />
            {category && <span className="text-xs text-white/70 font-medium">{category.name}</span>}
            {discipline && <span className="text-xs text-white/70">· {discipline.name}</span>}
          </div>
          {/* Title */}
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white font-heading leading-tight mb-3">{competition.name}</h1>
          {/* Register / reg status below title on mobile */}
          {canRegister && (
            <button
              onClick={handleRegister}
              disabled={registering}
              className="inline-flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg font-semibold text-sm hover:bg-ember/90 transition-arena-fast disabled:opacity-60"
            >
              {registering ? 'Registering...' : '+ Register'}
            </button>
          )}
          {regStatus && (
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium ${
              regStatus === 'approved' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
              regStatus === 'pending' ? 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' :
              'bg-red-500/20 text-red-300 border border-red-500/30'
            }`}>
              {regStatus === 'approved' ? '✓ Registered' : regStatus === 'pending' ? '⏳ Pending approval' : 'Registration rejected'}
            </span>
          )}
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Participants', value: `${approvedCount}${competition.max_participants ? ` / ${competition.max_participants}` : ''}`, icon: Users },
          { label: 'Format', value: competition.format?.replace(/_/g, ' ') || '—', icon: BarChart3 },
          { label: 'Starts', value: formatDate(competition.start_date), icon: Calendar },
          { label: 'Location', value: competition.location_type || '—', icon: MapPin },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="arena-card p-4">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Icon size={14} />
              <span className="text-xs font-medium uppercase tracking-wide">{label}</span>
            </div>
            <p className="font-semibold text-sm capitalize">{value}</p>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="arena-card overflow-hidden">
        <div
          className="flex border-b border-border overflow-x-auto overflow-y-hidden"
          style={{ touchAction: 'pan-x', WebkitOverflowScrolling: 'touch' }}
        >
          {TABS.map(t => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 md:px-5 py-3.5 text-sm font-medium whitespace-nowrap transition-arena-fast border-b-2 -mb-px flex-shrink-0 ${
                tab === t.id
                  ? 'border-foreground text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <t.icon size={14} />
              {t.label}
              {t.id === 'live' && liveStreams.length > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-live-light text-live rounded-full font-bold">{liveStreams.length}</span>
              )}
              {t.id === 'participants' && approvedCount > 0 && (
                <span className="ml-1 px-1.5 py-0.5 text-xs bg-secondary text-muted-foreground rounded-full">{approvedCount}</span>
              )}
            </button>
          ))}
        </div>

        <div className="p-5">
          {/* OVERVIEW */}
          {tab === 'overview' && (
            <div className="space-y-5">
              {competition.description && (
                <div>
                  <h3 className="font-semibold mb-2">About</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{competition.description}</p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Details</h3>
                  {[
                    { label: 'Type', value: competition.competition_type },
                    { label: 'Format', value: competition.format?.replace(/_/g, ' ') },
                    { label: 'Location', value: competition.location_type },
                    competition.location_name && { label: 'Venue', value: competition.location_name },
                    { label: 'Team Size', value: competition.team_size ? `${competition.team_size} players` : (discipline?.team_size_default ? `${discipline.team_size_default} players` : '—') },
                    { label: 'Max Participants', value: competition.max_participants || 'Unlimited' },
                    competition.registration_deadline && { label: 'Reg. Deadline', value: formatDate(competition.registration_deadline) },
                    { label: 'Start Date', value: formatDate(competition.start_date) },
                    { label: 'End Date', value: formatDate(competition.end_date) },
                  ].filter(Boolean).map(({ label, value }) => (
                    <div key={label} className="flex justify-between text-sm py-1.5 border-b border-border/50">
                      <span className="text-muted-foreground">{label}</span>
                      <span className="font-medium capitalize">{value}</span>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  <h3 className="font-semibold text-sm">Registration</h3>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Approved</span>
                      <span className="font-bold text-foreground">{approvedCount}</span>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm text-muted-foreground">Pending</span>
                      <span className="font-bold text-muted-foreground">{pendingCount}</span>
                    </div>
                    {competition.max_participants && (
                      <>
                        <div className="h-1.5 bg-border rounded-full mt-3">
                          <div
                            className="h-full bg-ember rounded-full transition-all"
                            style={{ width: `${Math.min(100, (approvedCount / competition.max_participants) * 100)}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">{approvedCount}/{competition.max_participants} spots filled</p>
                      </>
                    )}
                  </div>
                </div>
              </div>
              {competition.rules && (
                <div>
                  <h3 className="font-semibold mb-2">Rules</h3>
                  <div className="p-4 bg-secondary rounded-lg text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {competition.rules}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* PARTICIPANTS */}
          {tab === 'participants' && (
            <div className="space-y-3">
              {registrations.length === 0 ? (
                <div className="text-center py-12">
                  <Users size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No registrations yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {registrations.filter(r => r.status !== 'cancelled').map((reg, i) => (
                    <div key={reg.id} className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-foreground/10 flex items-center justify-center text-sm font-bold">
                          {i + 1}
                        </div>
                        <div>
                          <p className="text-sm font-medium">{reg.team_id ? 'Team Entry' : `Player #${i+1}`}</p>
                          <p className="text-xs text-muted-foreground capitalize">{reg.registration_type}</p>
                        </div>
                      </div>
                      <StatusBadge status={reg.status} />
                    </div>
                  ))}
                </div>
              )}
              {isOrganizer && (
                <div className="pt-3 border-t border-border">
                  <Link to={`/organizer-dashboard`} className="text-sm text-ember hover:underline">
                    Manage registrations →
                  </Link>
                </div>
              )}
            </div>
          )}

          {/* MATCHES */}
          {tab === 'matches' && (
            <div className="space-y-3">
              {matches.length === 0 ? (
                <div className="text-center py-12">
                  <BarChart3 size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No matches scheduled yet</p>
                </div>
              ) : (
                rounds.length > 0 ? rounds.map(round => {
                  const roundMatches = matches.filter(m => m.round_id === round.id);
                  if (roundMatches.length === 0) return null;
                  return (
                    <div key={round.id}>
                      <h4 className="text-xs font-bold uppercase tracking-widest text-muted-foreground mb-2">{round.name}</h4>
                      {roundMatches.map(match => (
                        <Link key={match.id} to={`/match-center/${match.id}`} className="block mb-2 p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-arena-fast group">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3 flex-1">
                              <div className="text-sm font-semibold">{match.team_a_id ? `Team A` : 'TBD'}</div>
                              <div className="px-2 py-0.5 bg-border rounded text-xs font-bold">VS</div>
                              <div className="text-sm font-semibold">{match.team_b_id ? `Team B` : 'TBD'}</div>
                            </div>
                            <div className="flex items-center gap-2">
                              <StatusBadge status={match.status} />
                              {match.scheduled_at && <span className="text-xs text-muted-foreground">{formatTime(match.scheduled_at)}</span>}
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  );
                }) : matches.map(match => (
                  <Link key={match.id} to={`/match-center/${match.id}`} className="block p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-arena-fast">
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Match #{match.id.slice(-4)}</span>
                      <StatusBadge status={match.status} />
                    </div>
                  </Link>
                ))
              )}
            </div>
          )}

          {/* LIVE */}
          {tab === 'live' && (
            <div>
              {liveStreams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {liveStreams.map(s => <StreamCard key={s.id} stream={s} />)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Radio size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No streams live for this competition</p>
                  {competition.allow_player_streams && profile?.is_creator && (
                    <Link to={`/go-live?competition=${id}`} className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg text-sm">
                      <Radio size={14} /> Stream this competition
                    </Link>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STREAMS */}
          {tab === 'streams' && (
            <div>
              {streams.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {streams.map(s => <StreamCard key={s.id} stream={s} />)}
                </div>
              ) : (
                <div className="text-center py-12">
                  <Radio size={32} className="mx-auto mb-3 text-muted-foreground/40" />
                  <p className="text-muted-foreground">No streams linked to this competition</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
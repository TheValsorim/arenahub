import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Radio, Trophy, ChevronRight, Zap, Plus, Users } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StreamCard from '@/components/ui/StreamCard';
import CompetitionCard from '@/components/ui/CompetitionCard';

export default function Home() {
  const { user, profile } = useOutletContext() || {};
  const [liveStreams, setLiveStreams] = useState([]);
  const [upcomingStreams, setUpcomingStreams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.Stream.filter({ status: 'live' }, '-viewer_count', 6),
      base44.entities.Stream.filter({ status: 'scheduled' }, '-created_date', 4),
      base44.entities.Competition.filter({ status: 'registration_open' }, '-created_date', 6),
      base44.entities.Category.list(),
      base44.entities.Discipline.list(),
    ]).then(([live, upcoming, comps, cats, discs]) => {
      setLiveStreams(live);
      setUpcomingStreams(upcoming);
      setCompetitions(comps);
      setCategories(cats);
      setDisciplines(discs);
    }).finally(() => setLoading(false));
  }, []);

  const getCategory = (id) => categories.find(c => c.id === id);
  const getDiscipline = (id) => disciplines.find(d => d.id === id);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-10">
      {/* Welcome Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">
            {user ? `${greeting()}, ${profile?.display_name || user.full_name || 'Competitor'}.` : 'Welcome to ArenaHub'}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">
            {liveStreams.length > 0
              ? `${liveStreams.length} stream${liveStreams.length !== 1 ? 's' : ''} live right now`
              : 'Discover competitions and streams'}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {profile?.is_organizer && (
            <Link
              to="/create-competition"
              className="flex items-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast"
            >
              <Plus size={15} />
              Create Competition
            </Link>
          )}
          {profile?.is_creator && (
            <Link
              to="/go-live"
              className="flex items-center gap-2 px-4 py-2.5 bg-ember text-white rounded-lg text-sm font-semibold hover:bg-ember/90 transition-arena-fast ember-glow"
            >
              <Radio size={15} />
              Go Live
            </Link>
          )}
        </div>
      </div>

      {/* Quick Role Setup Prompt */}
      {user && profile && !profile.is_creator && !profile.is_organizer && (
        <div className="arena-card border-l-4 border-l-ember p-5 flex flex-col sm:flex-row sm:items-center gap-4">
          <div className="flex-1">
            <h3 className="font-semibold text-sm">Unlock more features</h3>
            <p className="text-sm text-muted-foreground mt-0.5">Enable Creator mode to stream, or Organizer mode to run competitions.</p>
          </div>
          <Link
            to="/profile"
            className="flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-arena-fast shrink-0"
          >
            <Zap size={14} />
            Set Up Profile
          </Link>
        </div>
      )}

      {/* Live Streams */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <h2 className="text-lg font-bold font-heading">Live Now</h2>
            {liveStreams.length > 0 && (
              <span className="text-xs font-semibold text-emerald-600 bg-live-light px-2 py-0.5 rounded-full">
                {liveStreams.length}
              </span>
            )}
          </div>
          <Link to="/streams" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
            All streams <ChevronRight size={14} />
          </Link>
        </div>
        {liveStreams.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.map(s => <StreamCard key={s.id} stream={s} />)}
          </div>
        ) : (
          <div className="arena-card p-10 text-center">
            <Radio size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No streams live right now</p>
            {profile?.is_creator ? (
              <Link to="/go-live" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg text-sm font-medium">
                <Radio size={14} /> Be the first to go live
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground/70 mt-1">Check back soon</p>
            )}
          </div>
        )}
      </section>

      {/* Featured Competitions */}
      <section>
        <div className="flex items-center justify-between mb-5">
          <div className="flex items-center gap-2.5">
            <Trophy size={18} className="text-ember" />
            <h2 className="text-lg font-bold font-heading">Open Competitions</h2>
          </div>
          <Link to="/competitions" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
            Browse all <ChevronRight size={14} />
          </Link>
        </div>
        {competitions.length > 0 ? (
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
        ) : (
          <div className="arena-card p-10 text-center">
            <Trophy size={32} className="mx-auto mb-3 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No open competitions yet</p>
            {profile?.is_organizer ? (
              <Link to="/create-competition" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-medium">
                <Plus size={14} /> Create first competition
              </Link>
            ) : (
              <p className="text-sm text-muted-foreground/70 mt-1">Come back soon — competitions are being set up</p>
            )}
          </div>
        )}
      </section>
    </div>
  );
}
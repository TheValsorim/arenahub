import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Zap, Trophy, Radio, ArrowRight, Play, Users, ChevronRight, Shield, Tv2, Swords } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StreamCard from '@/components/ui/StreamCard';
import CompetitionCard from '@/components/ui/CompetitionCard';

export default function Landing() {
  const [liveStreams, setLiveStreams] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  useEffect(() => {
    base44.entities.Stream.filter({ status: 'live' }, '-viewer_count', 6).then(setLiveStreams).catch(() => {});
    base44.entities.Competition.filter({ status: 'registration_open' }, '-created_date', 6).then(setCompetitions).catch(() => {});
    base44.entities.Category.list().then(setCategories).catch(() => {});
    base44.entities.Discipline.list().then(setDisciplines).catch(() => {});
  }, []);

  const getCategory = (id) => categories.find(c => c.id === id);
  const getDiscipline = (id) => disciplines.find(d => d.id === id);

  return (
    <div className="min-h-screen bg-background">
      {/* NAV */}
      <nav className="fixed top-0 left-0 right-0 z-50 h-16 flex items-center justify-between px-6 md:px-12 bg-background/80 backdrop-blur-md border-b border-border">
        <Link to="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-foreground flex items-center justify-center">
            <Zap size={16} className="text-background" />
          </div>
          <span className="font-bold text-lg tracking-tight font-heading">ArenaHub</span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/competitions" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-arena-fast">Competitions</Link>
          <Link to="/streams" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-arena-fast">Streams</Link>
          <Link to="/pricing" className="hidden md:block text-sm text-muted-foreground hover:text-foreground transition-arena-fast">Pricing</Link>
          <Link to="/login" className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-secondary transition-arena-fast hidden md:block">
            Log In
          </Link>
          <Link to="/register" className="px-4 py-2 text-sm bg-ember text-white rounded-lg hover:bg-ember/90 transition-arena-fast hidden md:block">
            Create Account
          </Link>
          <Link to="/get-started" className="px-4 py-2 text-sm bg-foreground text-background rounded-lg hover:bg-foreground/90 transition-arena-fast">
            Get Started
          </Link>
        </div>
      </nav>

      {/* HERO */}
      <section className="pt-24 pb-20 px-6 md:px-12 ignition-gradient relative overflow-hidden">
        <div className="max-w-4xl mx-auto text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/20 text-white/80 text-xs font-medium mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Platform now live — MVP release
          </div>
          <h1 className="text-5xl md:text-7xl font-bold text-white leading-tight tracking-tight font-display mb-6">
            The Digital<br />
            <span className="text-ember">Colosseum</span>
          </h1>
          <p className="text-lg md:text-xl text-white/70 max-w-2xl mx-auto leading-relaxed mb-10">
            Where raw athletic ambition meets architectural precision. Stream, compete, and follow the action — sports and esports, unified.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link
              to="/streams"
              className="flex items-center gap-2 px-6 py-3.5 bg-white text-foreground rounded-xl font-semibold text-sm hover:bg-white/90 transition-arena group"
            >
              <Play size={16} className="text-ember" />
              Watch Live
              <ArrowRight size={14} className="group-hover:translate-x-1 transition-arena-fast" />
            </Link>
            <Link
              to="/get-started"
              className="flex items-center gap-2 px-6 py-3.5 bg-ember text-white rounded-xl font-semibold text-sm hover:bg-ember/90 transition-arena ember-glow"
            >
              <Zap size={16} />
              Start Streaming
            </Link>
            <Link
              to="/get-started"
              className="flex items-center gap-2 px-6 py-3.5 bg-white/10 text-white rounded-xl font-semibold text-sm border border-white/20 hover:bg-white/20 transition-arena"
            >
              <Trophy size={16} />
              Create Competition
            </Link>
          </div>
        </div>
        {/* Floating stats */}
        <div className="max-w-3xl mx-auto mt-16 grid grid-cols-3 gap-4">
          {[
            { label: 'Live Now', value: liveStreams.length || '0', icon: Radio },
            { label: 'Active Competitions', value: competitions.length || '0', icon: Trophy },
            { label: 'No Commission', value: '0%', icon: Shield },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center justify-center text-center p-4 bg-white/10 rounded-xl border border-white/15 backdrop-blur-sm">
              <Icon size={20} className="text-white/60 mb-2" />
              <p className="text-2xl font-bold text-white font-display">{value}</p>
              <p className="text-xs text-white/60 mt-0.5">{label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* LIVE STREAMS */}
      {liveStreams.length > 0 && (
        <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <span className="text-xs font-semibold uppercase tracking-widest text-emerald-600">Live Now</span>
              </div>
              <h2 className="text-2xl font-bold font-heading">Active Streams</h2>
            </div>
            <Link to="/streams" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-arena-fast">
              View all <ChevronRight size={14} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {liveStreams.map(stream => <StreamCard key={stream.id} stream={stream} />)}
          </div>
        </section>
      )}

      {/* FEATURED COMPETITIONS */}
      <section className="py-16 px-6 md:px-12 max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1">Open to Register</p>
            <h2 className="text-2xl font-bold font-heading">Featured Competitions</h2>
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
          <div className="py-16 text-center">
            <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/40" />
            <p className="text-muted-foreground font-medium">No open competitions yet.</p>
            <p className="text-sm text-muted-foreground/70 mt-1">Be the first to create one.</p>
            <Link to="/register" className="mt-4 inline-flex items-center gap-2 px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-arena-fast">
              Create Competition
            </Link>
          </div>
        )}
      </section>

      {/* VALUE CLARITY */}
      <section className="py-16 px-6 md:px-12 bg-foreground text-background">
        <div className="max-w-5xl mx-auto">
          {/* Headline */}
          <div className="text-center mb-10">
            <h2 className="text-2xl md:text-3xl font-bold font-heading mb-3">One platform for sports and esports competitions.</h2>
            <p className="text-background/60 max-w-xl mx-auto text-sm md:text-base leading-relaxed">
              Watch live events, join teams, stream your content, or organize tournaments — all in one place. Supports both sports and esports. Zero commission.
            </p>
          </div>

          {/* Role cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
            {[
              {
                icon: Tv2,
                role: 'Viewer',
                tag: 'Free',
                tagColor: 'bg-emerald-500/20 text-emerald-400',
                desc: 'Discover competitions, watch live streams, follow teams, and join events.',
              },
              {
                icon: Radio,
                role: 'Streamer',
                tag: 'Streamer Plan',
                tagColor: 'bg-ember/20 text-ember',
                desc: 'Create your channel, go live, track usage, and link streams to matches or competitions.',
              },
              {
                icon: Trophy,
                role: 'Organizer',
                tag: 'Organizer Plan',
                tagColor: 'bg-blue-500/20 text-blue-400',
                desc: 'Create tournaments, manage teams, approve registrations, update results, and run official streams.',
              },
            ].map(({ icon: Icon, role, tag, tagColor, desc }) => (
              <div key={role} className="p-5 bg-white/5 rounded-xl border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Icon size={18} className="text-white/70" />
                    <span className="font-bold text-base">{role}</span>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${tagColor}`}>{tag}</span>
                </div>
                <p className="text-background/60 text-sm leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>

          {/* How it works */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-4 sm:gap-8 mb-10">
            {[
              { step: '1', label: 'Choose your role' },
              { step: '2', label: 'Join or create a competition' },
              { step: '3', label: 'Stream, compete, and follow results live' },
            ].map(({ step, label }, i) => (
              <div key={step} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-ember flex items-center justify-center text-white text-xs font-bold shrink-0">{step}</div>
                <span className="text-background/70 text-sm">{label}</span>
                {i < 2 && <ChevronRight size={14} className="text-white/20 hidden sm:block" />}
              </div>
            ))}
          </div>

          {/* CTA */}
          <div className="text-center">
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Link to="/register" className="inline-flex items-center gap-2 px-7 py-3.5 bg-ember text-white rounded-xl font-semibold text-sm hover:bg-ember/90 transition-arena ember-glow">
                Create Free Account <ArrowRight size={15} />
              </Link>
              <Link to="/login" className="inline-flex items-center gap-2 px-7 py-3.5 bg-white/10 text-white rounded-xl font-semibold text-sm border border-white/20 hover:bg-white/20 transition-arena">
                Log In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="py-10 px-6 md:px-12 border-t border-border">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap size={13} className="text-background" />
            </div>
            <span className="font-bold font-heading">ArenaHub</span>
          </div>
          <div className="flex items-center gap-6 text-sm text-muted-foreground">
            <Link to="/competitions" className="hover:text-foreground transition-arena-fast">Competitions</Link>
            <Link to="/streams" className="hover:text-foreground transition-arena-fast">Streams</Link>
            <Link to="/pricing" className="hover:text-foreground transition-arena-fast">Pricing</Link>
          </div>
          <p className="text-xs text-muted-foreground">© 2026 ArenaHub. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
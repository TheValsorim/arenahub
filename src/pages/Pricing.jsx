import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Zap, Trophy, Shield, ArrowRight } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STREAMER_FEATURES = {
  'Free':         ['20 streaming hours/month', '720p max resolution', 'Basic analytics', 'Public channel', '0% commission forever'],
  'Creator':      ['100 streaming hours/month', '1080p max resolution', 'VOD storage', 'Advanced analytics', 'Priority support', '0% commission forever'],
  'Creator Pro':  ['Unlimited streaming hours', '1080p+ max resolution', 'VOD storage', 'Advanced analytics', 'Priority streaming CDN', 'Analytics dashboard', '0% commission forever'],
};

const ORGANIZER_FEATURES = {
  'Free':           ['3 active competitions', 'Basic brackets', 'Public competition pages', 'Manual scoring', '0% commission forever'],
  'Organizer Pro':  ['15 active competitions', 'Advanced brackets (all formats)', 'Analytics dashboard', 'Custom registration forms', 'Multi-stream support', '0% commission forever'],
  'League Pro':     ['Unlimited competitions', 'All bracket types', 'Multi-admin management', 'Custom branding', 'Full analytics suite', 'Priority support', '0% commission forever'],
};

export default function Pricing() {
  const [streamerPlans, setStreamerPlans] = useState([]);
  const [organizerPlans, setOrganizerPlans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      base44.entities.StreamerPlan.list(),
      base44.entities.OrganizerPlan.list(),
    ]).then(([sp, op]) => {
      setStreamerPlans(sp.filter(p => p.is_active));
      setOrganizerPlans(op.filter(p => p.is_active));
    }).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;

  const PlanCard = ({ plan, features, type, popular }) => (
    <div className={`arena-card p-6 flex flex-col relative overflow-hidden transition-arena hover:shadow-lg ${popular ? 'border-2 border-foreground' : ''}`}>
      {popular && (
        <div className="absolute top-0 right-0 bg-foreground text-background text-xs font-bold px-3 py-1 rounded-bl-lg">
          Popular
        </div>
      )}
      <div className="mb-5">
        <p className="font-bold text-lg">{plan.name}</p>
        <div className="mt-2 flex items-baseline gap-1">
          {plan.price_monthly === 0 ? (
            <span className="text-3xl font-bold font-display">Free</span>
          ) : (
            <>
              <span className="text-3xl font-bold font-display">${plan.price_monthly}</span>
              <span className="text-muted-foreground text-sm">/month</span>
            </>
          )}
        </div>
        {plan.price_monthly > 0 && (
          <p className="text-xs text-muted-foreground mt-1">Billed monthly. Cancel anytime.</p>
        )}
      </div>

      <ul className="space-y-2.5 flex-1 mb-6">
        {(features[plan.name] || []).map(f => (
          <li key={f} className="flex items-start gap-2.5 text-sm">
            <Check size={14} className={`shrink-0 mt-0.5 ${f.includes('0% commission') ? 'text-live' : 'text-foreground'}`} />
            <span className={f.includes('0% commission') ? 'font-semibold text-live' : ''}>{f}</span>
          </li>
        ))}
      </ul>

      <Link
        to="/register"
        className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg text-sm font-semibold transition-arena-fast ${
          popular
            ? 'bg-foreground text-background hover:bg-foreground/90'
            : 'bg-secondary text-foreground hover:bg-secondary/80 border border-border'
        }`}
      >
        {plan.price_monthly === 0 ? 'Get Started Free' : 'Upgrade Now'}
        <ArrowRight size={14} />
      </Link>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-16 pb-16">
      {/* Hero */}
      <div className="text-center pt-6">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-live-light text-live text-xs font-bold mb-4 border border-live/20">
          <Shield size={12} /> 0% Commission on Everything
        </div>
        <h1 className="text-4xl font-bold font-heading mb-3">Simple, Honest Pricing</h1>
        <p className="text-muted-foreground text-lg max-w-xl mx-auto leading-relaxed">
          Two independent plans — one for streaming, one for organizing. Pay only for what you use. We take zero commission.
        </p>
      </div>

      {/* Commission Banner */}
      <div className="arena-card p-6 bg-foreground text-background flex flex-col md:flex-row items-center gap-4 text-center md:text-left">
        <div className="flex-1">
          <h2 className="text-xl font-bold mb-1">Zero Commission. Always.</h2>
          <p className="text-background/70 text-sm">
            Prize pools, tournament fees, donations, sponsorships — 100% yours. We charge flat subscription fees, never a cut of your earnings.
          </p>
        </div>
        <div className="flex items-center gap-6 shrink-0">
          <div className="text-center">
            <p className="text-4xl font-bold text-ember font-display">0%</p>
            <p className="text-xs text-background/60 mt-0.5">Commission</p>
          </div>
          <div className="text-center">
            <p className="text-4xl font-bold text-ember font-display">∞</p>
            <p className="text-xs text-background/60 mt-0.5">Prize Pools</p>
          </div>
        </div>
      </div>

      {/* Streamer Plans */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-ember/10 flex items-center justify-center">
            <Zap size={20} className="text-ember" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading">Streamer Plans</h2>
            <p className="text-muted-foreground text-sm">Start free with 20 hours/month. Upgrade when you need more.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {streamerPlans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              features={STREAMER_FEATURES}
              type="streamer"
              popular={plan.name === 'Creator'}
            />
          ))}
        </div>
        <div className="mt-4 p-4 bg-secondary rounded-lg text-sm text-muted-foreground">
          💡 <strong>How it works:</strong> Every account gets 20 free streaming hours per month automatically. No credit card required to start. When you reach your limit, you'll be prompted to upgrade — not cut off mid-stream.
        </div>
      </section>

      {/* Organizer Plans */}
      <section>
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl bg-indigo-arena/10 flex items-center justify-center">
            <Trophy size={20} className="text-indigo-arena" />
          </div>
          <div>
            <h2 className="text-2xl font-bold font-heading">Organizer Plans</h2>
            <p className="text-muted-foreground text-sm">Run competitions at any scale. Free plan for hobbyists, Pro for serious organizers.</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {organizerPlans.map((plan, i) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              features={ORGANIZER_FEATURES}
              type="organizer"
              popular={plan.name === 'Organizer Pro'}
            />
          ))}
        </div>
        <div className="mt-4 p-4 bg-secondary rounded-lg text-sm text-muted-foreground">
          💡 <strong>How it works:</strong> Organizer plans control how many active competitions you can run simultaneously and unlock advanced features like double elimination, Swiss format, multi-admin, and custom branding.
        </div>
      </section>

      {/* FAQ */}
      <section className="max-w-2xl mx-auto">
        <h2 className="text-2xl font-bold font-heading text-center mb-8">Common Questions</h2>
        <div className="space-y-4">
          {[
            { q: 'Can I be both a Streamer and an Organizer?', a: 'Yes! Streamer and Organizer plans are completely independent. You can subscribe to both, one, or neither.' },
            { q: 'Do you take any percentage of my tournament prize pool?', a: 'Absolutely not. We charge flat subscription fees only. Your earnings are entirely yours.' },
            { q: 'What happens when I hit my streaming limit?', a: 'You\'ll receive a notification before reaching the limit. Your current stream won\'t be interrupted, but you\'ll be prompted to upgrade before starting new streams.' },
            { q: 'Can I cancel my plan anytime?', a: 'Yes. Subscriptions are monthly and you can cancel at any time. You keep access until the end of your billing period.' },
          ].map(({ q, a }) => (
            <div key={q} className="arena-card p-5">
              <p className="font-semibold text-sm mb-2">{q}</p>
              <p className="text-sm text-muted-foreground leading-relaxed">{a}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
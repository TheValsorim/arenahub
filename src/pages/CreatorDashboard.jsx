import React, { useEffect, useState } from 'react';
import { Link, useOutletContext } from 'react-router-dom';
import { Radio, Zap, TrendingUp, Clock, Users, ArrowRight, Plus, Eye } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import StreamCard from '@/components/ui/StreamCard';
import StatusBadge from '@/components/ui/StatusBadge';

export default function CreatorDashboard() {
  const { user, profile } = useOutletContext() || {};
  const [channel, setChannel] = useState(null);
  const [streams, setStreams] = useState([]);
  const [usage, setUsage] = useState(null);
  const [plan, setPlan] = useState(null);
  const [subscription, setSubscription] = useState(null);
  const [allPlans, setAllPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creatingChannel, setCreatingChannel] = useState(false);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channels, plansList, subs] = await Promise.all([
        base44.entities.Channel.filter({ owner_id: user.id }),
        base44.entities.StreamerPlan.list(),
        base44.entities.UserSubscription.filter({ user_id: user.id }),
      ]);
      setAllPlans(plansList);
      const sub = subs[0] || null;
      setSubscription(sub);

      if (channels.length > 0) {
        setChannel(channels[0]);
        const [streamList, usageList] = await Promise.all([
          base44.entities.Stream.filter({ channel_id: channels[0].id }, '-created_date', 10),
          base44.entities.StreamUsage.filter({ user_id: user.id, month, year }),
        ]);
        setStreams(streamList);
        setUsage(usageList[0] || null);
      }

      // Determine active plan
      let activePlan = null;
      if (sub?.streamer_plan_id) {
        activePlan = plansList.find(p => p.id === sub.streamer_plan_id);
      }
      if (!activePlan) {
        activePlan = plansList.find(p => p.name === 'Free');
      }
      setPlan(activePlan);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateChannel = async () => {
    setCreatingChannel(true);
    try {
      const newChannel = await base44.entities.Channel.create({
        owner_id: user.id,
        name: `${profile?.display_name || user.full_name || 'Creator'}'s Channel`,
        description: '',
        followers_count: 0,
        total_views: 0,
      });
      setChannel(newChannel);
    } finally {
      setCreatingChannel(false);
    }
  };

  if (!user) return <div className="text-center py-24"><p className="text-muted-foreground">Sign in to access Creator Studio.</p></div>;
  if (!profile?.is_creator) return (
    <div className="text-center py-24 max-w-md mx-auto">
      <Zap size={40} className="mx-auto mb-4 text-muted-foreground/40" />
      <h2 className="font-bold text-lg mb-2">Creator Access Required</h2>
      <p className="text-muted-foreground text-sm mb-4">Enable Creator mode on your profile to access the studio.</p>
      <Link to="/profile" className="px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium">
        Enable Creator Mode
      </Link>
    </div>
  );

  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;

  const hoursUsed = usage?.stream_hours_used || 0;
  const hoursLimit = plan?.monthly_stream_hours_limit;
  const isUnlimited = !hoursLimit;
  const usagePercent = isUnlimited ? 0 : Math.min(100, (hoursUsed / hoursLimit) * 100);
  const isNearLimit = !isUnlimited && usagePercent >= 80;
  const isAtLimit = !isUnlimited && usagePercent >= 100;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Creator Studio</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {channel ? channel.name : 'Set up your channel to start streaming'}
          </p>
        </div>
        {channel && (
          <Link
            to="/go-live"
            className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-semibold transition-arena-fast ${
              isAtLimit
                ? 'bg-secondary text-muted-foreground cursor-not-allowed'
                : 'bg-ember text-white hover:bg-ember/90 ember-glow'
            }`}
          >
            <Radio size={16} />
            {isAtLimit ? 'Upgrade to Go Live' : 'Go Live'}
          </Link>
        )}
      </div>

      {/* No Channel State */}
      {!channel && (
        <div className="arena-card p-10 text-center">
          <div className="w-16 h-16 rounded-2xl bg-ember/10 flex items-center justify-center mx-auto mb-4">
            <Radio size={28} className="text-ember" />
          </div>
          <h2 className="font-bold text-lg mb-2">Create Your Channel</h2>
          <p className="text-muted-foreground text-sm mb-6 max-w-sm mx-auto">
            Your channel is your streaming home. Create it to start going live and building your audience.
          </p>
          <button
            onClick={handleCreateChannel}
            disabled={creatingChannel}
            className="px-6 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast"
          >
            {creatingChannel ? 'Creating...' : 'Create Channel'}
          </button>
        </div>
      )}

      {channel && (
        <>
          {/* Stream Usage / Plan */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Usage Card */}
            <div className="md:col-span-2 arena-card p-5">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Monthly Stream Usage</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{new Date().toLocaleString('default', { month: 'long', year: 'numeric' })}</p>
                </div>
                <StatusBadge status={isAtLimit ? 'inactive' : 'active'} />
              </div>
              <div className="mb-2">
                <span className="text-4xl font-bold font-display tracking-tight">{hoursUsed.toFixed(1)}</span>
                <span className="text-lg text-muted-foreground ml-1">
                  / {isUnlimited ? '∞' : hoursLimit}h
                </span>
              </div>
              {!isUnlimited && (
                <div className="mt-3">
                  <div className="h-2 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isAtLimit ? 'bg-destructive' : isNearLimit ? 'bg-ember' : 'bg-live'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1.5">
                    {isUnlimited ? 'Unlimited streaming' : `${(hoursLimit - hoursUsed).toFixed(1)} hours remaining this month`}
                  </p>
                </div>
              )}
              {isAtLimit && (
                <div className="mt-4 p-3 bg-ember-light rounded-lg border border-ember/20">
                  <p className="text-sm font-semibold text-ember">Monthly limit reached</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Upgrade your plan to continue streaming this month.</p>
                  <Link to="/pricing" className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-ember hover:underline">
                    View plans <ArrowRight size={11} />
                  </Link>
                </div>
              )}
              {isNearLimit && !isAtLimit && (
                <div className="mt-3 p-3 bg-ember-light rounded-lg border border-ember/20">
                  <p className="text-sm font-semibold text-ember">Approaching limit</p>
                  <p className="text-xs text-muted-foreground mt-0.5">You've used {usagePercent.toFixed(0)}% of your monthly hours.</p>
                </div>
              )}
            </div>

            {/* Current Plan */}
            <div className="arena-card p-5">
              <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">Current Plan</p>
              <div className="mb-3">
                <p className="text-xl font-bold">{plan?.name || 'Free'}</p>
                <p className="text-sm text-muted-foreground mt-0.5">
                  {plan?.price_monthly === 0 ? 'Free forever' : `$${plan?.price_monthly}/mo`}
                </p>
              </div>
              <div className="space-y-1.5 text-xs text-muted-foreground">
                <div className="flex justify-between">
                  <span>Hours/month</span>
                  <span className="font-medium text-foreground">{plan?.monthly_stream_hours_limit || '∞'}</span>
                </div>
                <div className="flex justify-between">
                  <span>Resolution</span>
                  <span className="font-medium text-foreground">{plan?.max_resolution || '720p'}</span>
                </div>
                <div className="flex justify-between">
                  <span>VOD</span>
                  <span className={`font-medium ${plan?.vod_enabled ? 'text-live' : 'text-muted-foreground'}`}>
                    {plan?.vod_enabled ? 'Yes' : 'No'}
                  </span>
                </div>
              </div>
              {plan?.name === 'Free' && (
                <Link
                  to="/pricing"
                  className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-xs font-semibold hover:bg-foreground/90 transition-arena-fast"
                >
                  <Zap size={12} /> Upgrade Plan
                </Link>
              )}
            </div>
          </div>

          {/* Channel Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: 'Followers', value: channel.followers_count || 0, icon: Users },
              { label: 'Total Views', value: channel.total_views || 0, icon: Eye },
              { label: 'Total Streams', value: streams.length, icon: Radio },
              { label: 'Live Now', value: streams.filter(s => s.status === 'live').length, icon: TrendingUp },
            ].map(({ label, value, icon: Icon }) => (
              <div key={label} className="arena-card p-4">
                <div className="flex items-center gap-2 text-muted-foreground mb-1">
                  <Icon size={14} />
                  <span className="text-xs font-medium">{label}</span>
                </div>
                <p className="text-xl font-bold font-display">{value.toLocaleString()}</p>
              </div>
            ))}
          </div>

          {/* Recent Streams */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-lg font-heading">Recent Streams</h2>
              {!isAtLimit && (
                <Link to="/go-live" className="flex items-center gap-1.5 px-3 py-2 bg-ember text-white rounded-lg text-xs font-semibold hover:bg-ember/90 transition-arena-fast">
                  <Plus size={12} /> New Stream
                </Link>
              )}
            </div>
            {streams.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {streams.map(s => <StreamCard key={s.id} stream={s} />)}
              </div>
            ) : (
              <div className="arena-card p-10 text-center">
                <Radio size={28} className="mx-auto mb-3 text-muted-foreground/40" />
                <p className="text-muted-foreground font-medium">No streams yet</p>
                <Link to="/go-live" className="mt-3 inline-flex items-center gap-2 px-4 py-2 bg-ember text-white rounded-lg text-sm">
                  <Radio size={14} /> Go live now
                </Link>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
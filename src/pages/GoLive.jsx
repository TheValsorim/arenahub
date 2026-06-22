import React, { useEffect, useRef, useState } from 'react';
import { useOutletContext, Link } from 'react-router-dom';
import { Radio, Copy, Check, Eye, EyeOff, AlertTriangle, Zap, ArrowRight, Smartphone, Monitor, Video, VideoOff, Mic, MicOff, RefreshCw } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import PhoneBroadcaster from '@/components/streaming/PhoneBroadcaster';

const generateStreamKey = () => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  return 'sk_' + Array.from({ length: 24 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

const generateShareId = () => {
  const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
  return Array.from({ length: 10 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
};

export default function GoLive() {
  const { user, profile } = useOutletContext() || {};
  const [channel, setChannel] = useState(null);
  const [plan, setPlan] = useState(null);
  const [usage, setUsage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [competitions, setCompetitions] = useState([]);
  const [loading, setLoading] = useState(true);

  // RTMP state
  const [streamCreated, setStreamCreated] = useState(null);
  const [keyVisible, setKeyVisible] = useState(false);
  const [copiedKey, setCopiedKey] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [creating, setCreating] = useState(false);

  // Stream method: 'rtmp' | 'phone'
  const [streamMethod, setStreamMethod] = useState(null);

  // Phone stream state
  const [phoneForm, setPhoneForm] = useState({ title: '', category_id: '', discipline_id: '', competition_id: '', micEnabled: true });
  const [phoneStream, setPhoneStream] = useState(null); // Stream entity record
  const [cameraError, setCameraError] = useState('');
  const [cameraWarning, setCameraWarning] = useState('');
  const [cameraLoading, setCameraLoading] = useState(false);
  const [facingMode, setFacingMode] = useState('environment'); // 'environment' = rear, 'user' = front
  const localStreamRef = useRef(null);
  const previewVideoRef = useRef(null);

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const [form, setForm] = useState({
    title: '', description: '', category_id: '', discipline_id: '', competition_id: '', match_id: '',
  });

  useEffect(() => {
    if (user) loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [channels, plansList, subs, usageList, cats, discs] = await Promise.all([
        base44.entities.Channel.filter({ owner_id: user.id }),
        base44.entities.StreamerPlan.list(),
        base44.entities.UserSubscription.filter({ user_id: user.id }),
        base44.entities.StreamUsage.filter({ user_id: user.id, month, year }),
        base44.entities.Category.list(),
        base44.entities.Discipline.list(),
      ]);
      setCategories(cats);
      setDisciplines(discs);

      if (channels.length > 0) {
        setChannel(channels[0]);
        const comps = await base44.entities.Competition.filter({ organizer_id: user.id, status: 'live' });
        setCompetitions(comps);
      }

      const sub = subs[0] || null;
      let activePlan = null;
      if (sub?.streamer_plan_id) activePlan = plansList.find(p => p.id === sub.streamer_plan_id);
      if (!activePlan) activePlan = plansList.find(p => p.name === 'Free');
      setPlan(activePlan);
      setUsage(usageList[0] || null);
    } finally {
      setLoading(false);
    }
  };

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));
  const setPhone = (key, value) => setPhoneForm(f => ({ ...f, [key]: value }));

  const hoursUsed = usage?.stream_hours_used || 0;
  const hoursLimit = plan?.monthly_stream_hours_limit;
  const isUnlimited = !hoursLimit;
  const isAtLimit = !isUnlimited && hoursUsed >= hoursLimit;

  // RTMP go live
  const handleGoLive = async () => {
    if (!form.title.trim()) return;
    setCreating(true);
    try {
      const key = generateStreamKey();
      const rtmpUrl = `rtmp://ingest.arenahub.live/live`;
      const playbackUrl = `https://play.arenahub.live/watch/${key}`;
      const stream = await base44.entities.Stream.create({
        channel_id: channel.id,
        competition_id: form.competition_id || null,
        title: form.title,
        description: form.description,
        category_id: form.category_id || null,
        discipline_id: form.discipline_id || null,
        stream_key: key,
        rtmp_url: rtmpUrl,
        playback_url: playbackUrl,
        status: 'live',
        stream_mode: 'rtmp',
        device_type: 'desktop',
        viewer_count: 0,
        started_at: new Date().toISOString(),
      });
      await base44.entities.AuditLog.create({
        user_id: user.id,
        action: 'generated_stream_key',
        entity_type: 'Stream',
        entity_id: stream.id,
        metadata: JSON.stringify({ title: form.title }),
      });
      if (usage) {
        await base44.entities.StreamUsage.update(usage.id, { last_updated_at: new Date().toISOString() });
      } else {
        await base44.entities.StreamUsage.create({
          user_id: user.id, month, year, stream_hours_used: 0, viewer_hours_used: 0, last_updated_at: new Date().toISOString(),
        });
      }
      setStreamCreated(stream);
    } finally {
      setCreating(false);
    }
  };

  const copy = (text, type) => {
    navigator.clipboard.writeText(text);
    if (type === 'key') { setCopiedKey(true); setTimeout(() => setCopiedKey(false), 2000); }
    else { setCopiedUrl(true); setTimeout(() => setCopiedUrl(false), 2000); }
  };

  const endStream = async () => {
    if (!streamCreated) return;
    await base44.entities.Stream.update(streamCreated.id, { status: 'ended', ended_at: new Date().toISOString() });
    await base44.entities.AuditLog.create({ user_id: user.id, action: 'started_stream', entity_type: 'Stream', entity_id: streamCreated.id, metadata: '{}' });
    setStreamCreated(null);
  };

  // Phone: request camera — defaults to rear (environment)
  const getCameraStream = async (facing) => {
    if (!navigator.mediaDevices?.getUserMedia) {
      throw Object.assign(new Error('Browser not supported'), { name: 'NotSupportedError' });
    }
    try {
      return await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 720 },
          height: { ideal: 1280 },
          aspectRatio: { ideal: 9 / 16 },
          frameRate: { ideal: 30, max: 30 },
        },
        audio: phoneForm.micEnabled,
      });
    } catch (err) {
      // If rear not available, fall back to any camera
      if (facing === 'environment' && (err.name === 'NotFoundError' || err.name === 'OverconstrainedError')) {
        const fallback = await navigator.mediaDevices.getUserMedia({ video: true, audio: phoneForm.micEnabled });
        setCameraWarning('Rear camera not available. Using available camera.');
        return fallback;
      }
      throw err;
    }
  };

  const startCameraPreview = async () => {
    setCameraError('');
    setCameraWarning('');
    setCameraLoading(true);
    try {
      const stream = await getCameraStream('environment');
      setFacingMode('environment');
      localStreamRef.current = stream;
      if (previewVideoRef.current) {
        previewVideoRef.current.srcObject = stream;
        previewVideoRef.current.muted = true;
        previewVideoRef.current.playsInline = true;
        previewVideoRef.current.play().catch(() => {});
      }
    } catch (err) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setCameraError('Camera permission is required to start phone streaming. Please allow camera access in your browser settings.');
      } else if (err.name === 'NotFoundError') {
        setCameraError('No camera found on this device.');
      } else if (err.name === 'NotSupportedError') {
        setCameraError('Your browser does not support camera streaming. Try Chrome or Safari on mobile.');
      } else {
        setCameraError('Could not access camera: ' + (err.message || 'Unknown error'));
      }
    } finally {
      setCameraLoading(false);
    }
  };

  const switchCamera = async () => {
    const newFacing = facingMode === 'environment' ? 'user' : 'environment';
    setCameraWarning('');
    try {
      const newStream = await getCameraStream(newFacing);
      // Stop old video tracks only
      if (localStreamRef.current) {
        localStreamRef.current.getVideoTracks().forEach(t => t.stop());
      }
      // Replace video track in existing stream (keep audio tracks)
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (localStreamRef.current && newVideoTrack) {
        // Swap video track in the existing MediaStream
        const oldVideoTracks = localStreamRef.current.getVideoTracks();
        oldVideoTracks.forEach(t => localStreamRef.current.removeTrack(t));
        localStreamRef.current.addTrack(newVideoTrack);
        // Stop extra audio tracks from the new stream (we keep the original audio)
        newStream.getAudioTracks().forEach(t => t.stop());
      } else {
        localStreamRef.current = newStream;
      }
      if (previewVideoRef.current) previewVideoRef.current.srcObject = localStreamRef.current;
      setFacingMode(newFacing);
    } catch (err) {
      setCameraWarning('Could not switch camera: ' + (err.message || 'Unknown error'));
    }
  };

  const stopCameraPreview = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(t => t.stop());
      localStreamRef.current = null;
    }
    if (previewVideoRef.current) previewVideoRef.current.srcObject = null;
    setCameraWarning('');
  };

  const handleStartPhoneStream = async () => {
    if (!phoneForm.title.trim() || !localStreamRef.current) return;
    setCreating(true);
    try {
      const shareId = generateShareId();
      const watchUrl = `/watch/${shareId}`;
      const roomName = 'arenahub_stream_' + shareId;
      const stream = await base44.entities.Stream.create({
        channel_id: channel.id,
        title: phoneForm.title,
        category_id: phoneForm.category_id || null,
        discipline_id: phoneForm.discipline_id || null,
        competition_id: phoneForm.competition_id || null,
        stream_provider: 'livekit',
        stream_mode: 'livekit_phone',
        livekit_enabled: true,
        livekit_room_name: roomName,
        device_type: 'mobile',
        status: 'live',
        stream_health: 'live',
        is_public: true,
        public_share_id: shareId,
        public_watch_url: watchUrl,
        camera_enabled: true,
        microphone_enabled: phoneForm.micEnabled,
        viewer_count: 0,
        started_at: new Date().toISOString(),
        last_heartbeat_at: new Date().toISOString(),
      });
      // Release the preview camera so LiveKit can acquire it cleanly
      stopCameraPreview();
      setPhoneStream(stream);
    } finally {
      setCreating(false);
    }
  };

  const handleEndPhoneStream = async () => {
    if (!phoneStream) return;
    await base44.entities.Stream.update(phoneStream.id, {
      status: 'ended',
      stream_health: 'ended',
      ended_at: new Date().toISOString(),
      ended_reason: 'ended_by_user',
    }).catch(() => {});
    stopCameraPreview();
    setPhoneStream(null);
    setStreamMethod(null);
    setPhoneForm({ title: '', category_id: '', discipline_id: '', competition_id: '', micEnabled: true });
  };

  if (!user) return <div className="text-center py-24"><p>Sign in to go live.</p></div>;
  if (!profile?.is_creator) return (
    <div className="text-center py-24 max-w-md mx-auto">
      <Radio size={40} className="mx-auto mb-4 text-muted-foreground/40" />
      <h2 className="font-bold text-lg mb-2">Creator Mode Required</h2>
      <p className="text-muted-foreground text-sm mb-4">Enable Creator mode to stream.</p>
      <Link to="/profile" className="px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-medium">Enable Now</Link>
    </div>
  );
  if (loading) return <div className="flex justify-center py-32"><div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" /></div>;

  const filteredDisciplines = form.category_id ? disciplines.filter(d => d.category_id === form.category_id) : disciplines;
  const phoneFilteredDisciplines = phoneForm.category_id ? disciplines.filter(d => d.category_id === phoneForm.category_id) : disciplines;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Go Live</h1>
        <p className="text-muted-foreground text-sm mt-1">Configure and start your stream session</p>
      </div>

      {/* Usage indicator */}
      {plan && (
        <div className={`arena-card p-4 flex items-center justify-between ${isAtLimit ? 'border-l-4 border-l-destructive' : isUnlimited ? '' : 'border-l-4 border-l-live'}`}>
          <div>
            <p className="text-sm font-semibold">{plan.name} Plan</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isUnlimited ? 'Unlimited streaming hours' : `${hoursUsed.toFixed(1)} / ${hoursLimit}h used this month`}
            </p>
          </div>
          {isAtLimit ? (
            <Link to="/pricing" className="flex items-center gap-1.5 px-3 py-2 bg-ember text-white rounded-lg text-xs font-semibold">
              <Zap size={12} /> Upgrade
            </Link>
          ) : !isUnlimited && (
            <div className="text-right">
              <p className="text-lg font-bold font-display">{((hoursLimit - hoursUsed).toFixed(1))}</p>
              <p className="text-xs text-muted-foreground">hours left</p>
            </div>
          )}
        </div>
      )}

      {isAtLimit && (
        <div className="arena-card p-5 border border-destructive/30 bg-destructive/5">
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-destructive shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">Monthly streaming limit reached</p>
              <p className="text-sm text-muted-foreground mt-1">You've used all {hoursLimit} hours on your {plan?.name} plan.</p>
              <Link to="/pricing" className="mt-3 inline-flex items-center gap-1.5 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast">
                View Plans <ArrowRight size={13} />
              </Link>
            </div>
          </div>
        </div>
      )}

      {!channel && (
        <div className="arena-card p-6 text-center">
          <p className="text-muted-foreground mb-3">You need a channel before going live.</p>
          <Link to="/creator-dashboard" className="px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-semibold">
            Set Up Channel
          </Link>
        </div>
      )}

      {channel && !isAtLimit && !streamCreated && !phoneStream && (
        <>
          {/* Stream method selector */}
          {!streamMethod && (
            <div className="arena-card p-6 space-y-4">
              <div>
                <h2 className="font-semibold text-base mb-1">How do you want to stream?</h2>
                <p className="text-sm text-muted-foreground">Choose your streaming method</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  onClick={() => setStreamMethod('rtmp')}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl border-2 border-border hover:border-foreground/40 transition-arena-fast text-left"
                >
                  <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                    <Monitor size={20} className="text-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Stream with OBS / RTMP</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Professional quality, requires OBS or streaming software</p>
                  </div>
                </button>
                <button
                  onClick={() => setStreamMethod('phone')}
                  className="flex flex-col items-start gap-3 p-4 rounded-xl border-2 border-ember/40 hover:border-ember transition-arena-fast text-left bg-ember-light/30 dark:bg-ember-light/10 relative"
                >
                  <div className="absolute top-3 right-3">
                    <span className="text-xs font-bold px-2 py-0.5 bg-ember text-white rounded-full">Beta</span>
                  </div>
                  <div className="w-10 h-10 rounded-lg bg-ember/10 flex items-center justify-center">
                    <Smartphone size={20} className="text-ember" />
                  </div>
                  <div>
                    <p className="font-semibold text-sm">Stream from phone</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Use your phone camera, share a public link instantly</p>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* RTMP form */}
          {streamMethod === 'rtmp' && (
            <div className="arena-card p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold">Stream with OBS / RTMP</h2>
                <button onClick={() => setStreamMethod(null)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Stream Title *</label>
                <input
                  value={form.title}
                  onChange={e => set('title', e.target.value)}
                  placeholder="What are you streaming today?"
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Description</label>
                <textarea
                  value={form.description}
                  onChange={e => set('description', e.target.value)}
                  placeholder="Tell viewers what to expect..."
                  rows={2}
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-background resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={form.category_id} onChange={e => { set('category_id', e.target.value); set('discipline_id', ''); }}
                    className="w-full px-3 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Discipline</label>
                  <select value={form.discipline_id} onChange={e => set('discipline_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background">
                    <option value="">Select discipline</option>
                    {filteredDisciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {competitions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Link to Competition (optional)</label>
                  <select value={form.competition_id} onChange={e => set('competition_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background">
                    <option value="">No competition</option>
                    {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}
              <button
                onClick={handleGoLive}
                disabled={!form.title.trim() || creating}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-ember text-white rounded-lg font-bold text-sm hover:bg-ember/90 transition-arena disabled:opacity-50 ember-glow"
              >
                <Radio size={18} />
                {creating ? 'Generating credentials...' : 'Generate Stream Credentials'}
              </button>
            </div>
          )}

          {/* Phone beta form */}
          {streamMethod === 'phone' && !localStreamRef.current && (
            <div className="arena-card p-6 space-y-4">
              <div className="flex items-center justify-between mb-1">
                <div>
                  <h2 className="font-semibold flex items-center gap-2">
                    Stream from phone
                    <span className="text-xs font-bold px-2 py-0.5 bg-ember text-white rounded-full">Beta</span>
                  </h2>
                </div>
                <button onClick={() => setStreamMethod(null)} className="text-xs text-muted-foreground hover:text-foreground">← Back</button>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1.5">Stream Title *</label>
                <input
                  value={phoneForm.title}
                  onChange={e => setPhone('title', e.target.value)}
                  placeholder="What are you streaming today?"
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-background"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1.5">Category</label>
                  <select value={phoneForm.category_id} onChange={e => { setPhone('category_id', e.target.value); setPhone('discipline_id', ''); }}
                    className="w-full px-3 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background">
                    <option value="">Select category</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1.5">Discipline</label>
                  <select value={phoneForm.discipline_id} onChange={e => setPhone('discipline_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background">
                    <option value="">Select discipline</option>
                    {phoneFilteredDisciplines.map(d => <option key={d.id} value={d.id}>{d.name}</option>)}
                  </select>
                </div>
              </div>
              {competitions.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Link to Competition (optional)</label>
                  <select value={phoneForm.competition_id} onChange={e => setPhone('competition_id', e.target.value)}
                    className="w-full px-3 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background">
                    <option value="">No competition</option>
                    {competitions.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              )}

              {/* Mic toggle */}
              <div className="flex items-center justify-between p-3 bg-secondary rounded-lg">
                <div className="flex items-center gap-2">
                  {phoneForm.micEnabled ? <Mic size={16} /> : <MicOff size={16} className="text-muted-foreground" />}
                  <span className="text-sm font-medium">Microphone</span>
                </div>
                <button
                  onClick={() => setPhone('micEnabled', !phoneForm.micEnabled)}
                  className={`w-11 h-6 rounded-full transition-arena-fast relative ${phoneForm.micEnabled ? 'bg-foreground' : 'bg-border'}`}
                >
                  <span className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-arena-fast ${phoneForm.micEnabled ? 'left-6' : 'left-1'}`} />
                </button>
              </div>

              {cameraError && (
                <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-sm text-destructive">
                  {cameraError}
                </div>
              )}
              {cameraWarning && (
                <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle size={13} className="text-yellow-500 shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{cameraWarning}</p>
                </div>
              )}

              <button
                onClick={startCameraPreview}
                disabled={!phoneForm.title.trim() || cameraLoading}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-ember text-white rounded-lg font-bold text-sm hover:bg-ember/90 transition-arena disabled:opacity-50 ember-glow"
              >
                <Video size={18} />
                {cameraLoading ? 'Requesting camera...' : 'Allow Camera & Preview'}
              </button>
            </div>
          )}

          {/* Phone camera preview + start */}
          {streamMethod === 'phone' && localStreamRef.current && !phoneStream && (
            <div className="arena-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">Camera Preview</h2>
                <button onClick={() => { stopCameraPreview(); setCameraError(''); }} className="text-xs text-muted-foreground hover:text-foreground">Cancel</button>
              </div>
              <div className="relative rounded-xl overflow-hidden bg-black aspect-[9/16] max-w-sm mx-auto w-full">
                <video ref={previewVideoRef} autoPlay muted playsInline className="w-full h-full object-cover" />
                {/* Camera label + switch */}
                <div className="absolute bottom-3 left-0 right-0 flex justify-center">
                  <button
                    onClick={switchCamera}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-black/60 text-white text-xs font-medium rounded-full hover:bg-black/80 transition-arena-fast"
                  >
                    <RefreshCw size={12} />
                    {facingMode === 'environment' ? 'Back camera' : 'Front camera'} — Switch
                  </button>
                </div>
              </div>
              {cameraWarning && (
                <div className="flex items-center gap-2 p-2.5 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
                  <AlertTriangle size={13} className="text-yellow-500 shrink-0" />
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">{cameraWarning}</p>
                </div>
              )}
              <p className="text-xs text-muted-foreground">Camera is live — this preview is only visible to you. Viewers will only see the stream after you start.</p>
              <button
                onClick={handleStartPhoneStream}
                disabled={creating}
                className="w-full flex items-center justify-center gap-2 py-3.5 bg-ember text-white rounded-lg font-bold text-sm hover:bg-ember/90 transition-arena disabled:opacity-50 ember-glow"
              >
                <Radio size={18} />
                {creating ? 'Starting stream...' : 'Start Phone Stream'}
              </button>
            </div>
          )}
        </>
      )}

      {/* RTMP credentials card */}
      {streamCreated && (
        <div className="space-y-4">
          <div className="arena-card p-5 border-2 border-live">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="font-bold text-live">Stream Session Active</span>
            </div>
            <h3 className="font-semibold text-foreground mb-4">"{streamCreated.title}"</h3>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">RTMP Server URL</p>
                <div className="flex items-center gap-2 p-3 bg-foreground text-background rounded-lg font-mono text-sm">
                  <span className="flex-1 truncate">{streamCreated.rtmp_url}</span>
                  <button onClick={() => copy(streamCreated.rtmp_url, 'url')} className="shrink-0 p-1 hover:opacity-70 transition-arena-fast">
                    {copiedUrl ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Stream Key</p>
                <div className="flex items-center gap-2 p-3 bg-foreground text-background rounded-lg font-mono text-sm">
                  <span className="flex-1 font-mono">
                    {keyVisible ? streamCreated.stream_key : '•'.repeat(20)}
                  </span>
                  <button onClick={() => setKeyVisible(!keyVisible)} className="shrink-0 p-1 hover:opacity-70 transition-arena-fast">
                    {keyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                  </button>
                  <button onClick={() => copy(streamCreated.stream_key, 'key')} className="shrink-0 p-1 hover:opacity-70 transition-arena-fast">
                    {copiedKey ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                  </button>
                </div>
                <p className="text-xs text-muted-foreground mt-1.5">⚠️ Keep your stream key private. Never share it publicly.</p>
              </div>
              <div className="p-4 bg-secondary rounded-lg">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">Playback URL</p>
                <p className="text-sm font-mono break-all text-muted-foreground">{streamCreated.playback_url}</p>
              </div>
            </div>
            <div className="mt-5 p-4 bg-secondary rounded-lg text-xs text-muted-foreground space-y-1">
              <p className="font-semibold text-foreground text-sm mb-2">How to start streaming:</p>
              <p>1. Open OBS Studio or your preferred streaming software</p>
              <p>2. Go to Settings → Stream → Custom</p>
              <p>3. Paste the RTMP Server URL above</p>
              <p>4. Paste your Stream Key above</p>
              <p>5. Click "Start Streaming" in your software</p>
            </div>
          </div>
          <button
            onClick={endStream}
            className="w-full py-3 border border-border rounded-lg text-sm font-medium text-muted-foreground hover:bg-secondary hover:text-foreground transition-arena-fast"
          >
            End Stream Session
          </button>
        </div>
      )}

      {/* Phone broadcaster active */}
      {phoneStream && (
        <PhoneBroadcaster stream={phoneStream} onEndStream={handleEndPhoneStream} initialMicEnabled={phoneStream.microphone_enabled} />
      )}
    </div>
  );
}
import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Zap, Radio, Wifi, WifiOff, Play } from 'lucide-react';
import { Room, RoomEvent, Track } from 'livekit-client';
import { base44 } from '@/api/base44Client';
import { getLiveKitConnection } from '@/lib/livekit';

const STALE_THRESHOLD_MS = 60000; // 60s without heartbeat = stale

export default function Watch() {
  const { public_share_id } = useParams();
  const videoRef = useRef(null);
  const roomRef = useRef(null);

  const [stream, setStream] = useState(null);
  const [loading, setLoading] = useState(true);
  const [phase, setPhase] = useState('loading'); // loading|connecting|waiting|receiving|live|tap|error|ended
  const [notFound, setNotFound] = useState(false);
  const [playError, setPlayError] = useState('');

  const tryPlay = useCallback(() => {
    const v = videoRef.current;
    if (!v || !v.srcObject) return;
    v.play().then(() => { setPhase('live'); setPlayError(''); }).catch(() => setPhase('tap'));
  }, []);

  const handleTapToPlay = () => {
    const v = videoRef.current;
    roomRef.current?.startAudio().catch(() => {});
    if (!v || !v.srcObject) { setPlayError('Video is not ready yet. Waiting for stream…'); return; }
    v.play().then(() => { setPhase('live'); setPlayError(''); }).catch(() => setPlayError('Video is not ready yet. Waiting for stream…'));
  };

  // Load stream + stale heartbeat check
  useEffect(() => {
    const load = async () => {
      const results = await base44.entities.Stream.filter({ public_share_id }).catch(() => []);
      if (!results.length) { setNotFound(true); setLoading(false); return; }
      const s = results[0];

      if (s.status === 'live' && s.last_heartbeat_at) {
        const age = Date.now() - new Date(s.last_heartbeat_at).getTime();
        if (age > STALE_THRESHOLD_MS) {
          await base44.entities.Stream.update(s.id, {
            status: 'ended',
            stream_health: 'ended',
            ended_at: new Date().toISOString(),
            ended_reason: 'broadcaster_disconnected',
          }).catch(() => {});
          s.status = 'ended';
        }
      }

      setStream(s);
      setLoading(false);
      setPhase(s.status === 'ended' ? 'ended' : 'connecting');
    };
    load();
  }, [public_share_id]);

  // Connect to LiveKit as a subscriber-only viewer
  useEffect(() => {
    if (!stream || stream.status === 'ended' || stream.stream_provider !== 'livekit') return;
    let cancelled = false;

    const room = new Room({ adaptiveStream: true });
    roomRef.current = room;

    const attach = (track) => {
      const v = videoRef.current;
      if (!v) return;
      track.attach(v);
      v.autoplay = true;
      v.playsInline = true;
      v.controls = true;
      setPhase('receiving');
      tryPlay();
    };

    room.on(RoomEvent.TrackSubscribed, (track) => {
      if (track.kind === Track.Kind.Video || track.kind === Track.Kind.Audio) attach(track);
    });
    room.on(RoomEvent.TrackUnsubscribed, (track) => { try { track.detach(); } catch { /* noop */ } });
    room.on(RoomEvent.Disconnected, () => { if (!cancelled) setPhase('error'); });

    const connect = async () => {
      try {
        setPhase('connecting');
        const { serverUrl, token } = await getLiveKitConnection({
          roomName: stream.livekit_room_name,
          participantName: 'viewer_' + Math.random().toString(36).slice(2, 10),
        });
        if (cancelled) return;
        await room.connect(serverUrl, token);
        if (cancelled) { room.disconnect(); return; }
        if (room.remoteParticipants.size === 0) setPhase('waiting');
      } catch (err) {
        console.error('[viewer] LiveKit connect failed', err);
        if (!cancelled) setPhase('error');
      }
    };
    connect();

    return () => {
      cancelled = true;
      try { room.disconnect(); } catch { /* noop */ }
    };
  }, [stream, tryPlay]);

  const phaseConfig = {
    loading: { label: 'Loading stream…', color: 'text-muted-foreground' },
    connecting: { label: 'Connecting to LiveKit…', color: 'text-yellow-400' },
    waiting: { label: 'Waiting for broadcaster…', color: 'text-yellow-400' },
    receiving: { label: 'Receiving video…', color: 'text-yellow-400' },
    live: { label: 'Live', color: 'text-emerald-400' },
    tap: { label: 'Tap to play', color: 'text-white' },
    ended: { label: 'Stream ended', color: 'text-white/50' },
    error: { label: 'Connection lost', color: 'text-red-400' },
  };
  const current = phaseConfig[phase] || phaseConfig.loading;

  // LiveKit phone streams are now published as fixed landscape 16:9 canvas tracks
  const isPortrait = false;

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center px-6">
        <div className="w-10 h-10 rounded-xl bg-foreground flex items-center justify-center mb-6">
          <Zap size={18} className="text-background" />
        </div>
        <h1 className="text-2xl font-bold font-heading mb-2">Stream not found</h1>
        <p className="text-muted-foreground text-sm mb-6">This stream link may be expired or invalid.</p>
        <Link to="/" className="px-5 py-2.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast">
          Go to ArenaHub
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 bg-black/80 backdrop-blur-sm border-b border-white/10">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-white flex items-center justify-center">
            <Zap size={14} className="text-black" />
          </div>
          <span className="text-white text-sm font-bold font-heading">ArenaHub</span>
        </Link>
        <div className={`flex items-center gap-1.5 text-xs font-medium ${current.color}`}>
          {phase === 'live' && <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />}
          {['connecting', 'waiting', 'receiving'].includes(phase) && <Wifi size={13} />}
          {(phase === 'ended' || phase === 'error') && <WifiOff size={13} />}
          {phase === 'loading' && <Radio size={13} className="animate-pulse" />}
          <span>{current.label}</span>
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-4 py-4">
        <div className={`w-full ${isPortrait ? 'max-w-[420px]' : 'max-w-3xl'}`}>
          <div className="mb-3 flex items-center gap-2">
            {phase === 'live' && (
              <span className="live-badge flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            )}
            <h1 className="text-white font-semibold text-base truncate">{stream.title}</h1>
          </div>

          <div className={`relative rounded-xl overflow-hidden bg-gray-950 w-full ${isPortrait ? 'aspect-[9/16]' : 'aspect-video'}`}>
            <video
              ref={videoRef}
              autoPlay
              playsInline
              controls
              className="w-full h-full object-contain"
            />

            {/* Tap to play */}
            {phase === 'tap' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/60">
                <button
                  onClick={handleTapToPlay}
                  className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-semibold text-sm hover:bg-white/90"
                >
                  <Play size={18} fill="black" />
                  Tap to play stream
                </button>
                {playError && <p className="text-xs text-white/60">{playError}</p>}
              </div>
            )}

            {/* Status overlay */}
            {phase !== 'live' && phase !== 'tap' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-black/70 px-6">
                {phase === 'ended' ? (
                  <WifiOff size={40} className="text-white/30" />
                ) : phase === 'error' ? (
                  <WifiOff size={40} className="text-red-400/50" />
                ) : (
                  <Radio size={40} className="text-white/30 animate-pulse" />
                )}
                <p className={`text-sm font-medium ${current.color}`}>{current.label}</p>
                {phase === 'error' && (
                  <p className="text-xs text-white/50 text-center max-w-sm">
                    Connection lost. The broadcaster may have ended the stream or lost their network.
                  </p>
                )}
              </div>
            )}
          </div>

          {phase === 'ended' && (
            <p className="text-center text-sm text-white/40 mt-4">This stream has ended.</p>
          )}
        </div>
      </div>
    </div>
  );
}
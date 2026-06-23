import React, { useEffect, useRef, useState, useCallback } from "react";
import {
  Copy,
  Check,
  ExternalLink,
  StopCircle,
  Video,
  VideoOff,
  Mic,
  MicOff,
  Users,
  RefreshCw,
  AlertTriangle,
} from "lucide-react";
import {
  Room,
  RoomEvent,
  LocalVideoTrack,
  createLocalAudioTrack,
} from "livekit-client";
import { supabase } from "@/lib/supabaseClient";
import { getLiveKitConnection } from "@/lib/livekit";

const HEARTBEAT_INTERVAL = 10000;
const CANVAS_W = 1280;
const CANVAS_H = 720;
const CANVAS_FPS = 30;

function drawCoverFrame(ctx, video) {
  const vw = video.videoWidth;
  const vh = video.videoHeight;

  if (!vw || !vh) return;

  const targetAR = CANVAS_W / CANVAS_H;
  const srcAR = vw / vh;

  let sx = 0;
  let sy = 0;
  let sw = vw;
  let sh = vh;

  if (srcAR > targetAR) {
    sw = vh * targetAR;
    sx = (vw - sw) / 2;
  } else {
    sh = vw / targetAR;
    sy = (vh - sh) / 2;
  }

  ctx.drawImage(video, sx, sy, sw, sh, 0, 0, CANVAS_W, CANVAS_H);
}

export default function PhoneBroadcaster({
  stream,
  onEndStream,
  initialMicEnabled = true,
}) {
  const rawVideoRef = useRef(null);
  const canvasRef = useRef(null);
  const previewVideoRef = useRef(null);
  const roomRef = useRef(null);
  const rawStreamRef = useRef(null);
  const canvasTrackRef = useRef(null);
  const audioTrackRef = useRef(null);
  const publishedVideoTrackRef = useRef(null);
  const rafRef = useRef(null);
  const heartbeatRef = useRef(null);
  const facingModeRef = useRef("environment");

  const [status, setStatus] = useState("connecting");
  const [errorMsg, setErrorMsg] = useState("");
  const [viewerCount, setViewerCount] = useState(0);
  const [copied, setCopied] = useState(false);
  const [micEnabled, setMicEnabled] = useState(initialMicEnabled);
  const [camEnabled, setCamEnabled] = useState(true);
  const [facingMode, setFacingMode] = useState("environment");
  const [switchingCamera, setSwitchingCamera] = useState(false);

  const publicUrl = `${window.location.origin}/watch/${stream.public_share_id}`;

  const updateStream = useCallback(
    async (updates) => {
      if (!stream?.id) return;

      const { error } = await supabase
        .from("streams")
        .update(updates)
        .eq("id", stream.id);

      if (error) {
        console.error("[broadcaster] stream update failed:", error);
      }
    },
    [stream?.id]
  );

  const markStreamEnded = useCallback(
    async (reason = "ended_by_user") => {
      await updateStream({
        status: "ended",
        stream_health: "ended",
        ended_at: new Date().toISOString(),
        ended_reason: reason,
      });
    },
    [updateStream]
  );

  const startRenderLoop = useCallback((video, ctx) => {
    const loop = () => {
      if (video.readyState >= 2) {
        drawCoverFrame(ctx, video);
      }

      rafRef.current = requestAnimationFrame(loop);
    };

    rafRef.current = requestAnimationFrame(loop);
  }, []);

  const stopRenderLoop = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
  }, []);

  const getCameraStream = useCallback(async (facing) => {
    return navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: facing },
        width: { ideal: 1280 },
        height: { ideal: 720 },
        frameRate: { ideal: 30, max: 30 },
      },
      audio: false,
    });
  }, []);

  useEffect(() => {
    let cancelled = false;

    const connect = async () => {
      try {
        const { serverUrl, token } = await getLiveKitConnection({
          roomName: stream.livekit_room_name,
          participantName: "broadcaster_" + stream.id,
        });

        if (cancelled) return;

        const rawStream = await getCameraStream("environment");

        if (cancelled) {
          rawStream.getTracks().forEach((t) => t.stop());
          return;
        }

        rawStreamRef.current = rawStream;
        facingModeRef.current = "environment";

        const rawVideo = rawVideoRef.current;
        rawVideo.srcObject = rawStream;
        rawVideo.muted = true;
        rawVideo.playsInline = true;

        await rawVideo.play().catch(() => {});

        const canvas = canvasRef.current;
        canvas.width = CANVAS_W;
        canvas.height = CANVAS_H;

        const ctx = canvas.getContext("2d");
        startRenderLoop(rawVideo, ctx);

        const canvasCaptureStream = canvas.captureStream(CANVAS_FPS);
        const canvasVideoTrack = canvasCaptureStream.getVideoTracks()[0];

        canvasTrackRef.current = canvasVideoTrack;

        if (previewVideoRef.current) {
          previewVideoRef.current.srcObject = canvasCaptureStream;
          previewVideoRef.current.muted = true;
          previewVideoRef.current.playsInline = true;
          previewVideoRef.current.play().catch(() => {});
        }

        const room = new Room({
          adaptiveStream: false,
          dynacast: false,
        });

        roomRef.current = room;

        const updateViewers = () => {
          const count = Math.max(0, room.remoteParticipants.size);
          setViewerCount(count);

          updateStream({
            viewer_count: count,
            last_heartbeat_at: new Date().toISOString(),
          }).catch(() => {});
        };

        room.on(RoomEvent.ParticipantConnected, updateViewers);
        room.on(RoomEvent.ParticipantDisconnected, updateViewers);

        room.on(RoomEvent.Disconnected, () => {
          if (!cancelled) {
            setStatus((s) => (s === "ended" ? s : "error"));
          }
        });

        await room.connect(serverUrl, token);

        if (cancelled) {
          room.disconnect();
          return;
        }

        const livekitVideoTrack = new LocalVideoTrack(canvasVideoTrack, {
          loggerName: "canvas-track",
        });

        await room.localParticipant.publishTrack(livekitVideoTrack);
        publishedVideoTrackRef.current = livekitVideoTrack;

        if (initialMicEnabled) {
          const audioTrack = await createLocalAudioTrack();

          if (cancelled) {
            audioTrack.stop();
            return;
          }

          audioTrackRef.current = audioTrack;
          await room.localParticipant.publishTrack(audioTrack);
        }

        if (!cancelled) {
          setStatus("live");
          updateViewers();

          await updateStream({
            status: "live",
            stream_health: "live",
            last_heartbeat_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("[broadcaster] connect failed", err);

        if (!cancelled) {
          setStatus("error");

          if (
            err.name === "NotAllowedError" ||
            err.name === "PermissionDeniedError"
          ) {
            setErrorMsg(
              "Camera/microphone permission required. Allow access and try again."
            );
          } else if (err.name === "NotFoundError") {
            setErrorMsg("No camera found on this device.");
          } else {
            setErrorMsg(
              "Could not start stream: " + (err.message || "Unknown error")
            );
          }
        }
      }
    };

    connect();

    return () => {
      cancelled = true;

      stopRenderLoop();

      rawStreamRef.current?.getTracks().forEach((t) => t.stop());
      canvasTrackRef.current?.stop();

      try {
        audioTrackRef.current?.stop();
      } catch {
        // noop
      }

      try {
        roomRef.current?.disconnect();
      } catch {
        // noop
      }
    };
  }, [
    stream.livekit_room_name,
    stream.id,
    initialMicEnabled,
    getCameraStream,
    startRenderLoop,
    stopRenderLoop,
    updateStream,
  ]);

  useEffect(() => {
    heartbeatRef.current = setInterval(() => {
      updateStream({
        status: "live",
        stream_health: "live",
        viewer_count: viewerCount,
        last_heartbeat_at: new Date().toISOString(),
      }).catch(() => {});
    }, HEARTBEAT_INTERVAL);

    const handlePageHide = () => {
      markStreamEnded("broadcaster_disconnected").catch(() => {});
    };

    window.addEventListener("pagehide", handlePageHide);
    window.addEventListener("beforeunload", handlePageHide);

    return () => {
      clearInterval(heartbeatRef.current);
      window.removeEventListener("pagehide", handlePageHide);
      window.removeEventListener("beforeunload", handlePageHide);
    };
  }, [stream.id, updateStream, markStreamEnded, viewerCount]);

  const toggleMic = async () => {
    const room = roomRef.current;
    if (!room) return;

    const newVal = !micEnabled;

    try {
      if (audioTrackRef.current) {
        if (newVal) {
          await audioTrackRef.current.unmute();
        } else {
          await audioTrackRef.current.mute();
        }
      } else if (newVal) {
        const audioTrack = await createLocalAudioTrack();
        audioTrackRef.current = audioTrack;
        await room.localParticipant.publishTrack(audioTrack);
      }

      setMicEnabled(newVal);

      await updateStream({
        microphone_enabled: newVal,
        last_heartbeat_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[broadcaster] toggle mic failed", err);
    }
  };

  const toggleCam = async () => {
    const newVal = !camEnabled;

    rawStreamRef.current?.getVideoTracks().forEach((t) => {
      t.enabled = newVal;
    });

    setCamEnabled(newVal);

    await updateStream({
      camera_enabled: newVal,
      last_heartbeat_at: new Date().toISOString(),
    });
  };

  const switchCamera = async () => {
    if (switchingCamera) return;

    setSwitchingCamera(true);

    const newFacing =
      facingModeRef.current === "environment" ? "user" : "environment";

    try {
      const newStream = await getCameraStream(newFacing);

      rawStreamRef.current?.getVideoTracks().forEach((t) => t.stop());

      rawStreamRef.current = newStream;
      facingModeRef.current = newFacing;
      setFacingMode(newFacing);

      const rawVideo = rawVideoRef.current;
      rawVideo.srcObject = newStream;

      await rawVideo.play().catch(() => {});

      await updateStream({
        last_heartbeat_at: new Date().toISOString(),
      });
    } catch (err) {
      console.error("[broadcaster] switch camera failed", err);
    } finally {
      setSwitchingCamera(false);
    }
  };

  const handleEnd = async () => {
    clearInterval(heartbeatRef.current);

    stopRenderLoop();

    rawStreamRef.current?.getTracks().forEach((t) => t.stop());
    canvasTrackRef.current?.stop();

    try {
      audioTrackRef.current?.stop();
    } catch {
      // noop
    }

    try {
      roomRef.current?.disconnect();
    } catch {
      // noop
    }

    await markStreamEnded("ended_by_user");

    setStatus("ended");
    onEndStream();
  };

  const copyLink = () => {
    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const statusLabels = {
    connecting: "Connecting…",
    live: "Live",
    error: "Connection error",
    ended: "Stream ended",
  };

  const statusColors = {
    connecting: "text-yellow-500",
    live: "text-live",
    error: "text-destructive",
    ended: "text-muted-foreground",
  };

  return (
    <div className="space-y-4">
      <video ref={rawVideoRef} style={{ display: "none" }} />
      <canvas ref={canvasRef} style={{ display: "none" }} />

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {status === "live" ? (
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-muted-foreground/40" />
          )}

          <span className={`text-sm font-semibold ${statusColors[status]}`}>
            {statusLabels[status]}
          </span>
        </div>

        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Users size={13} />
          {viewerCount} viewer{viewerCount !== 1 ? "s" : ""}
        </div>
      </div>

      <div className="relative rounded-xl overflow-hidden bg-black aspect-video max-w-xl mx-auto w-full">
        <video
          ref={previewVideoRef}
          autoPlay
          muted
          playsInline
          className="w-full h-full object-cover"
        />

        {!camEnabled && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/80">
            <VideoOff size={40} className="text-white/40" />
          </div>
        )}

        {status === "connecting" && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="w-7 h-7 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          </div>
        )}

        <div className="absolute top-2 left-2">
          {status === "live" && (
            <span className="live-badge flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
        </div>

        <div className="absolute top-2 right-2">
          <span className="text-xs text-white/60 bg-black/40 px-2 py-0.5 rounded-full">
            {facingMode === "environment" ? "Back" : "Front"} · 16:9
          </span>
        </div>

        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-3">
          <button
            onClick={toggleMic}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-arena-fast ${
              micEnabled ? "bg-white/20 text-white" : "bg-destructive text-white"
            }`}
          >
            {micEnabled ? <Mic size={16} /> : <MicOff size={16} />}
          </button>

          <button
            onClick={toggleCam}
            className={`w-10 h-10 rounded-full flex items-center justify-center transition-arena-fast ${
              camEnabled ? "bg-white/20 text-white" : "bg-destructive text-white"
            }`}
          >
            {camEnabled ? <Video size={16} /> : <VideoOff size={16} />}
          </button>

          <button
            onClick={switchCamera}
            disabled={switchingCamera}
            className="w-10 h-10 rounded-full flex items-center justify-center bg-white/20 text-white hover:bg-white/30 transition-arena-fast disabled:opacity-50"
          >
            <RefreshCw
              size={16}
              className={switchingCamera ? "animate-spin" : ""}
            />
          </button>
        </div>
      </div>

      {errorMsg && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <AlertTriangle
            size={14}
            className="text-destructive shrink-0 mt-0.5"
          />
          <span className="text-xs text-destructive">{errorMsg}</span>
        </div>
      )}

      <div className="arena-card p-4 space-y-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          Public Watch Link
        </p>

        <div className="flex items-center gap-2 p-3 bg-secondary rounded-lg">
          <span className="flex-1 text-sm font-mono truncate">
            {publicUrl}
          </span>

          <button
            onClick={copyLink}
            className="shrink-0 p-1 hover:opacity-70 transition-arena-fast text-muted-foreground hover:text-foreground"
          >
            {copied ? (
              <Check size={14} className="text-emerald-500" />
            ) : (
              <Copy size={14} />
            )}
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="shrink-0 p-1 hover:opacity-70 transition-arena-fast text-muted-foreground hover:text-foreground"
          >
            <ExternalLink size={14} />
          </a>
        </div>

        <p className="text-xs text-muted-foreground">
          Share this link — viewers can watch without an account. Stream is
          published as landscape 16:9.
        </p>
      </div>

      <div className="p-3 bg-secondary/60 rounded-lg border border-border">
        <p className="text-xs text-muted-foreground">
          <span className="font-semibold text-foreground">Beta note:</span>{" "}
          Phone streaming uses a canvas pipeline to lock output to 1280×720
          landscape regardless of device orientation.
        </p>
      </div>

      <button
        onClick={handleEnd}
        className="w-full flex items-center justify-center gap-2 py-3 border-2 border-destructive/40 text-destructive rounded-lg text-sm font-semibold hover:bg-destructive/5 transition-arena-fast"
      >
        <StopCircle size={16} />
        End Stream
      </button>
    </div>
  );
}
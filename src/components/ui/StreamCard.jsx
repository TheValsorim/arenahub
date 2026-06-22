import React from 'react';
import { Link } from 'react-router-dom';
import { Eye, Radio } from 'lucide-react';

export default function StreamCard({ stream }) {
  const isLive = stream.status === 'live';

  return (
    <Link to={`/streams/${stream.id}`} className="group block">
      <div className="arena-card hover:shadow-md transition-arena overflow-hidden">
        {/* Thumbnail */}
        <div className="relative aspect-video bg-foreground/5 overflow-hidden">
          {stream.thumbnail_url ? (
            <img
              src={stream.thumbnail_url}
              alt={stream.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-arena"
            />
          ) : (
            <div className="w-full h-full ignition-gradient flex items-center justify-center">
              <Radio size={32} className="text-white/40" />
            </div>
          )}
          {isLive && (
            <span className="absolute top-2 left-2 live-badge flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              LIVE
            </span>
          )}
          {isLive && (
            <div className="absolute bottom-2 right-2 flex items-center gap-1 bg-black/60 text-white text-xs px-2 py-0.5 rounded-full">
              <Eye size={11} />
              {(stream.viewer_count || 0).toLocaleString()}
            </div>
          )}
        </div>
        {/* Info */}
        <div className="p-3">
          <p className="font-semibold text-sm text-foreground leading-tight line-clamp-2 group-hover:text-ember transition-arena-fast">
            {stream.title}
          </p>
          {stream.description && (
            <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{stream.description}</p>
          )}
        </div>
      </div>
    </Link>
  );
}
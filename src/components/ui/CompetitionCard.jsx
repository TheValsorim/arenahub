import React from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Users, MapPin, Trophy } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function CompetitionCard({ competition, discipline, category }) {
  const formatDate = (dt) => {
    if (!dt) return '—';
    return new Date(dt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const typeColors = {
    tournament: 'text-ember',
    league: 'text-indigo-arena',
    event: 'text-live',
    friendly: 'text-muted-foreground',
  };

  return (
    <Link to={`/competitions/${competition.id}`} className="group block">
      <div className="arena-card hover:shadow-md transition-arena overflow-hidden flex flex-col h-full">
        {/* Banner */}
        <div className="relative h-32 overflow-hidden bg-foreground/5">
          {competition.banner_url ? (
            <img
              src={competition.banner_url}
              alt={competition.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-arena"
            />
          ) : (
            <div className="w-full h-full ignition-gradient flex items-center justify-center">
              <Trophy size={28} className="text-white/30" />
            </div>
          )}
          <div className="absolute top-2 left-2">
            <StatusBadge status={competition.status} />
          </div>
          {category && (
            <div className="absolute top-2 right-2 bg-black/50 text-white text-xs px-2 py-0.5 rounded-full font-medium">
              {category.name}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-4 flex flex-col flex-1">
          <div className="mb-2">
            <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${typeColors[competition.competition_type] || 'text-muted-foreground'}`}>
              {competition.competition_type} · {discipline?.name || '—'}
            </p>
            <h3 className="font-bold text-foreground text-base leading-tight line-clamp-2 group-hover:text-ember transition-arena-fast">
              {competition.name}
            </h3>
          </div>

          {competition.description && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3 flex-1">{competition.description}</p>
          )}

          <div className="mt-auto space-y-1.5">
            {competition.start_date && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Calendar size={12} />
                <span>{formatDate(competition.start_date)}</span>
              </div>
            )}
            {competition.max_participants && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Users size={12} />
                <span>Up to {competition.max_participants} participants</span>
              </div>
            )}
            {competition.location_type && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <MapPin size={12} />
                <span className="capitalize">{competition.location_type}</span>
                {competition.location_name && <span>· {competition.location_name}</span>}
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
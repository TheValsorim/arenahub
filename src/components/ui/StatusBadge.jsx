import React from 'react';

const configs = {
  // Competition status
  draft:                { label: 'Draft',        classes: 'bg-muted text-muted-foreground' },
  published:            { label: 'Published',    classes: 'bg-secondary text-foreground' },
  registration_open:    { label: 'Reg. Open',    classes: 'bg-live-light text-live border border-live/20' },
  registration_closed:  { label: 'Reg. Closed',  classes: 'bg-muted text-muted-foreground' },
  live:                 { label: '● LIVE',        classes: 'bg-live-light text-live font-bold' },
  finished:             { label: 'Finished',      classes: 'bg-muted text-muted-foreground' },
  cancelled:            { label: 'Cancelled',     classes: 'bg-destructive/10 text-destructive' },
  // Match status
  scheduled:            { label: 'Scheduled',    classes: 'bg-secondary text-muted-foreground' },
  completed:            { label: 'Completed',    classes: 'bg-muted text-muted-foreground' },
  disputed:             { label: 'Disputed',     classes: 'bg-ember-light text-ember' },
  // Stream status
  ended:                { label: 'Ended',        classes: 'bg-muted text-muted-foreground' },
  failed:               { label: 'Failed',       classes: 'bg-destructive/10 text-destructive' },
  // Registration status
  pending:              { label: 'Pending',      classes: 'bg-secondary text-muted-foreground' },
  approved:             { label: 'Approved',     classes: 'bg-live-light text-live' },
  rejected:             { label: 'Rejected',     classes: 'bg-destructive/10 text-destructive' },
  // Generic
  active:               { label: 'Active',       classes: 'bg-live-light text-live' },
  inactive:             { label: 'Inactive',     classes: 'bg-muted text-muted-foreground' },
  open:                 { label: 'Open',         classes: 'bg-ember-light text-ember' },
  reviewing:            { label: 'Reviewing',    classes: 'bg-secondary text-muted-foreground' },
  resolved:             { label: 'Resolved',     classes: 'bg-live-light text-live' },
};

export default function StatusBadge({ status, className = '' }) {
  const config = configs[status] || { label: status, classes: 'bg-muted text-muted-foreground' };
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${config.classes} ${className}`}>
      {config.label}
    </span>
  );
}
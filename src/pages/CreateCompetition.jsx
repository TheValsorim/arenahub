import React, { useEffect, useState } from 'react';
import { useNavigate, useOutletContext } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Check, Trophy, Upload } from 'lucide-react';
import { base44 } from '@/api/base44Client';

const STEPS = ['Basic Info', 'Category & Discipline', 'Format', 'Participants', 'Streaming', 'Review & Publish'];

const FORMATS = [
  { value: 'single_elimination', label: 'Single Elimination', desc: 'Lose once and you\'re out. Classic bracket.' },
  { value: 'double_elimination', label: 'Double Elimination', desc: 'Two losses to be eliminated. More fair.' },
  { value: 'round_robin', label: 'Round Robin', desc: 'Everyone plays everyone. Most points wins.' },
  { value: 'swiss', label: 'Swiss System', desc: 'Paired by score. No eliminations until finals.' },
  { value: 'league_table', label: 'League Table', desc: 'Season-style standings. Points over time.' },
];

export default function CreateCompetition() {
  const navigate = useNavigate();
  const { user, profile } = useOutletContext() || {};
  const [step, setStep] = useState(0);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const [form, setForm] = useState({
    name: '', description: '', banner_url: '',
    category_id: '', discipline_id: '',
    competition_type: 'tournament', format: 'single_elimination',
    location_type: 'online', location_name: '',
    start_date: '', end_date: '', registration_deadline: '',
    max_participants: '', team_size: '', rules: '',
    allow_player_streams: false, official_stream_enabled: false, chat_enabled: true,
    status: 'draft',
  });

  useEffect(() => {
    base44.entities.Category.list().then(setCategories);
    base44.entities.Discipline.list().then(setDisciplines);
  }, []);

  const set = (key, value) => setForm(f => ({ ...f, [key]: value }));

  const filteredDisciplines = form.category_id
    ? disciplines.filter(d => d.category_id === form.category_id)
    : disciplines;

  const handlePublish = async (status) => {
    setSaving(true);
    setError('');
    try {
      const payload = {
        ...form,
        organizer_id: user.id,
        status,
        max_participants: form.max_participants ? parseInt(form.max_participants) : null,
        team_size: form.team_size ? parseInt(form.team_size) : null,
        updated_at: new Date().toISOString(),
      };
      const created = await base44.entities.Competition.create(payload);
      await base44.entities.AuditLog.create({
        user_id: user.id,
        action: 'created_competition',
        entity_type: 'Competition',
        entity_id: created.id,
        metadata: JSON.stringify({ name: form.name, status }),
      });
      navigate(`/competitions/${created.id}`);
    } catch (e) {
      setError('Failed to create competition. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const canNext = () => {
    if (step === 0) return form.name.trim().length >= 3;
    if (step === 1) return !!form.category_id && !!form.discipline_id;
    return true;
  };

  if (!user) return <div className="text-center py-24"><p className="text-muted-foreground">Sign in to create competitions.</p></div>;
  if (!profile?.is_organizer) return (
    <div className="text-center py-24 max-w-md mx-auto">
      <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/40" />
      <h2 className="font-bold text-lg mb-2">Organizer Access Required</h2>
      <p className="text-muted-foreground text-sm">Enable Organizer mode on your profile to create competitions.</p>
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Create Competition</h1>
        <p className="text-muted-foreground text-sm mt-1">Step {step + 1} of {STEPS.length}: {STEPS[step]}</p>
      </div>

      {/* Progress */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <React.Fragment key={i}>
            <div
              onClick={() => i < step && setStep(i)}
              className={`flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold transition-arena-fast ${
                i < step ? 'bg-foreground text-background cursor-pointer' :
                i === step ? 'bg-foreground text-background ring-2 ring-foreground/30' :
                'bg-secondary text-muted-foreground'
              }`}
            >
              {i < step ? <Check size={12} /> : i + 1}
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 rounded-full transition-arena ${i < step ? 'bg-foreground' : 'bg-border'}`} />
            )}
          </React.Fragment>
        ))}
      </div>

      <div className="arena-card p-6 space-y-5">
        {/* Step 0: Basic Info */}
        {step === 0 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-1.5">Competition Name *</label>
              <input
                value={form.name}
                onChange={e => set('name', e.target.value)}
                placeholder="e.g. Summer Volleyball Open 2026"
                className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-background"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="Describe your competition..."
                rows={4}
                className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-foreground/20 bg-background resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Type</label>
              <div className="grid grid-cols-2 gap-2">
                {['tournament', 'league', 'event', 'friendly'].map(t => (
                  <button
                    key={t}
                    onClick={() => set('competition_type', t)}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium capitalize border transition-arena-fast ${
                      form.competition_type === t ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-secondary'
                    }`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Location Type</label>
                <select
                  value={form.location_type}
                  onChange={e => set('location_type', e.target.value)}
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background capitalize"
                >
                  {['online', 'offline', 'hybrid'].map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              {form.location_type !== 'online' && (
                <div>
                  <label className="block text-sm font-medium mb-1.5">Venue Name</label>
                  <input
                    value={form.location_name}
                    onChange={e => set('location_name', e.target.value)}
                    placeholder="Arena / City"
                    className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background"
                  />
                </div>
              )}
            </div>
          </>
        )}

        {/* Step 1: Category & Discipline */}
        {step === 1 && (
          <>
            <div>
              <label className="block text-sm font-medium mb-2">Category *</label>
              <div className="grid grid-cols-2 gap-3">
                {categories.map(cat => (
                  <button
                    key={cat.id}
                    onClick={() => { set('category_id', cat.id); set('discipline_id', ''); }}
                    className={`p-4 rounded-lg border-2 text-sm font-semibold transition-arena-fast ${
                      form.category_id === cat.id ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/40'
                    }`}
                  >
                    {cat.name}
                  </button>
                ))}
              </div>
            </div>
            {form.category_id && (
              <div>
                <label className="block text-sm font-medium mb-2">Discipline *</label>
                <div className="grid grid-cols-2 gap-2">
                  {filteredDisciplines.map(d => (
                    <button
                      key={d.id}
                      onClick={() => set('discipline_id', d.id)}
                      className={`px-4 py-2.5 rounded-lg text-sm font-medium border transition-arena-fast ${
                        form.discipline_id === d.id ? 'bg-foreground text-background border-foreground' : 'border-border hover:bg-secondary'
                      }`}
                    >
                      {d.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        )}

        {/* Step 2: Format */}
        {step === 2 && (
          <div className="space-y-3">
            <label className="block text-sm font-medium mb-2">Bracket Format</label>
            {FORMATS.map(f => (
              <button
                key={f.value}
                onClick={() => set('format', f.value)}
                className={`w-full p-4 rounded-lg border-2 text-left transition-arena-fast ${
                  form.format === f.value ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-sm">{f.label}</span>
                  {form.format === f.value && <Check size={16} className="text-foreground" />}
                </div>
                <p className="text-xs text-muted-foreground mt-1">{f.desc}</p>
              </button>
            ))}
          </div>
        )}

        {/* Step 3: Participants */}
        {step === 3 && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Max Participants</label>
                <input
                  type="number"
                  value={form.max_participants}
                  onChange={e => set('max_participants', e.target.value)}
                  placeholder="e.g. 16 or 32"
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Team Size</label>
                <input
                  type="number"
                  value={form.team_size}
                  onChange={e => set('team_size', e.target.value)}
                  placeholder="Players per team"
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1.5">Registration Deadline</label>
                <input type="datetime-local" value={form.registration_deadline} onChange={e => set('registration_deadline', e.target.value)}
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Start Date</label>
                <input type="datetime-local" value={form.start_date} onChange={e => set('start_date', e.target.value)}
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background" />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">End Date</label>
                <input type="datetime-local" value={form.end_date} onChange={e => set('end_date', e.target.value)}
                  className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Rules</label>
              <textarea
                value={form.rules}
                onChange={e => set('rules', e.target.value)}
                placeholder="Describe the competition rules..."
                rows={5}
                className="w-full px-4 py-2.5 border border-accessible rounded-lg text-sm focus:outline-none bg-background resize-none"
              />
            </div>
          </div>
        )}

        {/* Step 4: Streaming */}
        {step === 4 && (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Control streaming permissions for this competition.</p>
            {[
              { key: 'chat_enabled', label: 'Enable Chat', desc: 'Allow viewers and participants to chat during matches.' },
              { key: 'official_stream_enabled', label: 'Official Stream', desc: 'Enable an official stream for this competition.' },
              { key: 'allow_player_streams', label: 'Player POV Streams', desc: 'Allow registered players to stream from their perspective.' },
            ].map(({ key, label, desc }) => (
              <button
                key={key}
                onClick={() => set(key, !form[key])}
                className={`w-full p-4 rounded-lg border-2 text-left flex items-center justify-between transition-arena-fast ${
                  form[key] ? 'border-foreground bg-foreground/5' : 'border-border hover:border-foreground/20'
                }`}
              >
                <div>
                  <p className="font-medium text-sm">{label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                </div>
                <div className={`w-10 h-6 rounded-full transition-arena flex items-center ${form[key] ? 'bg-foreground' : 'bg-border'}`}>
                  <div className={`w-4 h-4 rounded-full bg-white shadow transition-arena mx-1 ${form[key] ? 'translate-x-4' : 'translate-x-0'}`} />
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Step 5: Review */}
        {step === 5 && (
          <div className="space-y-4">
            <h3 className="font-semibold">Review Your Competition</h3>
            <div className="p-4 bg-secondary rounded-lg space-y-2.5">
              {[
                { label: 'Name', value: form.name },
                { label: 'Type', value: form.competition_type },
                { label: 'Category', value: categories.find(c => c.id === form.category_id)?.name || '—' },
                { label: 'Discipline', value: disciplines.find(d => d.id === form.discipline_id)?.name || '—' },
                { label: 'Format', value: FORMATS.find(f => f.value === form.format)?.label || '—' },
                { label: 'Location', value: form.location_type },
                { label: 'Max Participants', value: form.max_participants || 'Unlimited' },
                { label: 'Team Size', value: form.team_size || 'See discipline default' },
                { label: 'Start Date', value: form.start_date || 'Not set' },
                { label: 'Chat', value: form.chat_enabled ? 'Enabled' : 'Disabled' },
                { label: 'Player Streams', value: form.allow_player_streams ? 'Allowed' : 'Not allowed' },
              ].map(({ label, value }) => (
                <div key={label} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium capitalize">{String(value)}</span>
                </div>
              ))}
            </div>
            {error && <p className="text-sm text-destructive bg-destructive/10 px-4 py-2.5 rounded-lg">{error}</p>}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => handlePublish('draft')}
                disabled={saving}
                className="px-4 py-3 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-arena-fast disabled:opacity-60"
              >
                Save as Draft
              </button>
              <button
                onClick={() => handlePublish('published')}
                disabled={saving}
                className="px-4 py-3 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-60"
              >
                {saving ? 'Publishing...' : 'Publish Competition'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Navigation */}
      {step < 5 && (
        <div className="flex items-center justify-between">
          <button
            onClick={() => setStep(s => s - 1)}
            disabled={step === 0}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground transition-arena-fast disabled:opacity-30"
          >
            <ChevronLeft size={16} /> Back
          </button>
          <button
            onClick={() => setStep(s => s + 1)}
            disabled={!canNext()}
            className="flex items-center gap-2 px-6 py-2.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast disabled:opacity-40"
          >
            Next <ChevronRight size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, Plus, Trophy, X } from 'lucide-react';
import { base44 } from '@/api/base44Client';
import CompetitionCard from '@/components/ui/CompetitionCard';

const STATUS_OPTIONS = ['all', 'registration_open', 'live', 'published', 'finished'];
const TYPE_OPTIONS = ['all', 'tournament', 'league', 'event', 'friendly'];
const LOCATION_OPTIONS = ['all', 'online', 'offline', 'hybrid'];

export default function Competitions() {
  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterType, setFilterType] = useState('all');
  const [filterLocation, setFilterLocation] = useState('all');
  const [filterCategory, setFilterCategory] = useState('all');
  const [filterDiscipline, setFilterDiscipline] = useState('all');

  useEffect(() => {
    Promise.all([
      base44.entities.Competition.list('-created_date', 100),
      base44.entities.Category.list(),
      base44.entities.Discipline.list(),
    ]).then(([comps, cats, discs]) => {
      setCompetitions(comps);
      setCategories(cats);
      setDisciplines(discs);
    }).finally(() => setLoading(false));
  }, []);

  const getCategory = (id) => categories.find(c => c.id === id);
  const getDiscipline = (id) => disciplines.find(d => d.id === id);

  const filtered = competitions.filter(c => {
    if (search && !c.name?.toLowerCase().includes(search.toLowerCase())) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterType !== 'all' && c.competition_type !== filterType) return false;
    if (filterLocation !== 'all' && c.location_type !== filterLocation) return false;
    if (filterCategory !== 'all' && c.category_id !== filterCategory) return false;
    if (filterDiscipline !== 'all' && c.discipline_id !== filterDiscipline) return false;
    return true;
  });

  const hasFilters = filterStatus !== 'all' || filterType !== 'all' || filterLocation !== 'all' || filterCategory !== 'all' || filterDiscipline !== 'all';

  const clearFilters = () => {
    setFilterStatus('all');
    setFilterType('all');
    setFilterLocation('all');
    setFilterCategory('all');
    setFilterDiscipline('all');
  };

  const FilterSelect = ({ label, value, onChange, options }) => (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      className="px-3 py-2 text-sm bg-card border border-border rounded-lg focus:outline-none focus:border-foreground/40 text-foreground capitalize cursor-pointer transition-arena-fast"
    >
      <option value="all">{label}</option>
      {options.map(o => (
        <option key={o} value={o} className="capitalize">{o.replace(/_/g, ' ')}</option>
      ))}
    </select>
  );

  const filteredDisciplines = filterCategory !== 'all'
    ? disciplines.filter(d => d.category_id === filterCategory)
    : disciplines;

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold font-heading">Competitions</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {loading ? 'Loading...' : `${filtered.length} competition${filtered.length !== 1 ? 's' : ''} found`}
          </p>
        </div>
      </div>

      {/* Search + Filters */}
      <div className="arena-card p-4 space-y-3">
        <div className="relative">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search competitions..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-sm bg-secondary border border-transparent rounded-lg focus:outline-none focus:border-foreground/30 transition-arena-fast"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />
          <FilterSelect label="Status" value={filterStatus} onChange={setFilterStatus} options={STATUS_OPTIONS.slice(1)} />
          <FilterSelect label="Type" value={filterType} onChange={setFilterType} options={TYPE_OPTIONS.slice(1)} />
          <FilterSelect label="Location" value={filterLocation} onChange={setFilterLocation} options={LOCATION_OPTIONS.slice(1)} />
          <FilterSelect
            label="Category"
            value={filterCategory}
            onChange={(v) => { setFilterCategory(v); setFilterDiscipline('all'); }}
            options={categories.map(c => c.id)}
          />
          {filteredDisciplines.length > 0 && (
            <FilterSelect
              label="Discipline"
              value={filterDiscipline}
              onChange={setFilterDiscipline}
              options={filteredDisciplines.map(d => d.id)}
            />
          )}
          {hasFilters && (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-arena-fast"
            >
              <X size={12} />
              Clear
            </button>
          )}
        </div>
        {/* Category tab override for display */}
        {filterCategory !== 'all' && (
          <div className="flex items-center gap-2 flex-wrap">
            {filteredDisciplines.map(d => (
              <button
                key={d.id}
                onClick={() => setFilterDiscipline(filterDiscipline === d.id ? 'all' : d.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-arena-fast ${
                  filterDiscipline === d.id
                    ? 'bg-foreground text-background'
                    : 'bg-secondary text-muted-foreground hover:text-foreground'
                }`}
              >
                {d.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(comp => (
            <CompetitionCard
              key={comp.id}
              competition={comp}
              discipline={getDiscipline(comp.discipline_id)}
              category={getCategory(comp.category_id)}
            />
          ))}
        </div>
      ) : (
        <div className="arena-card p-16 text-center">
          <Trophy size={40} className="mx-auto mb-4 text-muted-foreground/30" />
          <p className="font-semibold text-foreground">No competitions found</p>
          <p className="text-sm text-muted-foreground mt-1">Try adjusting your filters</p>
          {hasFilters && (
            <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-secondary rounded-lg text-sm hover:bg-secondary/80 transition-arena-fast">
              Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  );
}
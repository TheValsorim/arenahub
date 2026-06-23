import React, { useEffect, useMemo, useState } from "react";
import { Link, useOutletContext } from "react-router-dom";
import { Search, Trophy, Plus, Filter } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import CompetitionCard from "@/components/ui/CompetitionCard";

const statusOptions = [
  { value: "all", label: "All" },
  { value: "registration_open", label: "Registration Open" },
  { value: "published", label: "Published" },
  { value: "live", label: "Live" },
  { value: "finished", label: "Finished" },
];

export default function Competitions() {
  const { user, profile } = useOutletContext() || {};

  const [competitions, setCompetitions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [disciplines, setDisciplines] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    setError("");

    const [competitionsResult, categoriesResult, disciplinesResult] =
      await Promise.all([
        supabase
          .from("competitions")
          .select("*")
          .order("created_at", { ascending: false }),

        supabase
          .from("categories")
          .select("*")
          .order("name", { ascending: true }),

        supabase
          .from("disciplines")
          .select("*")
          .order("name", { ascending: true }),
      ]);

    const firstError =
      competitionsResult.error ||
      categoriesResult.error ||
      disciplinesResult.error;

    if (firstError) {
      console.error("Competitions load error:", firstError);
      setError(firstError.message || "Could not load competitions.");
    }

    setCompetitions(competitionsResult.data || []);
    setCategories(categoriesResult.data || []);
    setDisciplines(disciplinesResult.data || []);
    setLoading(false);
  };

  const getCategory = (id) => categories.find((c) => c.id === id);
  const getDiscipline = (id) => disciplines.find((d) => d.id === id);

  const filteredCompetitions = useMemo(() => {
    const q = search.trim().toLowerCase();

    return competitions.filter((competition) => {
      const category = getCategory(competition.category_id);
      const discipline = getDiscipline(competition.discipline_id);

      const matchesSearch =
        !q ||
        competition.name?.toLowerCase().includes(q) ||
        competition.description?.toLowerCase().includes(q) ||
        category?.name?.toLowerCase().includes(q) ||
        discipline?.name?.toLowerCase().includes(q);

      const matchesStatus =
        statusFilter === "all" || competition.status === statusFilter;

      const matchesCategory =
        categoryFilter === "all" || competition.category_id === categoryFilter;

      return matchesSearch && matchesStatus && matchesCategory;
    });
  }, [
    competitions,
    categories,
    disciplines,
    search,
    statusFilter,
    categoryFilter,
  ]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2.5 mb-1">
            <Trophy size={22} className="text-ember" />
            <h1 className="text-2xl font-bold font-heading">Competitions</h1>
          </div>

          <p className="text-muted-foreground text-sm">
            Browse tournaments, leagues and events across sports and esports.
          </p>
        </div>

        {user && profile?.is_organizer && (
          <Link
            to="/create-competition"
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-foreground text-background rounded-lg text-sm font-semibold hover:bg-foreground/90 transition-arena-fast"
          >
            <Plus size={15} />
            Create Competition
          </Link>
        )}
      </div>

      {error && (
        <div className="arena-card p-4 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      <div className="arena-card p-4">
        <div className="grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-3">
          <div className="relative">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search competitions..."
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
            />
          </div>

          <div className="relative">
            <Filter
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
            />

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full md:w-48 pl-9 pr-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
            >
              {statusOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="w-full md:w-48 px-3 py-2.5 text-sm bg-secondary border border-border rounded-lg focus:outline-none focus:border-foreground/40 transition-arena-fast"
          >
            <option value="all">All categories</option>

            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {filteredCompetitions.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredCompetitions.map((competition) => (
            <CompetitionCard
              key={competition.id}
              competition={competition}
              discipline={getDiscipline(competition.discipline_id)}
              category={getCategory(competition.category_id)}
            />
          ))}
        </div>
      ) : (
        <div className="arena-card p-12 text-center">
          <Trophy size={36} className="mx-auto mb-3 text-muted-foreground/40" />

          <h2 className="font-semibold mb-1">No competitions found</h2>

          <p className="text-sm text-muted-foreground">
            Try changing your filters or search term.
          </p>

          {user && profile?.is_organizer && (
            <Link
              to="/create-competition"
              className="mt-5 inline-flex items-center gap-2 px-4 py-2 bg-foreground text-background rounded-lg text-sm font-semibold"
            >
              <Plus size={14} />
              Create first competition
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
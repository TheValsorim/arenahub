import React, { useEffect, useState } from "react";
import {
  Radio,
  Search,
  Filter,
  Copy,
  Check,
  ExternalLink,
  Smartphone,
} from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import StreamCard from "@/components/ui/StreamCard";

function LiveStreamEntry({ stream }) {
  const [copied, setCopied] = useState(false);

  const isPhone =
    stream.stream_mode === "livekit_phone" &&
    stream.is_public &&
    stream.public_share_id;

  const publicUrl = isPhone
    ? `${window.location.origin}/watch/${stream.public_share_id}`
    : null;

  const copyLink = (e) => {
    e.preventDefault();

    if (!publicUrl) return;

    navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="relative">
      <StreamCard stream={stream} />

      {isPhone && (
        <div className="flex items-center gap-2 mt-2 px-1">
          <span className="flex items-center gap-1 text-xs text-muted-foreground">
            <Smartphone size={11} /> Phone Beta
          </span>

          <button
            onClick={copyLink}
            className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded-md hover:bg-secondary/80 transition-arena-fast"
          >
            {copied ? (
              <Check size={11} className="text-emerald-500" />
            ) : (
              <Copy size={11} />
            )}
            Copy link
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1 text-xs px-2 py-1 bg-secondary rounded-md hover:bg-secondary/80 transition-arena-fast"
          >
            <ExternalLink size={11} /> Watch
          </a>
        </div>
      )}
    </div>
  );
}

export default function Streams() {
  const [streams, setStreams] = useState([]);
  const [categories, setCategories] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [search, setSearch] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterCategory, setFilterCategory] = useState("all");

  useEffect(() => {
    loadStreamsPage();
  }, []);

  const loadStreamsPage = async () => {
    setLoading(true);
    setError("");

    const [streamsResult, categoriesResult] = await Promise.all([
      supabase
        .from("streams")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(100),

      supabase
        .from("categories")
        .select("*")
        .order("name", { ascending: true }),
    ]);

    const firstError = streamsResult.error || categoriesResult.error;

    if (firstError) {
      console.error("Streams page load error:", firstError);
      setError(firstError.message || "Could not load streams.");
    }

    setStreams(streamsResult.data || []);
    setCategories(categoriesResult.data || []);
    setLoading(false);
  };

  const filtered = streams.filter((s) => {
    if (search && !s.title?.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }

    if (filterStatus !== "all" && s.status !== filterStatus) {
      return false;
    }

    if (filterCategory !== "all" && s.category_id !== filterCategory) {
      return false;
    }

    return true;
  });

  const liveStreams = filtered.filter((s) => s.status === "live");
  const otherStreams = filtered.filter((s) => s.status !== "live");

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold font-heading">Streams</h1>
        <p className="text-muted-foreground text-sm mt-1">
          {loading
            ? "Loading..."
            : `${filtered.length} stream${filtered.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {error && (
        <div className="arena-card p-4 bg-destructive/10 text-destructive text-sm">
          {error}
        </div>
      )}

      {/* Filters */}
      <div className="arena-card p-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search
            size={15}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          />

          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search streams..."
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-secondary rounded-lg focus:outline-none border border-transparent focus:border-foreground/20"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter size={14} className="text-muted-foreground" />

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2.5 text-sm bg-secondary rounded-lg focus:outline-none border border-transparent cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="live">Live</option>
            <option value="scheduled">Scheduled</option>
            <option value="ended">Ended</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2.5 text-sm bg-secondary rounded-lg focus:outline-none border border-transparent cursor-pointer"
          >
            <option value="all">All Categories</option>

            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-20">
          <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
        </div>
      ) : (
        <div className="space-y-8">
          {liveStreams.length > 0 && (
            <section>
              <div className="flex items-center gap-2.5 mb-4">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                <h2 className="font-bold text-base">Live Now</h2>
                <span className="text-xs font-bold text-live bg-live-light px-2 py-0.5 rounded-full">
                  {liveStreams.length}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {liveStreams.map((s) => (
                  <LiveStreamEntry key={s.id} stream={s} />
                ))}
              </div>
            </section>
          )}

          {otherStreams.length > 0 && (
            <section>
              {liveStreams.length > 0 && (
                <h2 className="font-bold text-base mb-4 text-muted-foreground">
                  Other Streams
                </h2>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {otherStreams.map((s) => (
                  <StreamCard key={s.id} stream={s} />
                ))}
              </div>
            </section>
          )}

          {filtered.length === 0 && (
            <div className="arena-card p-16 text-center">
              <Radio
                size={36}
                className="mx-auto mb-4 text-muted-foreground/40"
              />
              <p className="font-semibold text-muted-foreground">
                No streams found
              </p>
              <p className="text-sm text-muted-foreground/70 mt-1">
                Try adjusting your filters
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
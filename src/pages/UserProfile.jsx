import React, { useEffect, useState, useRef } from "react";
import { useOutletContext } from "react-router-dom";
import { Camera, Check, Zap, Trophy, Edit3 } from "lucide-react";
import { useAuth } from "@/lib/AuthContext";
import { supabase } from "@/lib/supabaseClient";

export default function UserProfilePage() {
  const outlet = useOutletContext() || {};
  const auth = useAuth();

  const user = outlet.user || auth.user;
  const ctxProfile = outlet.profile || auth.profile;
  const refreshProfile = outlet.refreshProfile || auth.refreshProfile;
  const updateProfile = auth.updateProfile;

  const [profile, setProfile] = useState(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    display_name: "",
    username: "",
    bio: "",
    country: "",
    avatar_url: "",
    banner_url: "",
    is_creator: false,
    is_organizer: false,
  });

  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [uploadingBanner, setUploadingBanner] = useState(false);

  const avatarInputRef = useRef(null);
  const bannerInputRef = useRef(null);

  useEffect(() => {
    if (!user || !ctxProfile) return;

    const usernameFallback =
      ctxProfile.username ||
      ctxProfile.channel_name ||
      user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase() ||
      "";

    const displayNameFallback =
      ctxProfile.display_name ||
      ctxProfile.full_name ||
      user.full_name ||
      user.email?.split("@")[0] ||
      "New User";

    const p = {
      ...ctxProfile,
      display_name: displayNameFallback,
      username: usernameFallback,
      followers_count: ctxProfile.followers_count || 0,
      total_views: ctxProfile.total_views || 0,
    };

    setProfile(p);

    setForm({
      display_name: displayNameFallback,
      username: usernameFallback,
      bio: ctxProfile.bio || "",
      country: ctxProfile.country || "",
      avatar_url: ctxProfile.avatar_url || "",
      banner_url: ctxProfile.banner_url || "",
      is_creator: !!ctxProfile.is_creator,
      is_organizer: !!ctxProfile.is_organizer,
    });
  }, [user, ctxProfile]);

  const set = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
  };

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setSaved(false);
    setError("");

    const cleanUsername =
      form.username ||
      user.email?.split("@")[0]?.replace(/[^a-z0-9]/gi, "").toLowerCase();

    const role = form.is_organizer
      ? "organizer"
      : form.is_creator
        ? "creator"
        : "fan";

    const payload = {
      full_name: form.display_name,
      display_name: form.display_name,
      channel_name: cleanUsername,
      username: cleanUsername,
      bio: form.bio,
      country: form.country,
      avatar_url: form.avatar_url,
      banner_url: form.banner_url,
      is_creator: form.is_creator,
      is_organizer: form.is_organizer,
      role,
    };

    const { data, error } = await updateProfile(payload);

    setSaving(false);

    if (error) {
      setError(error.message || "Profile update failed.");
      return;
    }

    setProfile(data);
    setSaved(true);
    setEditing(false);

    if (refreshProfile) {
      await refreshProfile();
    }

    setTimeout(() => setSaved(false), 3000);
  };

  const uploadProfileMedia = async (file, type) => {
    if (!file || !user) return null;

    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
    const path = `${user.id}/${type}-${Date.now()}-${safeName}`;

    const { error: uploadError } = await supabase.storage
      .from("profile-media")
      .upload(path, file, {
        cacheControl: "3600",
        upsert: true,
      });

    if (uploadError) {
      throw uploadError;
    }

    const { data } = supabase.storage
      .from("profile-media")
      .getPublicUrl(path);

    return data.publicUrl;
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    setError("");

    try {
      const publicUrl = await uploadProfileMedia(file, "avatar");
      set("avatar_url", publicUrl);
    } catch (err) {
      setError(err.message || "Avatar upload failed.");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const handleBannerUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingBanner(true);
    setError("");

    try {
      const publicUrl = await uploadProfileMedia(file, "banner");
      set("banner_url", publicUrl);
    } catch (err) {
      setError(err.message || "Banner upload failed.");
    } finally {
      setUploadingBanner(false);
    }
  };

  if (!user) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Sign in to view your profile.</p>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-8 h-8 border-2 border-foreground/20 border-t-foreground rounded-full animate-spin" />
      </div>
    );
  }

  const p = profile;
  const displayBanner = editing ? form.banner_url : p?.banner_url;
  const displayAvatar = editing ? form.avatar_url : p?.avatar_url;

  return (
    <div className="w-full max-w-2xl mx-auto space-y-4 pb-6">
      <div className="flex items-center justify-between gap-2">
        <h1 className="text-xl font-bold font-heading truncate">My Profile</h1>

        {!editing ? (
          <button
            onClick={() => setEditing(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-sm font-medium hover:bg-secondary transition-arena-fast shrink-0"
          >
            <Edit3 size={13} /> Edit
          </button>
        ) : (
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => {
                setEditing(false);
                setError("");
              }}
              className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-arena-fast"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-foreground text-background rounded-lg text-sm font-medium hover:bg-foreground/90 transition-arena-fast disabled:opacity-60"
            >
              {saving ? "Saving..." : saved ? <><Check size={13} /> Saved!</> : "Save"}
            </button>
          </div>
        )}
      </div>

      {error && (
        <div className="arena-card p-3 text-sm text-destructive bg-destructive/10">
          {error}
        </div>
      )}

      <div className="arena-card overflow-hidden">
        <div className="relative h-28 bg-foreground/5">
          {displayBanner ? (
            <img
              src={displayBanner}
              alt="banner"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full ignition-gradient" />
          )}

          {editing && (
            <>
              <button
                type="button"
                onClick={() => bannerInputRef.current?.click()}
                disabled={uploadingBanner}
                className="absolute inset-0 flex items-center justify-center bg-black/30 hover:bg-black/50 transition-arena-fast group"
              >
                {uploadingBanner ? (
                  <span className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <span className="flex items-center gap-1.5 text-white text-xs font-semibold bg-black/40 px-3 py-1.5 rounded-full">
                    <Camera size={13} /> Change Banner
                  </span>
                )}
              </button>

              <input
                ref={bannerInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleBannerUpload}
              />
            </>
          )}
        </div>

        <div className="px-4 pb-4">
          <div className="-mt-8 flex items-end justify-between mb-3">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-card bg-foreground/10 flex items-center justify-center overflow-hidden">
                {displayAvatar ? (
                  <img
                    src={displayAvatar}
                    alt="avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl font-bold text-foreground">
                    {form.display_name?.[0] || user.email?.[0]?.toUpperCase() || "U"}
                  </span>
                )}
              </div>

              {editing && (
                <>
                  <button
                    type="button"
                    onClick={() => avatarInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 w-6 h-6 bg-foreground text-background rounded-full flex items-center justify-center hover:bg-foreground/80 transition-arena-fast shadow"
                  >
                    {uploadingAvatar ? (
                      <span className="w-3 h-3 border border-background/40 border-t-background rounded-full animate-spin" />
                    ) : (
                      <Camera size={11} />
                    )}
                  </button>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarUpload}
                  />
                </>
              )}
            </div>

            <div className="flex items-center gap-1.5 mb-1 flex-wrap justify-end">
              {p?.is_creator && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-ember-light text-ember rounded-full">
                  Creator
                </span>
              )}

              {p?.is_organizer && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-live-light text-live rounded-full">
                  Organizer
                </span>
              )}

              {p?.is_admin && (
                <span className="px-2 py-0.5 text-xs font-semibold bg-secondary text-muted-foreground rounded-full">
                  Admin
                </span>
              )}
            </div>
          </div>

          {!editing ? (
            <div>
              <h2 className="text-lg font-bold leading-tight">
                {p?.display_name || p?.full_name || user.email}
              </h2>

              <p className="text-sm text-muted-foreground mt-0.5">
                @{p?.username || p?.channel_name || user.email?.split("@")[0]}
              </p>

              {p?.bio && (
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
                  {p.bio}
                </p>
              )}

              {p?.country && (
                <p className="text-xs text-muted-foreground mt-1.5">
                  📍 {p.country}
                </p>
              )}

              <div className="flex items-center gap-5 mt-3 text-sm">
                <div>
                  <span className="font-bold">{p?.followers_count || 0}</span>{" "}
                  <span className="text-muted-foreground">Followers</span>
                </div>

                <div>
                  <span className="font-bold">{p?.total_views || 0}</span>{" "}
                  <span className="text-muted-foreground">Views</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Display Name
                  </label>
                  <input
                    value={form.display_name}
                    onChange={(e) => set("display_name", e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-muted-foreground mb-1">
                    Username
                  </label>
                  <input
                    value={form.username}
                    onChange={(e) =>
                      set(
                        "username",
                        e.target.value
                          .toLowerCase()
                          .replace(/\s/g, "")
                          .replace(/[^a-z0-9_]/g, "")
                      )
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Bio
                </label>
                <textarea
                  value={form.bio}
                  onChange={(e) => set("bio", e.target.value)}
                  rows={2}
                  placeholder="Tell people about yourself..."
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-muted-foreground mb-1">
                  Country
                </label>
                <input
                  value={form.country}
                  onChange={(e) => set("country", e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-lg text-sm focus:outline-none bg-background"
                />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="arena-card p-4">
        <h3 className="font-bold text-sm mb-0.5">Role Settings</h3>
        <p className="text-xs text-muted-foreground mb-3">
          Enable roles to unlock additional features.
        </p>

        <div className="space-y-2">
          {[
            {
              key: "is_creator",
              icon: Zap,
              label: "Creator / Streamer",
              desc: "Go live, manage your channel, track analytics.",
              color: "text-ember",
              bg: "bg-ember-light",
            },
            {
              key: "is_organizer",
              icon: Trophy,
              label: "Organizer",
              desc: "Create competitions, manage brackets.",
              color: "text-live",
              bg: "bg-live-light",
            },
          ].map(({ key, icon: Icon, label, desc, color, bg }) => (
            <div
              key={key}
              onClick={() => editing && set(key, !form[key])}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-arena ${
                editing ? "cursor-pointer" : "cursor-default"
              } ${
                (editing ? form[key] : p?.[key])
                  ? "border-foreground bg-foreground/5"
                  : "border-border"
              } ${editing ? "hover:border-foreground/50" : ""}`}
            >
              <div
                className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center shrink-0`}
              >
                <Icon size={16} className={color} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">{label}</p>
                <p className="text-xs text-muted-foreground truncate">{desc}</p>
              </div>

              <div
                className={`w-9 h-5 rounded-full transition-arena flex items-center shrink-0 ${
                  (editing ? form[key] : p?.[key])
                    ? "bg-foreground"
                    : "bg-border"
                }`}
              >
                <div
                  className={`w-3.5 h-3.5 rounded-full bg-white shadow transition-arena mx-0.5 ${
                    (editing ? form[key] : p?.[key])
                      ? "translate-x-4"
                      : "translate-x-0"
                  }`}
                />
              </div>
            </div>
          ))}
        </div>

        {!editing && (
          <p className="text-xs text-muted-foreground mt-2">
            Click "Edit" to change your roles.
          </p>
        )}
      </div>

      <div className="arena-card p-4">
        <h3 className="font-bold text-sm mb-2">Account</h3>

        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-4 py-1.5 border-b border-border/50">
            <span className="text-muted-foreground shrink-0">Email</span>
            <span className="font-medium truncate text-right">{user.email}</span>
          </div>

          <div className="flex justify-between gap-4 py-1.5">
            <span className="text-muted-foreground shrink-0">
              Member since
            </span>
            <span className="font-medium">
              {new Date(user.created_at || Date.now()).toLocaleDateString(
                "en-US",
                {
                  month: "short",
                  year: "numeric",
                }
              )}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
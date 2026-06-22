import { base44 } from '@/api/base44Client';

export async function ensureUserProfile() {
  const me = await base44.auth.me();
  if (!me) return null;

  const existing = await base44.entities.UserProfile.filter({ user_id: me.id }).catch(() => []);
  if (existing.length > 0) return existing[0];

  const emailPrefix = me.email ? me.email.split('@')[0] : 'user';
  const displayName = me.full_name || emailPrefix;

  const profile = await base44.entities.UserProfile.create({
    user_id: me.id,
    display_name: displayName,
    username: emailPrefix,
    avatar_url: '',
    banner_url: '',
    bio: '',
    country: '',
    is_creator: false,
    is_organizer: false,
    is_moderator: false,
    is_admin: false,
    followers_count: 0,
    following_count: 0,
    total_views: 0,
  });

  return profile;
}
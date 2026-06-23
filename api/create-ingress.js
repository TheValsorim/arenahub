import { IngressClient, IngressInput } from "livekit-server-sdk";
import { createClient } from "@supabase/supabase-js";

const requiredEnv = (name) => {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing env variable: ${name}`);
  }
  return value;
};

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const livekitUrl = requiredEnv("LIVEKIT_URL");
    const livekitApiKey = requiredEnv("LIVEKIT_API_KEY");
    const livekitApiSecret = requiredEnv("LIVEKIT_API_SECRET");
    const supabaseUrl = requiredEnv("SUPABASE_URL");
    const supabaseServiceRoleKey = requiredEnv("SUPABASE_SERVICE_ROLE_KEY");

    const authHeader = req.headers.authorization || "";
    const accessToken = authHeader.replace("Bearer ", "");

    if (!accessToken) {
      return res.status(401).json({ error: "Missing auth token" });
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        persistSession: false,
      },
    });

    const { data: userData, error: userError } =
      await supabaseAdmin.auth.getUser(accessToken);

    if (userError || !userData?.user) {
      return res.status(401).json({ error: "Invalid auth token" });
    }

    const user = userData.user;

    const { data: profile, error: profileError } = await supabaseAdmin
      .from("user_profiles")
      .select("is_creator, display_name, full_name, channel_name, username")
      .eq("id", user.id)
      .maybeSingle();

    if (profileError) {
      return res.status(500).json({ error: profileError.message });
    }

    if (!profile?.is_creator) {
      return res.status(403).json({ error: "Creator mode required" });
    }

    const body = req.body || {};
    const title = body.title || "ArenaHub OBS Stream";
    const roomName = body.roomName || `arenahub_obs_${crypto.randomUUID()}`;
    const participantIdentity = `obs_${user.id}_${Date.now()}`;
    const participantName =
      profile.channel_name ||
      profile.username ||
      profile.display_name ||
      profile.full_name ||
      user.email ||
      "OBS Streamer";

    const ingressClient = new IngressClient(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret
    );

    const ingress = await ingressClient.createIngress(
      IngressInput.RTMP_INPUT,
      {
        name: title,
        roomName,
        participantIdentity,
        participantName,
        enableTranscoding: true,
      }
    );

    return res.status(200).json({
      ingressId: ingress.ingressId || ingress.ingress_id,
      roomName: ingress.roomName || roomName,
      url: ingress.url,
      streamKey: ingress.streamKey,
      participantIdentity,
      participantName,
    });
  } catch (error) {
    console.error("Create ingress error:", error);
    return res.status(500).json({
      error: error.message || "Could not create LiveKit ingress",
    });
  }
}
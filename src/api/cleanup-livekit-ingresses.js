import { IngressClient } from "livekit-server-sdk";

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

    const ingressClient = new IngressClient(
      livekitUrl,
      livekitApiKey,
      livekitApiSecret
    );

    const ingresses = await ingressClient.listIngress();

    const arenaHubIngresses = ingresses.filter((ingress) => {
      const name = ingress.name || "";
      const roomName = ingress.roomName || "";
      const participantIdentity = ingress.participantIdentity || "";

      return (
        name.toLowerCase().includes("arenahub") ||
        roomName.startsWith("arenahub_obs_") ||
        roomName.startsWith("arenahub_stream_") ||
        participantIdentity.startsWith("obs_")
      );
    });

    const deleted = [];
    const failed = [];

    for (const ingress of arenaHubIngresses) {
      const ingressId = ingress.ingressId || ingress.ingress_id;

      if (!ingressId) continue;

      try {
        await ingressClient.deleteIngress(ingressId);
        deleted.push({
          ingressId,
          name: ingress.name,
          roomName: ingress.roomName,
        });
      } catch (error) {
        failed.push({
          ingressId,
          name: ingress.name,
          roomName: ingress.roomName,
          error: error.message || "Delete failed",
        });
      }
    }

    return res.status(200).json({
      ok: true,
      foundCount: arenaHubIngresses.length,
      deletedCount: deleted.length,
      failedCount: failed.length,
      deleted,
      failed,
    });
  } catch (error) {
    console.error("Cleanup LiveKit ingresses error:", error);

    return res.status(500).json({
      error: error.message || "Could not clean up LiveKit ingresses",
    });
  }
}
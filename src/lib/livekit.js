// LiveKit Cloud sandbox token helper (MVP testing only).
// The API secret is NEVER exposed in the frontend — the sandbox token server
// issues short-lived participant tokens based on the sandbox ID.

const SANDBOX_ID = 'arenahub-2188st';
const CONNECTION_DETAILS_ENDPOINT = 'https://cloud-api.livekit.io/api/sandbox/connection-details';

/**
 * Fetch a LiveKit server URL + participant token from the sandbox token server.
 * @param {{ roomName: string, participantName: string }} opts
 * @returns {Promise<{ serverUrl: string, token: string }>}
 */
export async function getLiveKitConnection({ roomName, participantName }) {
  const url = new URL(CONNECTION_DETAILS_ENDPOINT);
  if (roomName) url.searchParams.set('roomName', roomName);
  if (participantName) url.searchParams.set('participantName', participantName);

  const res = await fetch(url.toString(), {
    method: 'GET',
    headers: { 'X-Sandbox-ID': SANDBOX_ID },
  });

  if (!res.ok) {
    throw new Error(`LiveKit token request failed (${res.status})`);
  }

  const data = await res.json();
  const serverUrl = data.serverUrl || data.url;
  const token = data.participantToken || data.token;
  if (!serverUrl || !token) {
    throw new Error('LiveKit token server returned an invalid response');
  }
  return { serverUrl, token };
}
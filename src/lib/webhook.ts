import { env } from '../config/env';

export type WebhookEvent = 'ai_tags_saved' | 'asset_restored' | 'brand_updated';

export async function sendWebhook(event: WebhookEvent, payload: Record<string, unknown>) {
  if (!env.N8N_WEBHOOK_URL) return;

  try {
    await fetch(env.N8N_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ event, timestamp: new Date().toISOString(), ...payload }),
    });
  } catch (err) {
    console.error(`Webhook delivery failed for ${event}:`, err);
  }
}

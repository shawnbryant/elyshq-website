// Cloudflare Worker: serves the static site and bridges Lemon Squeezy
// order webhooks into Keygen license creation.
//
// Required Worker config (see wrangler.jsonc "vars" + secrets set via
// `wrangler secret put <NAME>`):
//   KEYGEN_ACCOUNT_ID          (var, e.g. "elysian")
//   KEYGEN_POLICY_ID           (var — the Keygen policy new licenses attach to)
//   KEYGEN_BEARER_TOKEN        (secret — Keygen API token with license:create)
//   LEMON_SQUEEZY_WEBHOOK_SECRET (secret — from Lemon Squeezy webhook settings)
//
// Point the Lemon Squeezy webhook at: https://elyshq.com/webhook
// (event: order_created)

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/webhook") {
      if (request.method !== "POST") {
        return new Response("Method not allowed", { status: 405 });
      }
      return handleWebhook(request, env);
    }

    return env.ASSETS.fetch(request);
  },
};

async function handleWebhook(request, env) {
  const rawBody = await request.text();
  const signature = request.headers.get("X-Signature") || "";

  if (!env.LEMON_SQUEEZY_WEBHOOK_SECRET) {
    console.error("LEMON_SQUEEZY_WEBHOOK_SECRET is not configured; rejecting webhook.");
    return new Response("Webhook not configured", { status: 500 });
  }

  const validSignature = await verifySignature(rawBody, signature, env.LEMON_SQUEEZY_WEBHOOK_SECRET);
  if (!validSignature) {
    console.warn("Invalid Lemon Squeezy webhook signature.");
    return new Response("Unauthorized", { status: 401 });
  }

  let payload;
  try {
    payload = JSON.parse(rawBody);
  } catch (e) {
    return new Response(`Invalid JSON: ${e}`, { status: 400 });
  }

  const eventName = payload?.meta?.event_name;

  if (eventName !== "order_created") {
    return new Response("Event ignored", { status: 200 });
  }

  const data = payload?.data || {};
  const attrs = data.attributes || {};
  const orderId = data.id;
  const userEmail = attrs.user_email;
  const userName = attrs.user_name || "Customer";

  if (!userEmail) {
    return new Response("Customer email not found in payload.", { status: 400 });
  }

  const result = await createKeygenLicense(userEmail, userName, orderId, env);
  if (result.success) {
    return new Response(JSON.stringify({ ok: true, license_key: result.key }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }

  console.error(`Keygen license creation failed for order ${orderId}: ${result.error}`);
  return new Response(JSON.stringify({ ok: false, error: result.error }), {
    status: 500,
    headers: { "Content-Type": "application/json" },
  });
}

async function verifySignature(payload, signatureHex, secret) {
  if (!signatureHex) return false;

  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sigBuf = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  const computedHex = [...new Uint8Array(sigBuf)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  return timingSafeEqual(computedHex, signatureHex);
}

function timingSafeEqual(a, b) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) {
    result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return result === 0;
}

async function createKeygenLicense(email, name, orderId, env) {
  const accountId = env.KEYGEN_ACCOUNT_ID || "elysian";
  const url = `https://api.keygen.sh/v1/accounts/${accountId}/licenses`;

  const body = {
    data: {
      type: "licenses",
      attributes: {
        metadata: {
          customerEmail: email,
          customerName: name,
          lemonSqueezyOrderId: orderId,
        },
      },
      relationships: {
        policy: {
          data: { type: "policies", id: env.KEYGEN_POLICY_ID },
        },
      },
    },
  };

  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/vnd.api+json",
        "Accept": "application/vnd.api+json",
        "Authorization": `Bearer ${env.KEYGEN_BEARER_TOKEN}`,
      },
      body: JSON.stringify(body),
    });

    const resData = await res.json();

    if (!res.ok) {
      const errMsg = resData?.errors?.[0]?.detail || `HTTP error ${res.status}`;
      return { success: false, key: null, license_id: null, error: errMsg };
    }

    const licenseData = resData?.data || {};
    const licenseAttrs = licenseData.attributes || {};
    return {
      success: true,
      key: licenseAttrs.key,
      license_id: licenseData.id,
      error: null,
    };
  } catch (e) {
    return { success: false, key: null, license_id: null, error: String(e) };
  }
}

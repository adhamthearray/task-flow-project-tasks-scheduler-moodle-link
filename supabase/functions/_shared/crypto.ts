import { createCipheriv, createDecipheriv, randomBytes, createHash } from "node:crypto";

const ALGORITHM = "AES-GCM";
const IV_LENGTH = 12;

// --- helpers (NO Buffer) ---
function toHex(bytes: Uint8Array) {
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
}

function fromHex(hex: string) {
  return new Uint8Array(
    hex.match(/.{1,2}/g)!.map(b => parseInt(b, 16))
  );
}

// --- key derivation ---
async function getKey() {
  const secret = Deno.env.get("MOODLE_TOKEN_SECRET");
  if (!secret) throw new Error("MOODLE_TOKEN_SECRET missing");

  const enc = new TextEncoder();

  const keyMaterial = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    "PBKDF2",
    false,
    ["deriveKey"]
  );

  return crypto.subtle.deriveKey(
    {
      name: "PBKDF2",
      salt: enc.encode("taskflow-moodle"),
      iterations: 100_000,
      hash: "SHA-256",
    },
    keyMaterial,
    { name: ALGORITHM, length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// --- encrypt ---
export async function encrypt(text: string) {
  const iv = crypto.getRandomValues(new Uint8Array(IV_LENGTH));
  const key = await getKey();

  const encoded = new TextEncoder().encode(text);

  const encrypted = await crypto.subtle.encrypt(
    { name: ALGORITHM, iv },
    key,
    encoded
  );

  return `${toHex(iv)}:${toHex(new Uint8Array(encrypted))}`;
}

// --- decrypt ---
export async function decrypt(payload: string) {
  const [ivHex, dataHex] = payload.split(":");

  const iv = fromHex(ivHex);
  const data = fromHex(dataHex);
  const key = await getKey();

  const decrypted = await crypto.subtle.decrypt(
    { name: ALGORITHM, iv },
    key,
    data
  );

  return new TextDecoder().decode(decrypted);
}



import fs from 'fs';
import readline from 'readline';
import { createHmac } from 'crypto';

const DEAD_LETTER_PATH = '/Users/forex/.openclaw/mission-control/dead-letter.jsonl';
const CONVEX_SITE_URL = 'https://tame-squirrel-223.convex.site';
const OPENCLAW_HOOK_SECRET = 'b5f5965e36c4f042e04b3edfe9bafb04797933d0edb740195dad5968d7e7f3eb';

function signPayload(payload: string): string {
  const digest = createHmac('sha256', OPENCLAW_HOOK_SECRET).update(payload).digest('hex');
  return `sha256=${digest}`;
}

async function main() {
  if (!fs.existsSync(DEAD_LETTER_PATH)) {
    console.log("No dead letter file found.");
    return;
  }

  const fileStream = fs.createReadStream(DEAD_LETTER_PATH);
  const rl = readline.createInterface({
    input: fileStream,
    crlfDelay: Infinity
  });

  for await (const line of rl) {
    if (!line.trim()) continue;
    try {
        const entry = JSON.parse(line);
        const payload = JSON.stringify(entry.payload);
        const signature = signPayload(payload);

        console.log(`Replaying event ${entry.eventId}...`);
        const res = await fetch(`${CONVEX_SITE_URL}/api/openclaw-hook`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-openclaw-signature': signature,
          },
          body: payload,
        });

        if (res.ok) {
          console.log(`Successfully replayed ${entry.eventId}`);
        } else {
          console.error(`Failed to replay ${entry.eventId}: ${res.status} ${await res.text()}`);
        }
    } catch (e) {
        console.error("Failed to parse line", e);
    }
  }
}

main();

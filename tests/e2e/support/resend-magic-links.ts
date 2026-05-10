interface EmailListItem {
  id: string;
  to: string[];
  created_at: string;
  subject: string;
  [key: string]: unknown;
}

interface EmailDetail {
  html: string;
  [key: string]: unknown;
}

interface FindCallbackUrlOptions {
  recipientEmail: string;
  sentAfter: Date;
  timeoutMs?: number;
  pollIntervalMs?: number;
}

const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_POLL_INTERVAL_MS = 500;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function extractCallbackUrl(html: string): string | null {
  const pattern =
    /https?:\/\/[^"'<>\s]+\/auth\/callback\?[^"'<>\s]+/i;
  const match = html.match(pattern);
  return match ? match[0].replace(/&amp;/g, "&") : null;
}

export class ResendMagicLinks {
  private readonly apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async findCallbackUrl(options: FindCallbackUrlOptions): Promise<string> {
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const pollIntervalMs = options.pollIntervalMs ?? DEFAULT_POLL_INTERVAL_MS;
    const deadline = Date.now() + timeoutMs;
    const normalizedRecipient = normalizeEmail(options.recipientEmail);
    let lastError: unknown;
    let pollCount = 0;

    while (Date.now() < deadline) {
      try {
        const listResponse = await fetch(
          "https://api.resend.com/emails?limit=50",
          {
            headers: {
              Authorization: `Bearer ${this.apiKey}`,
            },
          },
        );

        if (!listResponse.ok) {
          throw new Error(
            `Resend list failed: ${listResponse.status} ${listResponse.statusText}`,
          );
        }

        const listData = (await listResponse.json()) as {
          data: EmailListItem[];
        };
        const allEmails = listData.data ?? [];

        if (pollCount === 0) {
          const sample = allEmails.slice(0, 5).map((e) => ({
            to: e.to,
            created_at: e.created_at,
            subject: e.subject,
          }));
          console.log(
            `[resend-poll] looking for inbox=${normalizedRecipient} after=${options.sentAfter.toISOString()}`,
          );
          console.log(
            `[resend-poll] list returned ${allEmails.length} emails, first 5:`,
            JSON.stringify(sample),
          );
        }

        const candidates = allEmails
          .filter((email) => {
            const createdAt = new Date(email.created_at);
            if (Number.isNaN(createdAt.getTime())) return false;
            if (createdAt < options.sentAfter) return false;
            const recipients = (email.to ?? []).map(normalizeEmail);
            return recipients.includes(normalizedRecipient);
          })
          .sort((a, b) => {
            return (
              new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime()
            );
          });

        for (const candidate of candidates) {
          const getResponse = await fetch(
            `https://api.resend.com/emails/${candidate.id}`,
            {
              headers: {
                Authorization: `Bearer ${this.apiKey}`,
              },
            },
          );

          if (!getResponse.ok) {
            throw new Error(
              `Resend get failed for ${candidate.id}: ${getResponse.status}`,
            );
          }

          const emailDetail = (await getResponse.json()) as EmailDetail;
          const html = typeof emailDetail.html === "string" ? emailDetail.html : "";
          const callbackUrl = extractCallbackUrl(html);

          if (callbackUrl) {
            return callbackUrl;
          }
        }
      } catch (error) {
        lastError = error;
      }

      pollCount++;
      await sleep(pollIntervalMs);
    }

    const suffix =
      lastError instanceof Error ? ` Last error: ${lastError.message}` : "";
    throw new Error(
      `Timed out after ${timeoutMs}ms waiting for auth callback email to ${options.recipientEmail}. ` +
        `Polled ${pollCount} times.${suffix}`,
    );
  }
}

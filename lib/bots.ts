/**
 * Crawler detection for the funnel, by user-agent.
 *
 * Why this exists: `landed` fires from a `useEffect` on mount, and crawlers that
 * render JavaScript (Googlebot among them) run that effect exactly like a person
 * does. Between 2026-07-31 and 2026-08-20, with paid search paused and no other
 * channel live, the events table recorded 265 `landed` against 2 `started`. No
 * real traffic source accounts for 265 human visits in that window, and the
 * 2026-08-15 rename (new domain, resubmitted sitemap, Change of Address) is
 * exactly the event that draws crawlers. A denominator counting robots makes
 * every conversion rate meaningless, and the ad-restart decision is gated on one
 * of those rates.
 *
 * This is deliberately a user-agent check and nothing more. It is not a security
 * control: a determined script can send any UA it likes. It only has to be good
 * enough to keep honest crawlers, which identify themselves by convention, out
 * of the funnel arithmetic.
 */

/**
 * Substrings that identify a non-human client. Matched case-insensitively
 * against the whole user-agent.
 */
const BOT_SUBSTRINGS = [
  // Search engines.
  "googlebot",
  "google-extended",
  "google favicon",
  "storebot-google",
  "bingbot",
  "bingpreview",
  "slurp",
  "duckduckbot",
  "baiduspider",
  "yandexbot",
  "sogou",
  "exabot",
  "petalbot",
  "applebot",
  "ia_archiver",
  // SEO and marketing crawlers. These are the high-volume ones on a new domain.
  "ahrefsbot",
  "semrushbot",
  "mj12bot",
  "dotbot",
  "dataforseobot",
  "seokicks",
  "screaming frog",
  "blexbot",
  "serpstatbot",
  // AI and dataset crawlers.
  "gptbot",
  "chatgpt-user",
  "oai-searchbot",
  "claudebot",
  "anthropic-ai",
  "ccbot",
  "perplexitybot",
  "bytespider",
  "amazonbot",
  "meta-externalagent",
  // Link unfurlers. These fire whenever a URL is pasted into a chat or post,
  // which will happen constantly once Reddit outreach starts.
  "facebookexternalhit",
  "facebot",
  "twitterbot",
  "linkedinbot",
  "slackbot",
  "discordbot",
  "telegrambot",
  "whatsapp",
  "embedly",
  "redditbot",
  // Generic self-identification.
  "crawler",
  "spider",
  "crawling",
  "scrapy",
  // Headless browsers and testing tools, including our own smoke tests.
  "headlesschrome",
  "phantomjs",
  "puppeteer",
  "playwright",
  "lighthouse",
  "chrome-lighthouse",
  "pagespeed",
  // Uptime and monitoring pollers.
  "pingdom",
  "uptimerobot",
  "statuscake",
  "site24x7",
  "newrelicpinger",
  "vercel-screenshot",
  "vercelbot",
  // Plain HTTP clients. A browser never sends these.
  "curl/",
  "wget/",
  "python-requests",
  "python-urllib",
  "go-http-client",
  "okhttp",
  "node-fetch",
  "axios/",
  "libwww-perl",
  "java/",
  "httpclient",
];

/**
 * Matches "bot" only where it stands as its own word, so "Some Bot/1.0" is
 * caught while the CUBOT and ABBOT Android phone brands are not. Traffic here is
 * mostly mobile, which makes discarding a real phone the expensive mistake.
 */
const STANDALONE_BOT = /(^|[^a-z])bot([^a-z]|$)/i;

/**
 * True when the user-agent belongs to a crawler, headless browser, or script
 * rather than a person.
 *
 * A missing or blank user-agent counts as a bot: every real browser sends one,
 * so its absence means a script.
 */
export function isBotUserAgent(userAgent: string | null | undefined): boolean {
  if (userAgent == null) return true;
  const ua = userAgent.trim().toLowerCase();
  if (ua.length === 0) return true;
  if (BOT_SUBSTRINGS.some((token) => ua.includes(token))) return true;
  return STANDALONE_BOT.test(ua);
}

/**
 * The `src` value recorded for a request that failed the check above.
 *
 * Bot events are stored rather than dropped. Storing them costs one row, keeps
 * the decision reversible, and makes the filter auditable: `SELECT count(*) FROM
 * events WHERE src = 'bot'` says how much of the traffic was never human. The
 * funnel report hides this `src` by default, the same mechanism that already
 * hides our own smoke tests, so no schema migration is needed to benefit.
 */
export const BOT_SRC = "bot";

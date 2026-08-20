import { describe, it, expect } from "vitest";
import { isBotUserAgent } from "./bots";

/** Real user-agent strings. Kept verbatim so a future edit to the matcher is
 *  checked against what browsers and crawlers actually send, not paraphrases. */
const REAL_BROWSERS = [
  // iPhone Safari, the single most likely visitor for this product.
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1",
  // Android Chrome.
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Mobile Safari/537.36",
  // Desktop Chrome on macOS.
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
  // Desktop Firefox on Windows.
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:126.0) Gecko/20100101 Firefox/126.0",
  // Instagram's in-app browser, which is how a lot of social traffic arrives.
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Mobile/15E148 Instagram 331.0.0.36.90",
];

const CRAWLERS = [
  "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)",
  "Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko; compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm) Chrome/116.0.0.0 Safari/537.36",
  "Mozilla/5.0 (compatible; AhrefsBot/7.0; +http://ahrefs.com/robot/)",
  "Mozilla/5.0 (compatible; SemrushBot/7~bl; +http://www.semrush.com/bot.html)",
  "Mozilla/5.0 (compatible; YandexBot/3.0; +http://yandex.com/bots)",
  "Mozilla/5.0 (compatible; Bytespider; spider-feedback@bytedance.com)",
  "Mozilla/5.0 (compatible; GPTBot/1.2; +https://openai.com/gptbot)",
  "Mozilla/5.0 (compatible; ClaudeBot/1.0; +claudebot@anthropic.com)",
  "Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/perplexitybot)",
  "facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)",
  "Twitterbot/1.0",
  "Slackbot-LinkExpanding 1.0 (+https://api.slack.com/robots)",
  "Mozilla/5.0 (compatible; DotBot/1.2; +https://opensiteexplorer.org/dotbot)",
];

const HEADLESS_AND_TOOLS = [
  "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/125.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36 Lighthouse",
  "curl/8.4.0",
  "Wget/1.21.4",
  "python-requests/2.31.0",
  "Go-http-client/2.0",
  "node-fetch/1.0 (+https://github.com/bitinn/node-fetch)",
];

describe("isBotUserAgent", () => {
  it.each(REAL_BROWSERS)("treats a real browser as human: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(false);
  });

  it.each(CRAWLERS)("flags a crawler: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  it.each(HEADLESS_AND_TOOLS)("flags a headless browser or http client: %s", (ua) => {
    expect(isBotUserAgent(ua)).toBe(true);
  });

  /** A browser always sends a user-agent. A request without one is a script,
   *  and counting it as a visitor is what inflated `landed`. */
  it("flags a missing or empty user-agent", () => {
    expect(isBotUserAgent(null)).toBe(true);
    expect(isBotUserAgent("")).toBe(true);
    expect(isBotUserAgent("   ")).toBe(true);
  });

  /** CUBOT is a real Android phone brand, so a naive substring match on "bot"
   *  would silently discard real mobile visitors. Mobile is most of this
   *  product's traffic, which makes this the expensive false positive. */
  it("does not flag phone brands that merely contain the letters bot", () => {
    const cubot =
      "Mozilla/5.0 (Linux; Android 11; CUBOT_NOTE_20) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/98.0.4758.101 Mobile Safari/537.36";
    expect(isBotUserAgent(cubot)).toBe(false);
  });

  it("flags a bare bot token used as its own word", () => {
    expect(isBotUserAgent("SomeService Bot/1.0 (+http://example.com)")).toBe(true);
  });

  it("is case insensitive", () => {
    expect(isBotUserAgent("MOZILLA/5.0 (COMPATIBLE; GOOGLEBOT/2.1)")).toBe(true);
  });
});

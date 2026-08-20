/**
 * Google Ads campaign assets for the September restart, with the length limits
 * Google enforces checked here rather than discovered in the editor.
 *
 * Copy rules applied (from CLAUDE.md, non-negotiable):
 *   - No outcome-promising language. No "win", "guaranteed", "get your money back".
 *     Only "may", "can", "commonly contestable".
 *   - No em or en dashes.
 *   - We are not a law firm and must never imply otherwise.
 *
 * Run: node scripts/gads-assets.mjs
 */

const LIMITS = { headline: 30, description: 90, sitelinkText: 25, sitelinkDesc: 35, callout: 25 };

const headlines = [
  "Landlord Kept Your Deposit?",
  "Deposit Not Returned Yet?",
  "MA Security Deposit Help",
  "Massachusetts Renters",
  "Free Deposit Check",
  "Check Your Deposit Free",
  "See What You May Be Owed",
  "Answer 6 Quick Questions",
  "Free Analysis, No Signup",
  "Built on M.G.L. c.186 15B",
  "MA Law May Owe You More",
  "Demand Letter in Minutes",
  "Certified Mail Included",
  "No Account Needed",
  "Takes About Two Minutes",
];

const descriptions = [
  "Answer six questions about your Massachusetts security deposit. Free, no signup needed.",
  "See which parts of M.G.L. c.186 15B may apply to you. Instant and free to check.",
  "Optional $49 kit adds a demand letter we mail certified. Legal info, not legal advice.",
  "For Massachusetts renters. Works on your phone in about two minutes.",
];

const sitelinks = [
  {
    text: "How We Calculate",
    desc1: "What we count, and what we do not",
    desc2: "Our arithmetic, shown in full",
    url: "/guide/how-we-calculate-your-claim?src=gads",
  },
  {
    text: "The 30 Day Deadline",
    desc1: "What happens after 30 days pass",
    desc2: "M.G.L. c.186 15B(4) explained",
    url: "/guide/landlord-didnt-return-security-deposit-30-days-massachusetts?src=gads",
  },
  {
    text: "Wear and Tear Rules",
    desc1: "What a landlord may not charge for",
    desc2: "Includes the 2025 Peebles ruling",
    url: "/guide/normal-wear-and-tear-vs-damage-massachusetts?src=gads",
  },
  {
    text: "Cleaning Charges",
    desc1: "When a cleaning fee is contestable",
    desc2: "Lease clauses that may be void",
    url: "/guide/professional-cleaning-charge-security-deposit-massachusetts?src=gads",
  },
];

const callouts = [
  "Free Analysis",
  "No Account Needed",
  "Massachusetts Only",
  "Statute Citations",
  "Works On Mobile",
];

// Exact match only. July ran phrase match against a spec that said exact, and
// that is where a large part of the money went.
const keywordsExact = [
  "landlord not returning security deposit",
  "landlord won't give back security deposit",
  "landlord kept my security deposit",
  "landlord did not return deposit",
  "landlord keeping security deposit",
  "how to get security deposit back from landlord",
  "landlord won't return deposit massachusetts",
  "security deposit not returned 30 days",
];

// Block informational intent, which is what drained July: the single largest
// line of spend went to "massachusetts security deposit law" at 3.50% CTR.
const negativeKeywords = [
  "law", "laws", "legal", "legislation", "statute", "code",
  "interest", "calculator", "calculate",
  "rules", "rights", "guide", "how does",
  "template", "sample", "example", "form", "pdf", "free",
  "lawyer", "attorney", "firm",
  "landlord rights", "for landlords", "as a landlord",
  "job", "jobs", "salary",
];

function check(label, items, limit, key = null) {
  let bad = 0;
  console.log(`\n${label} (limit ${limit})`);
  for (const item of items) {
    const text = key ? item[key] : item;
    const n = text.length;
    const flag = n > limit ? "OVER" : "ok";
    if (n > limit) bad++;
    console.log(`  [${String(n).padStart(2)}] ${flag === "OVER" ? "!! " : "   "}${text}`);
  }
  if (bad) console.log(`  ${bad} OVER LIMIT`);
  return bad;
}

let over = 0;
over += check("HEADLINES", headlines, LIMITS.headline);
over += check("DESCRIPTIONS", descriptions, LIMITS.description);
over += check("SITELINK TEXT", sitelinks, LIMITS.sitelinkText, "text");
over += check("SITELINK DESC 1", sitelinks, LIMITS.sitelinkDesc, "desc1");
over += check("SITELINK DESC 2", sitelinks, LIMITS.sitelinkDesc, "desc2");
over += check("CALLOUTS", callouts, LIMITS.callout);

// The copy rules are enforced, not just documented.
const allCopy = [...headlines, ...descriptions, ...callouts, ...sitelinks.flatMap((s) => [s.text, s.desc1, s.desc2])];
const dashes = allCopy.filter((t) => /[–—]/.test(t));
const promises = allCopy.filter((t) => /\b(guarantee|guaranteed|win|will get|get your money back|recover your)\b/i.test(t));

console.log("\nCOPY RULE CHECKS");
console.log(`  em/en dashes:            ${dashes.length === 0 ? "none" : dashes.join(" | ")}`);
console.log(`  outcome promises:        ${promises.length === 0 ? "none" : promises.join(" | ")}`);
console.log(`  length violations:       ${over === 0 ? "none" : over}`);

console.log("\nKEYWORDS (add as EXACT match, i.e. [in square brackets])");
keywordsExact.forEach((k) => console.log(`  [${k}]`));

console.log("\nNEGATIVE KEYWORDS (add as broad negatives at campaign level)");
console.log("  " + negativeKeywords.join(", "));

console.log("\nFINAL URL for all ads:  https://slatebell.com/?src=gads");
console.log("SITELINK URLs:");
sitelinks.forEach((s) => console.log(`  ${s.text}: https://slatebell.com${s.url}`));

process.exit(over === 0 && dashes.length === 0 && promises.length === 0 ? 0 : 1);

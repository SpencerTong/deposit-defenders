export interface GuideSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface GuideArticle {
  slug: string;
  title: string;
  metaDescription: string;
  updated: string;
  intro: string;
  sections: GuideSection[];
  ctaHeading: string;
  ctaBody: string;
  ctaHref: string;
  ctaLabel: string;
}

export const guideArticles: GuideArticle[] = [
  {
    slug: "massachusetts-security-deposit-law",
    title: "Massachusetts Security Deposit Law: What Every Renter Should Know",
    metaDescription:
      "A plain-English guide to Massachusetts security deposit law under M.G.L. c. 186 §15B — deposit limits, receipts, itemized deductions, interest, and penalties for landlords who get it wrong.",
    updated: "2026-07-07",
    intro:
      "Massachusetts has one of the strictest security deposit laws in the country. M.G.L. c. 186, §15B spells out exactly what a landlord can charge, how they must hold and account for a deposit, and what happens if they don't follow the rules. Here's what the statute actually requires.",
    sections: [
      {
        heading: "How much can a landlord charge for a security deposit?",
        paragraphs: [
          "A landlord cannot require a security deposit of more than one month's rent. If you paid more than that, the excess amount is recoverable, separate from any other violation.",
        ],
      },
      {
        heading: "What your landlord must do once they have your deposit",
        paragraphs: [
          "Massachusetts law imposes several specific obligations on landlords holding a tenant's deposit:",
        ],
        list: [
          "Escrow receipt: within 30 days of receiving the deposit, the landlord must give you a receipt stating the name of the bank and the account number where the deposit is being held.",
          "Separate, interest-bearing account: the deposit must be held in a Massachusetts bank account, separate from the landlord's own money.",
          "Statement of condition: within 10 days of the start of the tenancy, the landlord must give you a written statement of the condition of the apartment, and give you a chance to note any damage you disagree with.",
          "Annual interest: if you've held the tenancy for a year or more, the landlord owes you 5% annual interest on the deposit (or the actual bank interest earned, if the lease says so).",
        ],
      },
      {
        heading: "When you move out: itemized deductions and the 30-day deadline",
        paragraphs: [
          "If a landlord wants to keep any part of your deposit for damages, they must give you an itemized list of the damage, sworn to under pains and penalties of perjury, within 30 days of the end of your tenancy. Ordinary wear and tear — things like minor scuffing, faded paint, or general aging of the unit — cannot be deducted.",
          "If the landlord doesn't provide a valid, timely, sworn itemized list, they generally forfeit the right to keep any part of the deposit for damages. Either way, whatever balance you're entitled to must be returned within 30 days of the tenancy ending.",
        ],
      },
      {
        heading: "What happens if your landlord breaks these rules?",
        paragraphs: [
          "The penalties depend on which requirement was violated. Some violations — like failing to provide the bank escrow receipt, or failing to return the balance you're owed within 30 days — can expose a landlord to treble (3x) damages, plus court costs and reasonable attorney's fees, under §15B(7). Other violations, like charging more than one month's rent or failing to pay required interest, are separately recoverable but don't carry the treble-damages remedy on their own.",
          "This is general information about what the statute allows, not a prediction about any individual case — whether these remedies apply depends on the specific facts.",
        ],
      },
      {
        heading: "What to do if you think your landlord violated the law",
        paragraphs: [
          "The usual first step is a written demand letter that lays out the facts, cites the specific violations, and gives your landlord a deadline to respond before you consider small claims court. See our guide to writing a Massachusetts security deposit demand letter for what to include and how to send it.",
        ],
      },
    ],
    ctaHeading: "Check your own situation for free",
    ctaBody:
      "Answer a few questions about your deposit and we'll tell you what the law says you may be owed — no account required.",
    ctaHref: "/",
    ctaLabel: "Check my deposit — it's free",
  },
  {
    slug: "security-deposit-demand-letter-massachusetts",
    title: "How to Write a Security Deposit Demand Letter in Massachusetts",
    metaDescription:
      "How to write and send a Massachusetts security deposit demand letter: what to include, how to send it by certified mail, and what happens next if your landlord doesn't respond.",
    updated: "2026-07-07",
    intro:
      "If your landlord hasn't returned your security deposit — or kept part of it without following the rules in M.G.L. c. 186, §15B — a written demand letter is usually the right first step before small claims court. Here's how to write one.",
    sections: [
      {
        heading: "When should you send a demand letter?",
        paragraphs: [
          "Common triggers include: it's been more than 30 days since you moved out and you haven't gotten your deposit back, your landlord never sent a bank receipt for the escrowed deposit, or you received an itemized list of deductions that was late, unsworn, or full of ordinary wear-and-tear charges. For a full rundown of the underlying rules, see our guide to Massachusetts security deposit law.",
        ],
      },
      {
        heading: "What to include in the letter",
        paragraphs: ["A solid demand letter is factual and specific. At a minimum, it should include:"],
        list: [
          "Your name and address, your landlord's name and address, and the rental property address",
          "The dates of your tenancy and the amount of your deposit",
          "The specific requirement(s) of §15B your landlord didn't meet, with citations",
          "The exact dollar amount you're demanding",
          "A clear deadline to respond — 10 business days is a common, reasonable window",
          "A statement that you're prepared to pursue small claims court remedies, which can include treble damages, interest, court costs, and attorney's fees under §15B(7), if the deadline passes without payment",
        ],
      },
      {
        heading: "Keep the tone firm, not threatening",
        paragraphs: [
          "State the facts and the law plainly. Avoid guarantees about how a court will rule — say what the law allows ('may be entitled to,' 'can expose the landlord to'), not what's certain to happen.",
        ],
      },
      {
        heading: "How to send it",
        paragraphs: [
          "Send your letter by certified mail with return receipt requested. This gives you a dated record that your landlord actually received it, which matters if you end up in court. Keep a copy of exactly what you sent, along with your mailing receipt and tracking number.",
        ],
      },
      {
        heading: "What happens after you send it",
        paragraphs: [
          "Your landlord has until the deadline you set to respond or pay. If they don't, small claims court is designed for cases like this and doesn't require a lawyer. In Massachusetts, small claims generally covers claims of $7,000 or less, with tiered filing fees (roughly $40–$150 depending on the amount, though you should confirm the current fee with the court). You file a \"Statement of Small Claim and Notice\" in the District Court, Boston Municipal Court, or Housing Court location tied to where you live, where your landlord does business, or where the rental property is located.",
        ],
      },
    ],
    ctaHeading: "Skip the blank page",
    ctaBody:
      "Answer a few questions and we'll generate a free demand letter tailored to your situation, ready to send.",
    ctaHref: "/",
    ctaLabel: "Generate my free letter",
  },
];

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((article) => article.slug === slug);
}

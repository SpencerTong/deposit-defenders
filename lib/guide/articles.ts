export interface GuideSection {
  heading?: string;
  paragraphs: string[];
  list?: string[];
}

export interface GuideFaq {
  question: string;
  answer: string;
}

export interface GuideArticle {
  slug: string;
  title: string;
  metaDescription: string;
  updated: string;
  intro: string;
  sections: GuideSection[];
  faq?: GuideFaq[];
  /** Slugs of related guides, rendered as "Keep reading" links. */
  related?: string[];
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
      "A plain-English guide to Massachusetts security deposit law under M.G.L. c. 186 §15B: deposit limits, receipts, itemized deductions, interest, and penalties for landlords who get it wrong.",
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
          "If a landlord wants to keep any part of your deposit for damages, they must give you an itemized list of the damage, sworn to under pains and penalties of perjury, within 30 days of the end of your tenancy. Ordinary wear and tear, meaning things like minor scuffing, faded paint, or general aging of the unit, cannot be deducted.",
          "If the landlord doesn't provide a valid, timely, sworn itemized list, they generally forfeit the right to keep any part of the deposit for damages. Either way, whatever balance you're entitled to must be returned within 30 days of the tenancy ending.",
        ],
      },
      {
        heading: "What happens if your landlord breaks these rules?",
        paragraphs: [
          "The penalties depend on which requirement was violated. Some violations, like failing to provide the bank escrow receipt or failing to return the balance you're owed within 30 days, can expose a landlord to treble (3x) damages, plus court costs and reasonable attorney's fees, under §15B(7). Other violations, like charging more than one month's rent or failing to pay required interest, are separately recoverable but don't carry the treble-damages remedy on their own.",
          "This is general information about what the statute allows, not a prediction about any individual case. Whether these remedies apply depends on the specific facts.",
        ],
      },
      {
        heading: "What to do if you think your landlord violated the law",
        paragraphs: [
          "The usual first step is a written demand letter that lays out the facts, cites the specific violations, and gives your landlord a deadline to respond before you consider small claims court. See our guide to writing a Massachusetts security deposit demand letter for what to include and how to send it.",
        ],
      },
    ],
    faq: [
      {
        question: "How much can a landlord charge for a security deposit in Massachusetts?",
        answer:
          "No more than one month's rent. If you paid more, the excess is recoverable under M.G.L. c. 186, §15B(1)(b), separate from any other violation.",
      },
      {
        question: "How long does a Massachusetts landlord have to return a security deposit?",
        answer:
          "The balance you're owed must be returned within 30 days of the end of your tenancy, along with any required itemized list of deductions, under §15B(4).",
      },
      {
        question: "What happens if a landlord doesn't follow the deposit rules?",
        answer:
          "It depends on the rule. Some violations, like failing to return the balance within 30 days or failing to hold the deposit in a proper escrow account, can expose the landlord to treble (3x) damages plus court costs and attorney's fees under §15B(7). Others, like overcharging or unpaid interest, are separately recoverable.",
      },
    ],
    related: [
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
      "security-deposit-demand-letter-massachusetts",
      "treble-damages-security-deposit-massachusetts",
    ],
    ctaHeading: "Check your own situation for free",
    ctaBody:
      "Answer a few questions about your deposit and we'll tell you what the law says you may be owed. No account required.",
    ctaHref: "/",
    ctaLabel: "Check my deposit for free",
  },
  {
    slug: "security-deposit-demand-letter-massachusetts",
    title: "How to Write a Security Deposit Demand Letter in Massachusetts",
    metaDescription:
      "How to write and send a Massachusetts security deposit demand letter: what to include, how to send it by certified mail, and what happens next if your landlord doesn't respond.",
    updated: "2026-07-07",
    intro:
      "If your landlord hasn't returned your security deposit, or kept part of it without following the rules in M.G.L. c. 186, §15B, a written demand letter is usually the right first step before small claims court. Here's how to write one.",
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
          "A clear deadline to respond (10 business days is a common, reasonable window)",
          "A statement that you're prepared to pursue small claims court remedies, which can include treble damages, interest, court costs, and attorney's fees under §15B(7), if the deadline passes without payment",
        ],
      },
      {
        heading: "Keep the tone firm, not threatening",
        paragraphs: [
          "State the facts and the law plainly. Avoid guarantees about how a court will rule. Say what the law allows ('may be entitled to,' 'can expose the landlord to'), not what's certain to happen.",
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
          "Your landlord has until the deadline you set to respond or pay. If they don't, small claims court is designed for cases like this and doesn't require a lawyer. In Massachusetts, small claims generally covers claims of $7,000 or less, with tiered filing fees (roughly $40 to $150 depending on the amount, though you should confirm the current fee with the court). You file a \"Statement of Small Claim and Notice\" in the District Court, Boston Municipal Court, or Housing Court location tied to where you live, where your landlord does business, or where the rental property is located.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need a lawyer to write a security deposit demand letter?",
        answer:
          "No. A demand letter just needs to state the facts, cite the specific §15B requirements that weren't met, name a dollar amount, and set a response deadline. Many tenants write and send one themselves.",
      },
      {
        question: "How should I send a demand letter to my landlord?",
        answer:
          "Certified mail with return receipt requested. It creates dated proof your landlord received the letter, which matters if the dispute ends up in small claims court.",
      },
    ],
    related: [
      "massachusetts-security-deposit-law",
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
      "small-claims-court-security-deposit-massachusetts",
    ],
    ctaHeading: "Skip the blank page",
    ctaBody:
      "Answer a few questions and we'll generate a free demand letter tailored to your situation, ready to send.",
    ctaHref: "/",
    ctaLabel: "Generate my free letter",
  },
  {
    slug: "landlord-didnt-return-security-deposit-30-days-massachusetts",
    title: "Landlord Didn't Return Your Security Deposit Within 30 Days? What Massachusetts Law Says",
    metaDescription:
      "Massachusetts landlords must return your security deposit balance within 30 days of the end of your tenancy. Miss the deadline and M.G.L. c. 186 §15B can expose them to treble damages, court costs, and attorney's fees.",
    updated: "2026-07-08",
    intro:
      "The 30-day deadline is the sharpest edge in Massachusetts security deposit law. If your tenancy has ended and more than 30 days have passed without your deposit, or the balance you're owed, coming back, M.G.L. c. 186, §15B gives you real leverage. Here's how the rule works and what to do next.",
    sections: [
      {
        heading: "The 30-day rule",
        paragraphs: [
          "Under §15B(4), your landlord must return your security deposit, minus any lawful deductions, within 30 days after the end of your tenancy. Lawful deductions are limited: unpaid rent, unpaid real estate tax increases you agreed to in the lease, and the cost to repair damage beyond reasonable wear and tear. Damage deductions only count if you received an itemized list, sworn under pains and penalties of perjury, within that same 30-day window.",
          "These are calendar days, not business days, and the clock starts when your tenancy ends, typically your lease end date or the agreed move-out date.",
        ],
      },
      {
        heading: "What counts as the end of your tenancy?",
        paragraphs: [
          "For a fixed lease, it's usually the lease's end date. For month-to-month tenancies, it's the date the tenancy was properly terminated, for example the end of the rental period named in a 30-day notice to quit. If you moved out early but the lease ran on, the question can get more complicated; the safest reference point is the date the tenancy legally ended, not just the day you handed back the keys.",
        ],
      },
      {
        heading: "What happens when the deadline is missed",
        paragraphs: [
          "Failing to return the balance you're owed within 30 days is one of the specific violations, §15B(6)(e), that forfeits the landlord's right to keep any part of the deposit. It's also one of the violations that can trigger the statute's strongest remedy: under §15B(7), a court may award three times the amount wrongfully withheld, plus 5% interest from when payment became due, plus court costs and reasonable attorney's fees.",
          "That combination is why a well-documented demand letter often gets results: the downside for a landlord who ignores it can be much larger than the deposit itself.",
        ],
      },
      {
        heading: "What if the landlord returned part of it?",
        paragraphs: [
          "A partial refund doesn't reset anything. Whatever balance you're lawfully owed is still due within 30 days. If deductions were taken without a timely, sworn, itemized list, or for things that are really ordinary wear and tear, those deductions may not hold up, and the remaining balance may still be recoverable with the same §15B(7) exposure.",
        ],
      },
      {
        heading: "What to do now",
        paragraphs: [
          "Start with a written demand letter: state the facts, cite §15B(4), §15B(6)(e), and §15B(7), name the amount, and give a 10-business-day deadline. Send it certified mail with return receipt. If the deadline passes, Massachusetts small claims court handles exactly this kind of case, and no lawyer is required.",
        ],
      },
    ],
    faq: [
      {
        question: "Does the 30-day deadline include weekends and holidays?",
        answer:
          "The statute counts 30 days from the end of the tenancy without carving out weekends or holidays, so treat it as calendar days.",
      },
      {
        question: "My landlord offered a partial refund. Should I take it?",
        answer:
          "That's your call. Accepting a partial payment doesn't automatically waive your right to pursue the rest, but be careful about signing anything that releases your claims. The balance you're lawfully owed remains due.",
      },
      {
        question: "Can I really recover three times my deposit?",
        answer:
          "The statute may allow treble damages on the amount wrongfully withheld when the 30-day return rule is violated, plus interest, court costs, and attorney's fees under §15B(7). Whether that applies depends on the specific facts. It's an exposure, not a guarantee.",
      },
    ],
    related: [
      "treble-damages-security-deposit-massachusetts",
      "security-deposit-demand-letter-massachusetts",
      "small-claims-court-security-deposit-massachusetts",
    ],
    ctaHeading: "Is your landlord past the deadline?",
    ctaBody:
      "Answer a few questions and we'll analyze your situation under §15B and generate a free demand letter, ready to send.",
    ctaHref: "/",
    ctaLabel: "Check my deposit for free",
  },
  {
    slug: "treble-damages-security-deposit-massachusetts",
    title: "Treble Damages in Massachusetts Security Deposit Cases: When 3x Applies",
    metaDescription:
      "Not every security deposit violation triggers treble damages in Massachusetts. Here's exactly which M.G.L. c. 186 §15B violations can lead to 3x damages, interest, court costs, and attorney's fees, and which can't.",
    updated: "2026-07-08",
    intro:
      "\"Treble damages\" is the phrase that gets landlords' attention, and it's often misunderstood. Massachusetts law doesn't triple every security deposit claim. M.G.L. c. 186, §15B(7) names specific violations that carry the 3x remedy. Knowing which side of the line your situation falls on is the difference between a strong demand letter and an overreaching one.",
    sections: [
      {
        heading: "What §15B(7) actually provides",
        paragraphs: [
          "When it applies, §15B(7) says the tenant shall be awarded damages in an amount equal to three times the amount of the deposit (or the balance wrongfully withheld), plus 5% interest from the date the obligation arose, together with court costs and reasonable attorney's fees. It's one of the few Massachusetts consumer statutes with a mandatory fee-shifting provision, which is why even small deposit cases get attorneys' attention.",
        ],
      },
      {
        heading: "The violations that trigger treble damages",
        paragraphs: [
          "Section 15B(7) applies to three specific failures, listed in §15B(6) clauses (a), (d), and (e):",
        ],
        list: [
          "§15B(6)(a): failing to deposit the money in a separate, interest-bearing Massachusetts escrow account as §15B(3) requires, which includes failing to give you the bank receipt with the account details within 30 days.",
          "§15B(6)(d): failing to return the deposit or balance after the landlord loses the right to hold it.",
          "§15B(6)(e): failing to return the deposit or lawful balance within 30 days after the tenancy ends.",
        ],
      },
      {
        heading: "The violations that do NOT triple on their own",
        paragraphs: [
          "A late, missing, or unsworn itemized list of damages (§15B(6)(b)) forfeits the landlord's right to keep deductions, but by itself it doesn't trigger treble damages. The treble exposure appears when that forfeiture leaves a balance the landlord then fails to return within 30 days, which is a (6)(e) violation.",
          "Similarly, collecting more than one month's rent as a deposit (§15B(1)(b)) and failing to pay annual interest (§15B(3)(b)) are real violations with recoverable amounts, but the statute doesn't attach the 3x remedy to them alone.",
        ],
      },
      {
        heading: "Treble damages and the small claims limit",
        paragraphs: [
          "Massachusetts small claims court generally handles claims up to $7,000. But when a statute provides multiple damages, as §15B(7) does, the award may exceed that cap as long as the actual damages fit within it. A $3,000 deposit wrongfully withheld can support a small claims case even though trebling could put the award at $9,000 or more.",
        ],
      },
    ],
    faq: [
      {
        question: "Is treble damages automatic if my landlord missed the 30-day deadline?",
        answer:
          "No award is automatic. You'd need to bring the claim and prove the violation. But for the violations named in §15B(7), courts have treated the treble remedy as mandatory once the violation is established, which is significant leverage in a demand letter.",
      },
      {
        question: "My landlord never gave me a bank receipt. Does that trigger 3x?",
        answer:
          "Failing to properly escrow the deposit and provide the receipt required by §15B(3)(a) is a §15B(6)(a) violation, which is one of the treble-damages triggers under §15B(7). Whether it applies depends on your specific facts.",
      },
      {
        question: "Can I get attorney's fees in small claims court?",
        answer:
          "§15B(7) provides for court costs and reasonable attorney's fees when it applies. Many tenants handle small claims without a lawyer, in which case the fee-shifting matters less, but the exposure still strengthens your position.",
      },
    ],
    related: [
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
      "no-statement-of-condition-bank-receipt-massachusetts",
      "small-claims-court-security-deposit-massachusetts",
    ],
    ctaHeading: "Does 3x apply to your deposit?",
    ctaBody:
      "Answer a few questions and we'll check which §15B rules your landlord may have broken and what your claim could be worth.",
    ctaHref: "/",
    ctaLabel: "Check my deposit for free",
  },
  {
    slug: "normal-wear-and-tear-vs-damage-massachusetts",
    title: "Normal Wear and Tear vs. Damage: What Massachusetts Landlords Can Deduct",
    metaDescription:
      "Massachusetts landlords can't deduct ordinary wear and tear from your security deposit. Here's where the line falls (cleaning, painting, carpets, nail holes) and the sworn itemized list M.G.L. c. 186 §15B requires.",
    updated: "2026-07-08",
    intro:
      "Most security deposit fights come down to one question: was it damage, or was it just living there? Massachusetts law answers more of that question than most tenants realize. Under M.G.L. c. 186, §15B(4), a landlord can only deduct for damage beyond \"reasonable wear and tear,\" and only with a sworn, itemized list delivered on time.",
    sections: [
      {
        heading: "What the statute allows landlords to deduct",
        paragraphs: [
          "Under §15B(4), deductions from a security deposit are limited to three things: unpaid rent (not lawfully withheld), unpaid increases in real estate taxes you were obligated to pay under the lease, and the reasonable cost of repairing damage caused by the tenant or their guests, expressly excluding reasonable wear and tear.",
        ],
      },
      {
        heading: "Deductions that are commonly contestable as wear and tear",
        paragraphs: [
          "These charges show up on deduction lists constantly, and tenants commonly contest them as ordinary wear and tear (whether they hold up always depends on the specific condition):",
        ],
        list: [
          "Routine cleaning charges after a broom-clean move-out",
          "Repainting after several years of tenancy, or touch-ups for scuffed walls",
          "Carpet shampooing or replacing carpet worn from normal foot traffic",
          "Small nail or thumbtack holes from hanging pictures",
          "Faded paint, curtains, or flooring from sunlight and age",
        ],
      },
      {
        heading: "What may be legitimate damage",
        paragraphs: [
          "On the other side of the line: broken windows or fixtures, holes in walls or doors, burns, pet stains and pet damage, smoke damage, water damage from tenant negligence, and missing items. Deductions like these may be legitimate if they're documented and itemized the way the statute requires.",
        ],
      },
      {
        heading: "No sworn itemized list, no deductions",
        paragraphs: [
          "Even a legitimate damage deduction fails if the paperwork does: §15B(4) requires an itemized list of damages, sworn to under the pains and penalties of perjury, with written documentation like estimates or bills, delivered within 30 days of the end of the tenancy. Miss any of that, and §15B(6)(b) forfeits the landlord's right to keep any portion of the deposit for damages. If the resulting balance isn't returned within 30 days, the treble-damages exposure of §15B(7) can follow.",
        ],
      },
    ],
    faq: [
      {
        question: "Can my landlord charge a standard cleaning fee?",
        answer:
          "Massachusetts law doesn't recognize automatic cleaning fees taken from a security deposit. Cleaning charges are commonly contested as ordinary wear and tear unless the unit was left genuinely beyond normal move-out condition, and any deduction still requires the sworn, itemized list.",
      },
      {
        question: "I lived there three years. Can they charge me to repaint?",
        answer:
          "Repainting after a multi-year tenancy is one of the most commonly contested deductions, since paint wears in the normal course of living. Deteriorating paint from ordinary use is generally wear and tear, not tenant damage.",
      },
      {
        question: "What proof does my landlord need for a deduction?",
        answer:
          "An itemized list sworn under the pains and penalties of perjury, with written evidence such as estimates, bills, invoices, or receipts, delivered within 30 days of the end of the tenancy (§15B(4)).",
      },
    ],
    related: [
      "massachusetts-security-deposit-law",
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
      "security-deposit-demand-letter-massachusetts",
    ],
    ctaHeading: "Disputing deductions?",
    ctaBody:
      "Enter your deductions and we'll flag which ones are commonly contestable as wear and tear, then see what your claim may be worth.",
    ctaHref: "/",
    ctaLabel: "Check my deductions for free",
  },
  {
    slug: "security-deposit-interest-massachusetts",
    title: "Your Landlord Owes You Interest on Your Security Deposit in Massachusetts",
    metaDescription:
      "Massachusetts landlords owe 5% annual interest (or the actual bank rate) on security deposits held a year or more under M.G.L. c. 186 §15B(3)(b). Here's how to calculate what you're owed and how to recover it.",
    updated: "2026-07-08",
    intro:
      "One of the least-known parts of Massachusetts security deposit law: if your landlord held your deposit for a year or more, they owe you interest on it, every year, not just at move-out. Most tenants never see a cent of it. Here's what M.G.L. c. 186, §15B(3)(b) requires and how to add it to your claim.",
    sections: [
      {
        heading: "The interest rule",
        paragraphs: [
          "Under §15B(3)(b), a security deposit held for one year or longer earns interest at 5% per year, or the actual amount of interest received from the bank where the deposit is held if that's less. The interest is payable at the end of each year of the tenancy. Your landlord is supposed to give you a statement of the interest owed annually, and you're entitled to deduct it from your rent if it isn't paid within 30 days of each anniversary.",
          "A similar rule applies to last month's rent collected in advance, which also earns interest under §15B(2)(a).",
        ],
      },
      {
        heading: "How to calculate what you're owed",
        paragraphs: [
          "The straightforward version: deposit × 5% × full years held. A $2,000 deposit held for two full years is $2,000 × 0.05 × 2 = $200 of interest. If your landlord can show the deposit sat in a bank account that earned less than 5%, the actual bank interest is what's owed, but that's the landlord's number to prove, and it presumes the deposit was properly held in a Massachusetts escrow account in the first place.",
        ],
      },
      {
        heading: "Unpaid interest and your bigger claim",
        paragraphs: [
          "Unpaid interest doesn't carry treble damages by itself. But it's part of the balance you're owed when you move out, and if that balance isn't returned within 30 days of the end of your tenancy, the failure to return it is a §15B(6)(e) violation, which can carry treble damages, court costs, and attorney's fees under §15B(7). In practice, unpaid interest is one more line item that strengthens a demand letter.",
        ],
      },
    ],
    faq: [
      {
        question: "My landlord never mentioned interest. Do they still owe it?",
        answer:
          "The obligation comes from the statute, not from the lease or the landlord's say-so. If the deposit was held a year or more, interest is owed under §15B(3)(b) whether or not anyone talked about it.",
      },
      {
        question: "Is it always 5%?",
        answer:
          "It's 5% per year, or the actual interest received from the bank holding the deposit if that's less. If the landlord never properly escrowed the deposit, they're in a poor position to argue for the lower bank rate, and improper escrow is its own, more serious violation.",
      },
    ],
    related: [
      "massachusetts-security-deposit-law",
      "no-statement-of-condition-bank-receipt-massachusetts",
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
    ],
    ctaHeading: "Add interest to your claim",
    ctaBody:
      "Our free tool calculates the interest you may be owed and folds it into a demand letter automatically.",
    ctaHref: "/",
    ctaLabel: "Check my deposit for free",
  },
  {
    slug: "no-statement-of-condition-bank-receipt-massachusetts",
    title: "No Statement of Condition or Bank Receipt? Your Massachusetts Landlord May Have Forfeited Your Deposit",
    metaDescription:
      "Massachusetts landlords must escrow your deposit and give you a bank receipt within 30 days, plus a statement of condition within 10 days of move-in. Missing paperwork under M.G.L. c. 186 §15B can forfeit the deposit and trigger treble damages.",
    updated: "2026-07-08",
    intro:
      "Massachusetts security deposit law is full of paperwork requirements, and they're not technicalities. Two documents most landlords never send, the bank escrow receipt and the statement of condition, carry real consequences under M.G.L. c. 186, §15B. If you never got them, your landlord's position may be far weaker than they think.",
    sections: [
      {
        heading: "The bank receipt: due within 30 days",
        paragraphs: [
          "Under §15B(3)(a), your landlord must hold your deposit in a separate, interest-bearing account in a Massachusetts bank, protected from the landlord's creditors, and must give you a receipt within 30 days of receiving the deposit that identifies the bank's name and address, the amount, and the account number.",
          "Failing to properly escrow the deposit is a §15B(6)(a) violation: the landlord forfeits the right to retain any portion of the deposit, and the tenant is entitled to its immediate return. It's also one of the violations that can expose the landlord to treble damages, court costs, and attorney's fees under §15B(7).",
        ],
      },
      {
        heading: "The statement of condition: due within 10 days",
        paragraphs: [
          "Under §15B(2)(c), a landlord taking a security deposit must give you a signed, separate written statement of the present condition of the premises, either upon receiving the deposit or within 10 days after the tenancy begins, whichever is later. You then have 15 days to note any damage you disagree with and return it.",
          "The statement of condition is the landlord's baseline for claiming damage at move-out. A landlord who never provided one is in a weak position to prove that damage happened during your tenancy rather than before it.",
        ],
      },
      {
        heading: "Why the paperwork rules are your strongest leverage",
        paragraphs: [
          "Move-out damage disputes are fact fights. Paperwork violations are yes-or-no questions: either you received a bank receipt with an account number within 30 days, or you didn't. That's what makes these rules the backbone of many successful deposit claims: they're easy to prove and hard to excuse.",
        ],
      },
      {
        heading: "How to check, and what to do",
        paragraphs: [
          "Search your email and paper records for anything naming a bank and account number from the first month of your tenancy. If it isn't there, it likely was never sent. From there, the usual path applies: a written demand letter citing §15B(3)(a), §15B(6)(a), and §15B(7), sent by certified mail, followed by small claims court if the deadline passes.",
        ],
      },
    ],
    faq: [
      {
        question: "I got a receipt but it doesn't name the bank or account number. Does that count?",
        answer:
          "§15B(3)(a) requires the receipt to identify the bank's name and address, the deposit amount, and the account number. A receipt missing that information may not satisfy the statute.",
      },
      {
        question: "My landlord says the deposit is 'in their account.' Is that legal?",
        answer:
          "The deposit must be in a separate, interest-bearing Massachusetts account protected from the landlord's creditors, not commingled with the landlord's own funds. Commingling is a violation of §15B(3)(a).",
      },
      {
        question: "I never returned the statement of condition. Did I lose my rights?",
        answer:
          "Not signing or returning the statement affects the evidentiary picture, but it doesn't erase the landlord's own obligations. The escrow, receipt, itemization, and 30-day return rules still apply.",
      },
    ],
    related: [
      "treble-damages-security-deposit-massachusetts",
      "massachusetts-security-deposit-law",
      "security-deposit-demand-letter-massachusetts",
    ],
    ctaHeading: "Never got the paperwork?",
    ctaBody:
      "Answer a few questions and we'll check your landlord's paperwork compliance under §15B and what it may mean for your claim.",
    ctaHref: "/",
    ctaLabel: "Check my deposit for free",
  },
  {
    slug: "small-claims-court-security-deposit-massachusetts",
    title: "Taking Your Landlord to Small Claims Court in Massachusetts for a Security Deposit",
    metaDescription:
      "How to sue your landlord in Massachusetts small claims court over a security deposit: where to file, the Statement of Small Claim form, filing fees, the $7,000 limit, and what to bring to the hearing.",
    updated: "2026-07-08",
    intro:
      "If your demand letter's deadline came and went, Massachusetts small claims court is built for exactly this dispute: it's inexpensive, relatively fast, and designed to work without a lawyer. Here's the process from filing to hearing.",
    sections: [
      {
        heading: "Does your claim fit small claims court?",
        paragraphs: [
          "Small claims court generally handles claims of $7,000 or less. Two things make deposit cases fit comfortably: most deposits are well under the cap, and when a statute provides multiple damages, like the treble damages M.G.L. c. 186, §15B(7) may allow, the final award can exceed $7,000 as long as your actual damages fit within the limit.",
        ],
      },
      {
        heading: "Where to file",
        paragraphs: [
          "You can file in the District Court, Boston Municipal Court, or Housing Court for the area where you live or work, where your landlord lives or does business, or where the rental property is located. Housing Court judges see deposit cases constantly; if one covers your area, it's often a natural venue.",
        ],
      },
      {
        heading: "The form and the fee",
        paragraphs: [
          "You start the case with a \"Statement of Small Claim and Notice\" form, available at the clerk's office, by mail, or through the Massachusetts courts' online eFiling system. Filing fees are tiered by claim amount: $40 for claims up to $500, $50 up to $2,000, $100 up to $5,000, and $150 for claims from $5,001 to $7,000, with a small surcharge (around $7) for eFiling. Fees are set by the courts and change, so confirm the current amount when you file.",
          "In the claim description, keep it factual: the deposit amount, the tenancy dates, what §15B required, and what the landlord did or didn't do. If treble damages may apply, say so and cite §15B(7).",
        ],
      },
      {
        heading: "The hearing: what to bring and what happens",
        paragraphs: [
          "The clerk mails your claim to the landlord with a hearing date. Bring three copies of everything: your lease, the demand letter with certified-mail receipt and return receipt, bank records for the deposit, photos, any itemized deduction list you received, and a one-page summary of what you're owed and why.",
          "A clerk-magistrate typically hears the case informally. You tell your side in plain language, the landlord tells theirs, and questions follow. No legal training needed: the facts and the paperwork do the work.",
        ],
      },
      {
        heading: "Send the demand letter first",
        paragraphs: [
          "A demand letter isn't just courtesy. It shows the court you gave the landlord a fair chance to comply, it often resolves the dispute without filing, and it frames your case: the same numbered violations in your letter become your claim description.",
        ],
      },
    ],
    faq: [
      {
        question: "Do I need a lawyer for small claims court?",
        answer:
          "No. Small claims procedure is designed for self-represented parties, and deposit cases are among the most common claims heard. That said, nothing prevents you from consulting a Massachusetts attorney, especially for larger claims.",
      },
      {
        question: "How long does a small claims case take?",
        answer:
          "It varies by court and caseload, but hearings are commonly scheduled within a couple of months of filing, much faster than a regular civil action.",
      },
      {
        question: "What if I win and my landlord still doesn't pay?",
        answer:
          "A judgment isn't self-enforcing, but the courts have collection procedures, including payment hearings and orders the court can enforce. The clerk's office can explain the options for your court.",
      },
    ],
    related: [
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
      "treble-damages-security-deposit-massachusetts",
      "security-deposit-demand-letter-massachusetts",
    ],
    ctaHeading: "Build your case first",
    ctaBody:
      "Our free tool analyzes your situation under §15B and generates the demand letter that becomes the backbone of your small claims case.",
    ctaHref: "/",
    ctaLabel: "Start with the free letter",
  },
];

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((article) => article.slug === slug);
}

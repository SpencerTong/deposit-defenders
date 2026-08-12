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
      "Massachusetts landlords can't deduct ordinary wear and tear from your security deposit, and the Supreme Judicial Court confirmed it in 2025. Here's where the line falls (cleaning, painting, carpets, nail holes) and the sworn itemized list M.G.L. c. 186 §15B requires.",
    updated: "2026-07-31",
    intro:
      "Most security deposit fights come down to one question: was it damage, or was it just living there? Massachusetts law answers more of that question than most tenants realize. Under M.G.L. c. 186, §15B(4), a landlord can only deduct for damage beyond \"reasonable wear and tear,\" and only with a sworn, itemized list delivered on time. In August 2025 the state's highest court took up that phrase for the first time since it entered the statute in 1970.",
    sections: [
      {
        heading: "What the statute allows landlords to deduct",
        paragraphs: [
          "Under §15B(4), deductions from a security deposit are limited to three things: unpaid rent (not lawfully withheld), unpaid increases in real estate taxes you were obligated to pay under the lease, and the reasonable cost of repairing damage caused by the tenant or their guests, expressly excluding reasonable wear and tear.",
        ],
      },
      {
        heading: "What the Supreme Judicial Court decided in 2025",
        paragraphs: [
          "In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Aug. 1, 2025), the Supreme Judicial Court answered two questions certified to it by a federal court. On the first, it held that a tenant's reasonable use of a property as a residence is expected to result in gradual deterioration that may require painting, carpet cleaning or repair, or other refurbishment at the end of a lease, and that deducting from a security deposit to repair such reasonable wear and tear violates §15B(4)(iii).",
          "One thing the Court specifically declined to do is set a bright line. The tenants asked it to rule that every deduction for cleaning or painting is unlawful, and it said it could not. Whether particular damage is reasonable wear and tear depends on all the circumstances, including the nature and cause of the damage, the deterioration expected from reasonable use under that lease, the condition of the unit when you moved in, and how long you lived there.",
          "That last factor cuts in tenants' favor over time. The Court said the longer an occupancy lasts, the more wear is reasonably expected, potentially reaching severe wear that is still reasonable given the length of the tenancy.",
          "The opinion gives concrete examples of what counts as reasonable wear: scuff marks on floors from walking on them, a reasonable degree of scuffing on walls, marks around doorways, and stains and other signs of age on carpets. It also approvingly cites an earlier case where carpet stains requiring replacement and wall holes requiring spackling were found to be wear and tear on those facts. By contrast, damage from unreasonable use, its example was overloading a cracked floor until it collapsed, is not.",
        ],
      },
      {
        heading: "Lease clauses requiring professional cleaning",
        paragraphs: [
          "The second question in Peebles was about a lease addendum requiring tenants to return the apartment \"professionally cleaned,\" with a list of charges that would be applied otherwise. The Court held that a clause requiring professionally cleaned condition on penalty of deductions for painting, cleaning, or repairs regardless of whether the damage is reasonable wear and tear conflicts with §15B(4), and is therefore void and unenforceable under §15B(8).",
          "Two limits are worth knowing. The Court expressly did not decide whether a stand-alone requirement to clean, one not tied to security deposit deductions, would be a problem. It also did not decide whether merely including such a clause triggers the forfeiture provision in §15B(6)(c), because that question was not put to it. So the clean takeaway is narrower than \"cleaning clauses are illegal\": a clause that penalizes you through your deposit for wear and tear is unenforceable.",
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
          "Massachusetts law doesn't recognize automatic cleaning fees taken from a security deposit. In Peebles v. JRK Property Holdings (SJC-13702, 2025), the Supreme Judicial Court named carpet cleaning among the end-of-lease work that reasonable use is expected to require, and deductions for reasonable wear and tear violate the statute. Whether a specific charge qualifies still depends on the circumstances, and any deduction requires the sworn, itemized list.",
      },
      {
        question: "My lease says I have to hire professional cleaners. Is that enforceable?",
        answer:
          "In Peebles, the Supreme Judicial Court held that a lease clause requiring the unit be returned in professionally cleaned condition, on penalty of deposit deductions for cleaning, painting, or repairs regardless of whether the damage is reasonable wear and tear, conflicts with §15B(4) and is void and unenforceable under §15B(8). The Court did not decide whether a stand-alone cleaning requirement, one not backed by deposit deductions, would be a problem.",
      },
      {
        question: "I lived there three years. Can they charge me to repaint?",
        answer:
          "Repainting after a multi-year tenancy is one of the most commonly contested deductions, since paint wears in the normal course of living. Peebles lists painting among the refurbishment that reasonable residential use is expected to require, and says the longer the occupancy, the more wear is reasonably expected. Deteriorating paint from ordinary use is generally wear and tear, not tenant damage.",
      },
      {
        question: "What proof does my landlord need for a deduction?",
        answer:
          "An itemized list sworn under the pains and penalties of perjury, with written evidence such as estimates, bills, invoices, or receipts, delivered within 30 days of the end of the tenancy (§15B(4)).",
      },
    ],
    related: [
      "professional-cleaning-charge-security-deposit-massachusetts",
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
    slug: "professional-cleaning-charge-security-deposit-massachusetts",
    title: "Charged for Professional Cleaning in Massachusetts? What Your Lease Can and Cannot Do",
    metaDescription:
      "Your Massachusetts lease says return the unit professionally cleaned, and the landlord took it out of your deposit. In Peebles (2025) the Supreme Judicial Court held that kind of clause is void under M.G.L. c. 186 §15B(8). Here is what that means for your charge, and what it does not mean.",
    updated: "2026-08-12",
    intro:
      "It usually arrives as a line item: \"professional cleaning, $350,\" deducted from your deposit, pointing at a move-out addendum you signed without reading. Massachusetts law has more to say about that line item than most renters and quite a few landlords realize. In August 2025 the Supreme Judicial Court decided exactly this question, and the answer is favorable to tenants but narrower than the version going around online.",
    sections: [
      {
        heading: "What the clause usually looks like",
        paragraphs: [
          "The clause is rarely in the lease body. It is usually a separate move-out or cleaning addendum, signed at the same time as everything else, and it tends to combine two things: a requirement that you return the unit in \"professionally cleaned\" condition, and a schedule of charges the landlord will apply if you do not.",
          "That second half is what matters legally. A charge schedule tied to your deposit is the part the statute reaches.",
        ],
      },
      {
        heading: "Why the clause is unenforceable",
        paragraphs: [
          "Massachusetts limits deposit deductions to three things under §15B(4): unpaid rent, unpaid tax increases you agreed to cover, and the reasonable cost of repairing damage caused by you, expressly not including reasonable wear and tear.",
          "In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Aug. 1, 2025), the Supreme Judicial Court held that a lease clause requiring professionally cleaned condition, on penalty of deductions for painting, cleaning, or repairs regardless of whether the damage is reasonable wear and tear, conflicts with §15B(4) and is void and unenforceable under §15B(8).",
          "Section 15B(8) is the reason a signature does not save the clause. It voids any lease provision that tries to contract around §15B. You cannot agree to give up these protections, so the landlord cannot rely on the fact that you signed.",
          "The same opinion also held that ordinary residential use is expected to cause gradual deterioration that may require painting, carpet cleaning, or other refurbishment, and that deducting for that reasonable wear and tear violates §15B(4)(iii).",
        ],
      },
      {
        heading: "What this does not mean",
        paragraphs: [
          "This is where a lot of online advice overshoots, and getting it wrong can weaken an otherwise good position. Three limits come straight from the opinion:",
        ],
        list: [
          "It is not a rule that all cleaning charges are illegal. The tenants asked the Court for exactly that bright line and it declined. Whether a specific charge is reasonable wear and tear depends on the circumstances, including the nature and cause of the condition, what that lease made reasonable, the condition when you moved in, and how long you lived there.",
          "It does not decide whether a stand-alone cleaning requirement is a problem. In footnote 8 the Court expressly took no view on a clause that requires cleaning but is not backed by deposit deductions. The holding is about clauses that penalize you through your deposit.",
          "It does not hold that having such a clause forfeits the deposit. Whether including one triggers the forfeiture provision in §15B(6)(c) was not briefed, and the Court did not decide it. Anyone telling you the clause alone means you get the whole deposit back is going past the case.",
        ],
      },
      {
        heading: "So what is the clause actually worth to you",
        paragraphs: [
          "Honestly, on its own, no money. It is an argument, not a penalty. A void clause means the landlord cannot rely on it to justify the deduction, which throws them back on proving the charge was real damage beyond wear and tear, with the paperwork the statute requires.",
          "The money comes from the other failures the same situation usually involves, and those are the ones worth checking.",
        ],
      },
      {
        heading: "The paperwork failure that usually matters more",
        paragraphs: [
          "A deduction for damage is only valid if the landlord delivered an itemized list of damages, sworn under the pains and penalties of perjury, with written documentation such as estimates, bills, or receipts, within 30 days of the end of the tenancy (§15B(4)).",
          "A cleaning charge pulled from an addendum schedule frequently arrives without any of that, because the landlord thought the addendum was authority enough. When the list is missing or defective, §15B(6)(b) forfeits the right to keep any part of the deposit for damages. And if the resulting balance is not returned within 30 days of the tenancy ending, §15B(6)(e) and §15B(7) put treble damages, plus costs and attorney's fees, on the table.",
          "That is the sequence worth checking in your own paperwork, because it is where the dollars actually are.",
        ],
      },
      {
        heading: "What to do about your charge",
        paragraphs: [
          "A practical order of operations:",
        ],
        list: [
          "Find the addendum and read whether the cleaning requirement is tied to charges against your deposit. That link is what Peebles addresses.",
          "Check whether you received a sworn, itemized list with documentation within 30 days of moving out, and keep the envelope or email showing when it arrived.",
          "Separate the charges. Routine cleaning, repainting, and carpet shampooing after ordinary use are commonly contested as wear and tear. A burn, a hole, or pet damage is a different argument.",
          "Note the date your tenancy ended, since the 30-day clock under §15B(6)(e) runs from there and it is what converts a dispute into statutory exposure.",
          "Put the demand in writing. A Chapter 93A demand letter starts a 30-day response window, and the statute requires only that it be mailed or delivered, not that the landlord accept it.",
        ],
      },
    ],
    faq: [
      {
        question: "I signed the cleaning addendum. Doesn't that mean I agreed to it?",
        answer:
          "Signing does not rescue a clause that conflicts with the statute. M.G.L. c. 186, §15B(8) makes any lease provision that attempts to contract around §15B void and unenforceable, which is the basis on which the Supreme Judicial Court treated the clause in Peebles v. JRK Property Holdings (SJC-13702, 2025). Your signature is not the issue.",
      },
      {
        question: "Are professional cleaning clauses illegal in Massachusetts?",
        answer:
          "That is a common overstatement. Peebles held that a clause requiring professionally cleaned condition on penalty of deposit deductions regardless of reasonable wear and tear is void under §15B(8). In footnote 8 the Court expressly declined to say anything about a stand-alone cleaning requirement that is not tied to deposit deductions. The holding is about using your deposit as the penalty.",
      },
      {
        question: "The unit really was dirty when I left. Does the clause still matter?",
        answer:
          "It can still matter, because the question shifts from what the addendum says to whether the condition was damage beyond reasonable wear and tear, and whether the landlord produced the sworn itemized list with documentation within 30 days. Genuine damage beyond ordinary use can be a lawful deduction when it is properly itemized and documented.",
      },
      {
        question: "Does the clause by itself mean I get my whole deposit back?",
        answer:
          "No, and it is worth being precise here. The Court did not decide whether including such a clause triggers the forfeiture provision of §15B(6)(c), because that question was not put to it. Forfeiture in these cases usually comes from the failures that are decided, such as a missing or defective sworn itemized list under §15B(6)(b), or a balance not returned within 30 days under §15B(6)(e).",
      },
    ],
    related: [
      "normal-wear-and-tear-vs-damage-massachusetts",
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
      "security-deposit-demand-letter-massachusetts",
      "how-we-calculate-your-claim",
    ],
    ctaHeading: "Charged for cleaning?",
    ctaBody:
      "Enter the deductions your landlord took and the dates involved. We'll flag which charges are commonly contested as wear and tear, whether a cleaning clause applies, and what the statute may put on the table.",
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
  {
    slug: "how-we-calculate-your-claim",
    title: "How We Calculate Your Potential Claim",
    metaDescription:
      "Exactly how we turn your answers into a dollar figure under M.G.L. c. 186 §15B: what adds money, what deliberately adds nothing, and the statute and case law behind every step.",
    updated: "2026-08-03",
    intro:
      "This page explains, step by step, how the number on our free analysis screen is produced. We publish it because a dollar figure from a website you have never heard of deserves scrutiny. If you are a renter, this shows you where your number came from. If you are a reporter or an attorney checking our work, the citation for each step is here, along with a plain account of what we leave out on purpose.",
    sections: [
      {
        heading: "The short version",
        paragraphs: [
          "Only three things add money to the figure we show you: the deposit balance your landlord still owes, a tripling of that balance in the situations where the statute allows it, and unpaid annual interest. Nothing else moves the number, including several findings that are real violations of the law.",
        ],
      },
      {
        heading: "Step one: the balance still owed",
        paragraphs: [
          "We start with the deposit you paid, subtract any deductions your landlord itemized, and subtract anything already returned to you. What remains is the outstanding balance.",
          "One rule can raise that balance back to the full deposit. Section 15B(4) requires a landlord who keeps any part of a deposit for damage to give you an itemized list, sworn under the pains and penalties of perjury, within 30 days of the end of the tenancy. If that list was missing, late, or not sworn, §15B(6)(b) forfeits the landlord's right to keep those deductions at all. When your answers show that, we treat the balance owed as the whole deposit rather than the deposit minus deductions.",
        ],
      },
      {
        heading: "Step two: does the tripling apply",
        paragraphs: [
          "Massachusetts law lets a court award three times the balance a landlord wrongfully held. Lawyers call this treble damages, which just means tripled: instead of handing back what they kept, the landlord can be ordered to pay three times that amount.",
          "The tripling is not automatic, and it does not attach to every violation. Section 15B(7) applies it to specific failures listed in §15B(6). Our analysis applies it in two of those situations:",
        ],
        list: [
          "The deposit was not held in a separate account and you were never given a receipt naming the bank, which is §15B(6)(a).",
          "The balance you were owed was not returned within 30 days of the end of the tenancy, which is §15B(6)(e).",
        ],
      },
      {
        paragraphs: [
          "If neither applies, we show the balance untripled, even when other violations are present. We also apply the tripling only to the outstanding balance, never to interest.",
          "Section 15B(7) additionally allows court costs and reasonable attorney's fees on top of the tripled amount. We mention that but never put a number on it, because what those come to is for a court to decide.",
        ],
      },
      {
        heading: "Step three: unpaid interest",
        paragraphs: [
          "A deposit held for a year or more earns 5% annual interest under §15B(3)(b), or the interest the account actually earned if your lease says so. When your answers show a tenancy of at least a year with no interest paid, we add 5% of the deposit for each full year. We count whole years only and round nothing in your favor.",
        ],
      },
      {
        heading: "What we deliberately count as zero",
        paragraphs: [
          "This is the section worth reading closely, because it is where a tool with an incentive to inflate would inflate. Each of the following is something we show you, and none of it adds a dollar to your figure.",
        ],
        list: [
          "No written statement of the unit's condition at move-in. This is a genuine violation of §15B(2)(c), and separately an unfair or deceptive practice under 940 CMR 3.17(4)(e). But it is not one of the failures listed in §15B(6), so it does not forfeit the deposit and we add nothing for it. We still show it, because it weakens a landlord's evidence for any damage claim.",
          "Wear-and-tear flags on itemized charges. When a charge uses wording commonly associated with ordinary wear and tear, such as painting or carpet cleaning, we flag it. That flag is a prompt to look closer, not a legal conclusion that the charge was improper, and it adds nothing.",
          "A professional cleaning clause in your lease. In Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025), the Supreme Judicial Court held that such a clause is void under §15B(8) where it is enforced by charging the deposit regardless of ordinary wear and tear. That is a strong argument to make, but it is not a separate sum of money, so it adds nothing.",
          "A deposit larger than one month's rent. The excess is separately recoverable under §15B(1)(b)(iii), and we say so in a note, but it is not tripled and we keep it out of the headline number.",
          "Interest on a tenancy shorter than a year. None is due yet, so we add nothing.",
        ],
      },
      {
        heading: "What the number is not",
        paragraphs: [
          "The figure is labeled up to for a reason. It is the maximum the statute would allow on the facts you gave us, if those facts are accurate and a court agrees with them. It is not a prediction, not an offer, and not an appraisal of your case. Landlords settle for less, defenses exist, and some of these questions have never been decided by an appellate court.",
          "We also only know what you tell us. We do not see your lease, your bank records, or your landlord's paperwork. If an answer is wrong, the number will be wrong, which is why a buyer can correct their answers before anything is mailed.",
          "Some landlords fall outside part of this analysis. If your landlord lives in the building, the Chapter 93A consumer protection layer generally does not reach them, following Billings v. Wilson, 397 Mass. 614 (1986). We ask about that before generating a paid letter, and the letter changes accordingly.",
        ],
      },
      {
        heading: "Where this comes from",
        paragraphs: [
          "Every statutory claim above is checked against primary sources rather than secondary summaries or other websites.",
        ],
        list: [
          "M.G.L. c. 186, §15B, the Massachusetts security deposit statute, as published on malegislature.gov.",
          "940 CMR 3.17, the Attorney General's landlord and tenant regulations, as published in the official CMR text.",
          "Peebles v. JRK Property Holdings, Inc., SJC-13702 (Mass. Aug. 1, 2025).",
          "Billings v. Wilson, 397 Mass. 614 (1986).",
        ],
      },
      {
        paragraphs: [
          "The §15B rules and the Chapter 93A mapping were last verified against primary sources on July 27, 2026. The Peebles analysis was added on August 1, 2026.",
          "If you are an attorney or a tenant advocate and you believe something here is wrong, we would genuinely like to know. All of this logic lives in one place, so a correction can be made quickly. Our contact form reaches the owner directly.",
        ],
      },
    ],
    faq: [
      {
        question: "Is this legal advice?",
        answer:
          "No. This is general legal information, and using the tool does not create an attorney-client relationship. For advice about your situation, consult a licensed Massachusetts attorney.",
      },
      {
        question: "Why is my number less than three times my deposit?",
        answer:
          "Two reasons are common. The tripling under §15B(7) only attaches to certain failures, so if neither applies to you we show the balance untripled. And the tripling applies to the balance still outstanding, not to the original deposit, so anything already returned to you reduces it.",
      },
      {
        question: "Why does the analysis list a violation that adds no money?",
        answer:
          "Because it is still true and still useful. Some requirements of §15B carry no separate financial remedy but still matter, either as an unfair or deceptive practice or because they weaken your landlord's position on a damage claim. We would rather show you an accurate zero than pad the total.",
      },
      {
        question: "Do I have to pay to see the calculation?",
        answer:
          "No. The analysis and this explanation are free and require no account. The $49 product is the demand letter, drafted and mailed by certified mail, plus a small claims draft.",
      },
    ],
    related: [
      "treble-damages-security-deposit-massachusetts",
      "normal-wear-and-tear-vs-damage-massachusetts",
      "landlord-didnt-return-security-deposit-30-days-massachusetts",
    ],
    ctaHeading: "See your own numbers",
    ctaBody:
      "Answer about six questions and see this calculation run on your own deposit, free, with a citation on every line.",
    ctaHref: "/",
    ctaLabel: "Check my deposit for free",
  },
];

export function getGuideArticle(slug: string): GuideArticle | undefined {
  return guideArticles.find((article) => article.slug === slug);
}

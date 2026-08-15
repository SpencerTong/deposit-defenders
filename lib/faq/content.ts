import { SITE_NAME } from "@/lib/site";

export interface FaqItem {
  question: string;
  answer: string;
  linkHref?: string;
  linkLabel?: string;
}

/**
 * General-information answers to the questions buyers most often hit after
 * the letter is sent. Everything here is the same for every Massachusetts
 * tenant; anything specific to one person's case stays out (and the answers
 * say so). Shown on /faq and inside the kit workspace.
 */
export const FAQ_ITEMS: FaqItem[] = [
  {
    question: "Which court do I file in if my landlord does not pay?",
    answer:
      "Massachusetts small claims cases are heard in the District Court, the Boston Municipal " +
      "Court, and the Housing Court. You can generally file where you live or work, where your " +
      "landlord lives or does business, or where the rental property is located. Your kit's " +
      "small claim draft repeats this with your details filled in. To find the exact " +
      "courthouse serving your city or town, use the official locator below.",
    linkHref: "https://www.mass.gov/courthouse-locator",
    linkLabel: "Find your courthouse on mass.gov",
  },
  {
    question: "What happens after my letter is mailed?",
    answer:
      "Your landlord has the response window stated in the letter (30 days for the Chapter 93A " +
      "demand, since that is the period the statute provides) to pay or respond. Certified " +
      "mail gives you a tracking number and a return receipt, which together prove when the " +
      "letter arrived. Keep them with your records; they become evidence if you file in court.",
  },
  {
    question: "What if my landlord ignores the letter?",
    answer:
      "That is what small claims court is for, and it is designed to work without a lawyer. " +
      "Your kit includes a pre-filled draft of the Statement of Small Claim with your parties, " +
      "amounts, and claim description, plus a step-by-step filing walkthrough. Many landlords " +
      "pay after a demand letter precisely because the next step is this easy to take.",
  },
  {
    question: "What if my landlord offers less than I demanded?",
    answer:
      "Accepting a partial offer is entirely your decision. Taking a partial payment does not " +
      "by itself erase your remedies for the rest. One thing worth knowing: when a landlord " +
      "makes a reasonable written settlement offer in response to a Chapter 93A demand and it " +
      "is rejected, a court may later limit the recovery to that offer if it finds the offer " +
      "was reasonable. Weigh written offers seriously, and consult an attorney if the amount " +
      "at stake is large.",
  },
  {
    question: "Do I need a lawyer?",
    answer:
      "Small claims court is built for people without lawyers: you tell your side in plain " +
      "language and a clerk-magistrate asks questions. Bring your evidence and your letter. " +
      "Because the security deposit law and Chapter 93A can shift attorney's fees to a " +
      "landlord who violated them, some attorneys also take strong cases at little or no " +
      "upfront cost. Either path works; it depends on your comfort and the amount at stake.",
  },
  {
    question: "How much does it cost to file in small claims court?",
    answer:
      "Filing fees are tiered by claim size, roughly $40 to $150, and eFiling adds a small " +
      "surcharge of about $7. Your kit states the current fee for a claim your size. Fees are " +
      "set by the courts and change over time, so confirm the amount when you file.",
  },
  {
    question: "Is there a deadline for me to act?",
    answer:
      "Yes. Legal claims come with time limits, and the safest move is to act promptly rather " +
      "than wait. The specific deadline that applies to your situation depends on the type of " +
      "claim and its facts, so if significant time has passed since your tenancy ended, ask a " +
      "licensed Massachusetts attorney about your deadline before assuming anything.",
  },
  {
    question: "Is any of this legal advice?",
    answer:
      `No. ${SITE_NAME} is a self-help document preparation tool that provides general ` +
      "legal information. It is not a law firm, and nothing it produces is legal advice or a " +
      "prediction about your case. For advice about your specific situation, consult a " +
      "licensed Massachusetts attorney.",
  },
];

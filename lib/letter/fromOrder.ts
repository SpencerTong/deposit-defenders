import type { KitOrder, MailAddress } from "@/lib/db/kitOrders";
import type { FlowAnswers } from "@/lib/flow/types";
import { analyzeTenancy } from "@/lib/statute/ma";
import { toTenancyInputs } from "@/lib/flow/toTenancyInputs";
import { buildCombinedDemandLetter, type DemandLetterContent } from "./template";

export function formatAddress(address: MailAddress): string {
  const lines = [address.line1];
  if (address.line2) lines.push(address.line2);
  lines.push(`${address.city}, ${address.state} ${address.zip}`);
  return lines.join("\n");
}

/**
 * Single source of truth for "the buyer's current letter": rebuilds it from
 * the order's answers snapshot plus whatever letter details the buyer has
 * saved in the workspace. Placeholders remain until details are saved.
 * The owner-occupied answer decides combined 93A vs plain 15B.
 */
export function buildLetterForOrder(order: KitOrder, today?: Date): DemandLetterContent {
  const tenancy = toTenancyInputs(order.answers as FlowAnswers);
  const analysis = analyzeTenancy(tenancy);
  const details = order.letterDetails;

  const letter = buildCombinedDemandLetter(
    tenancy,
    analysis,
    details
      ? {
          tenantName: details.tenantName,
          tenantAddress: formatAddress(details.tenantAddress),
          landlordName: details.landlordName,
          landlordAddress: formatAddress(details.landlordAddress),
          propertyAddress: details.propertyAddress,
        }
      : {},
    // Without saved details we cannot know the owner-occupied answer; default
    // to the plain 15B letter, which is correct for every landlord.
    { ownerOccupied: details ? details.ownerOccupied : true, today }
  );

  const note = details?.customNote?.trim();
  if (!note) return letter;

  // The buyer's note goes right before the closing deadline paragraph.
  const paragraphs = [...letter.paragraphs];
  paragraphs.splice(paragraphs.length - 1, 0, note);
  return { ...letter, paragraphs };
}

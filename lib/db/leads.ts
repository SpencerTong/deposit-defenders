import { getPool } from "./client";

export interface Lead {
  email: string;
  src: string | null;
  depositAmount: number;
  rulesFired: string[];
}

/**
 * Records a lead. Degrades to a console log (rather than throwing) when
 * POSTGRES_URL isn't configured yet, matching lib/db/events.ts.
 */
export async function recordLead(lead: Lead): Promise<void> {
  const pool = getPool();
  if (!pool) {
    console.log("[leads] POSTGRES_URL not configured, logging only:", lead);
    return;
  }

  try {
    await pool.query(
      "INSERT INTO leads (email, deposit_amount, rules_fired, src) VALUES ($1, $2, $3, $4)",
      [lead.email, lead.depositAmount, lead.rulesFired, lead.src]
    );
  } catch (error) {
    console.error("[leads] failed to record lead", error);
  }
}

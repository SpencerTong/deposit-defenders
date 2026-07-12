import type { MailAddress } from "@/lib/db/kitOrders";

const LOB_LETTERS_URL = "https://api.lob.com/v1/letters";

export interface MailLetterInput {
  description: string;
  to: { name: string; address: MailAddress };
  from: { name: string; address: MailAddress };
  pdf: Buffer;
}

export interface MailLetterResult {
  id: string;
  trackingNumber: string | null;
}

function appendAddress(form: FormData, prefix: "to" | "from", name: string, a: MailAddress): void {
  form.append(`${prefix}[name]`, name);
  form.append(`${prefix}[address_line1]`, a.line1);
  if (a.line2) form.append(`${prefix}[address_line2]`, a.line2);
  form.append(`${prefix}[address_city]`, a.city);
  form.append(`${prefix}[address_state]`, a.state);
  form.append(`${prefix}[address_zip]`, a.zip);
}

/**
 * Sends the letter by USPS Certified Mail with electronic return receipt via
 * Lob's Letters API. Degrades to a logged null when LOB_API_KEY is unset
 * (matching the Resend/Stripe pattern) and returns null on any Lob rejection;
 * the caller decides how to surface the failure. Test keys (test_*) create
 * test letters that are never physically mailed.
 */
export async function mailCertifiedLetter(
  input: MailLetterInput
): Promise<MailLetterResult | null> {
  const apiKey = process.env.LOB_API_KEY;
  if (!apiKey) {
    console.log(
      `[lob] LOB_API_KEY not configured, would mail ${input.pdf.byteLength}-byte letter to ${input.to.name}`
    );
    return null;
  }

  const form = new FormData();
  form.append("description", input.description);
  appendAddress(form, "to", input.to.name, input.to.address);
  appendAddress(form, "from", input.from.name, input.from.address);
  form.append("file", new Blob([new Uint8Array(input.pdf)], { type: "application/pdf" }), "letter.pdf");
  form.append("color", "false");
  form.append("address_placement", "insert_blank_page");
  form.append("extra_service", "certified_return_receipt");
  form.append("mail_type", "usps_first_class");
  form.append("use_type", "operational");

  try {
    const res = await fetch(LOB_LETTERS_URL, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiKey}:`).toString("base64")}`,
      },
      body: form,
    });

    if (!res.ok) {
      console.error(`[lob] letter create failed (${res.status})`, await res.text());
      return null;
    }

    const data = (await res.json()) as { id: string; tracking_number?: string | null };
    return { id: data.id, trackingNumber: data.tracking_number ?? null };
  } catch (error) {
    console.error("[lob] letter create request failed", error);
    return null;
  }
}

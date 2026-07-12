import { AlignmentType, Document, Packer, Paragraph, TextRun } from "docx";
import type { DemandLetterContent } from "./template";

function textParagraph(text: string, opts: { bold?: boolean; spaceAfter?: number } = {}): Paragraph {
  return new Paragraph({
    children: [new TextRun({ text, bold: opts.bold, size: 22, font: "Calibri" })],
    spacing: { after: opts.spaceAfter ?? 200 },
    alignment: AlignmentType.LEFT,
  });
}

function addressParagraphs(name: string, address: string): Paragraph[] {
  return [name, ...address.split("\n")].map(
    (line, i, arr) => textParagraph(line, { spaceAfter: i === arr.length - 1 ? 200 : 40 })
  );
}

/**
 * Renders the demand letter as an editable .docx mirroring the PDF layout, so
 * the buyer can adjust wording in Word or Google Docs before signing.
 */
export async function renderDemandLetterDocx(letter: DemandLetterContent): Promise<Buffer> {
  const children: Paragraph[] = [
    textParagraph(letter.date, { spaceAfter: 300 }),
    ...addressParagraphs(letter.tenantName, letter.tenantAddress),
    ...addressParagraphs(letter.landlordName, letter.landlordAddress),
    textParagraph(letter.subject, { bold: true, spaceAfter: 300 }),
    textParagraph(letter.salutation),
    ...letter.paragraphs.map((p) => textParagraph(p)),
    textParagraph(letter.closing, { spaceAfter: 500 }),
    textParagraph(letter.signatureName, { spaceAfter: 400 }),
    new Paragraph({
      children: [new TextRun({ text: letter.disclaimer, size: 16, color: "6B7280", font: "Calibri" })],
    }),
  ];

  const doc = new Document({
    sections: [{ properties: {}, children }],
  });

  return Packer.toBuffer(doc);
}

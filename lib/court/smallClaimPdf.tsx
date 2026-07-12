import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { SmallClaimDraft } from "./smallClaim";

const styles = StyleSheet.create({
  page: { padding: 56, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5, color: "#111827" },
  title: { fontSize: 16, fontFamily: "Helvetica-Bold", marginBottom: 6 },
  draftNote: { fontSize: 9, color: "#6b7280", marginBottom: 18 },
  sectionLabel: {
    fontSize: 9,
    fontFamily: "Helvetica-Bold",
    color: "#6b7280",
    textTransform: "uppercase",
    marginBottom: 3,
  },
  field: { marginBottom: 12 },
  value: { marginBottom: 2 },
  disclaimer: { marginTop: 28, fontSize: 8, color: "#6b7280" },
});

function Field({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.field}>
      <Text style={styles.sectionLabel}>{label}</Text>
      {value.split("\n").map((line, i) => (
        <Text key={i} style={styles.value}>
          {line}
        </Text>
      ))}
    </View>
  );
}

function SmallClaimDocument({ draft }: { draft: SmallClaimDraft }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{draft.title}</Text>
        <Text style={styles.draftNote}>{draft.draftNote}</Text>

        <Field label="Plaintiff (you)" value={`${draft.plaintiffName}\n${draft.plaintiffAddress}`} />
        <Field
          label="Defendant (your landlord)"
          value={`${draft.defendantName}\n${draft.defendantAddress}`}
        />
        <Field label="Amount claimed" value={draft.claimAmount} />
        <Field label="Claim description (statement of claim)" value={draft.claimDescription} />
        <Field label="Where to file" value={draft.venueGuidance} />
        <Field label="Filing fee" value={draft.feeGuidance} />

        <Text style={styles.disclaimer}>{draft.disclaimer}</Text>
      </Page>
    </Document>
  );
}

export async function renderSmallClaimPdf(draft: SmallClaimDraft): Promise<Buffer> {
  return renderToBuffer(<SmallClaimDocument draft={draft} />);
}

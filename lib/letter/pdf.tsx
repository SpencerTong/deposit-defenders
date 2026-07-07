import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { DemandLetterContent } from "./template";

const styles = StyleSheet.create({
  page: { padding: 56, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5, color: "#111827" },
  date: { marginBottom: 24 },
  addressLine: { marginBottom: 2 },
  addressBlock: { marginBottom: 16 },
  subject: { marginBottom: 16, fontFamily: "Helvetica-Bold" },
  paragraph: { marginBottom: 12, textAlign: "justify" },
  signature: { marginTop: 32 },
  disclaimer: { marginTop: 40, fontSize: 8, color: "#6b7280" },
});

function DemandLetterDocument({ letter }: { letter: DemandLetterContent }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.date}>{letter.date}</Text>

        <View style={styles.addressBlock}>
          <Text style={styles.addressLine}>{letter.tenantName}</Text>
          <Text style={styles.addressLine}>{letter.tenantAddress}</Text>
        </View>

        <View style={styles.addressBlock}>
          <Text style={styles.addressLine}>{letter.landlordName}</Text>
          <Text style={styles.addressLine}>{letter.landlordAddress}</Text>
        </View>

        <Text style={styles.subject}>{letter.subject}</Text>
        <Text style={styles.paragraph}>{letter.salutation}</Text>

        {letter.paragraphs.map((paragraph, i) => (
          <Text key={i} style={styles.paragraph}>
            {paragraph}
          </Text>
        ))}

        <Text style={styles.paragraph}>{letter.closing}</Text>
        <Text style={styles.signature}>{letter.signatureName}</Text>

        <Text style={styles.disclaimer}>{letter.disclaimer}</Text>
      </Page>
    </Document>
  );
}

export async function renderDemandLetterPdf(letter: DemandLetterContent): Promise<Buffer> {
  return renderToBuffer(<DemandLetterDocument letter={letter} />);
}

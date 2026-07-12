import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import type { KitContent } from "./content";

const styles = StyleSheet.create({
  page: { padding: 56, fontSize: 11, fontFamily: "Helvetica", lineHeight: 1.5, color: "#111827" },
  title: { fontSize: 18, fontFamily: "Helvetica-Bold", marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#6b7280", marginBottom: 20 },
  summaryCard: {
    backgroundColor: "#f3f4f6",
    borderRadius: 6,
    padding: 12,
    marginBottom: 20,
  },
  summaryLine: { marginBottom: 2 },
  heading: { fontSize: 13, fontFamily: "Helvetica-Bold", marginTop: 16, marginBottom: 6 },
  paragraph: { marginBottom: 8 },
  listItem: { marginBottom: 4, marginLeft: 12 },
  disclaimer: { marginTop: 32, fontSize: 8, color: "#6b7280" },
});

function KitDocument({ kit }: { kit: KitContent }) {
  return (
    <Document>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{kit.title}</Text>
        <Text style={styles.subtitle}>Generated {kit.generatedDate}</Text>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryLine}>Demand amount: {kit.demandAmount}</Text>
          <Text style={styles.summaryLine}>
            Response deadline (10 business days): {kit.responseDeadlineDate}
          </Text>
          {kit.trebleApplies && (
            <Text style={styles.summaryLine}>
              Treble damages under M.G.L. c. 186, §15B(7) may apply to this claim.
            </Text>
          )}
        </View>

        {kit.sections.map((section, i) => (
          <View key={i}>
            <Text style={styles.heading}>{section.heading}</Text>
            {section.paragraphs.map((paragraph, j) => (
              <Text key={j} style={styles.paragraph}>
                {paragraph}
              </Text>
            ))}
            {section.list?.map((item, k) => (
              <Text key={k} style={styles.listItem}>
                • {item}
              </Text>
            ))}
          </View>
        ))}

        <Text style={styles.disclaimer}>{kit.disclaimer}</Text>
      </Page>
    </Document>
  );
}

export async function renderKitPdf(kit: KitContent): Promise<Buffer> {
  return renderToBuffer(<KitDocument kit={kit} />);
}

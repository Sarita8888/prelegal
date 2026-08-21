import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import {
  ContentPart,
  STANDARD_TERMS_ATTRIBUTION,
  STANDARD_TERMS_SECTIONS,
  resolveCoverPageValues,
  tokenize,
} from "@/lib/ndaContent";
import { NdaFormData } from "@/lib/types";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 16, marginBottom: 4 },
  subtitle: { fontSize: 10, color: "#64748b", marginBottom: 16 },
  h2: { fontSize: 12, marginTop: 12, marginBottom: 8 },
  fieldLabel: { fontSize: 9, color: "#334155", marginBottom: 2 },
  fieldValue: {
    fontSize: 10,
    backgroundColor: "#fffbeb",
    padding: 4,
    marginBottom: 8,
  },
  paragraph: { marginBottom: 8, textAlign: "justify" },
  bold: { fontFamily: "Helvetica-Bold" },
  ref: { textDecoration: "underline" },
  attribution: { fontSize: 8, color: "#94a3b8", marginTop: 12 },
  table: { marginTop: 8, marginBottom: 8 },
  tableRow: { flexDirection: "row", borderBottom: "1px solid #e2e8f0" },
  tableHeaderCell: {
    flex: 1,
    padding: 4,
    fontFamily: "Helvetica-Bold",
    backgroundColor: "#f8fafc",
  },
  tableLabelCell: { width: 90, padding: 4, color: "#475569" },
  tableCell: { flex: 1, padding: 4 },
});

function RenderParts({ parts }: { parts: ContentPart[] }) {
  return (
    <Text style={styles.paragraph}>
      {parts.map((part, index) => {
        if (part.kind === "bold") {
          return (
            <Text key={index} style={styles.bold}>
              {part.text}
            </Text>
          );
        }
        if (part.kind === "ref") {
          return (
            <Text key={index} style={styles.ref}>
              {part.label}
            </Text>
          );
        }
        return <Text key={index}>{part.text}</Text>;
      })}
    </Text>
  );
}

export function NdaPdfDocument({ data }: { data: NdaFormData }) {
  const refValues = resolveCoverPageValues(data);
  const party1 = data.party1Name.trim() || "[Party 1]";
  const party2 = data.party2Name.trim() || "[Party 2]";
  const signatureRows: [string, string, string][] = [
    ["Signature", "", ""],
    ["Print Name", "", ""],
    ["Title", "", ""],
    ["Company", party1, party2],
    ["Notice Address", "", ""],
    ["Date", "", ""],
  ];

  return (
    <Document title="Mutual Non-Disclosure Agreement">
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>Mutual Non-Disclosure Agreement</Text>
        <Text style={styles.subtitle}>
          Between {party1} and {party2}
        </Text>

        <Text style={styles.h2}>Cover Page</Text>

        <Text style={styles.fieldLabel}>Purpose</Text>
        <Text style={styles.fieldValue}>{refValues.purpose}</Text>

        <Text style={styles.fieldLabel}>Effective Date</Text>
        <Text style={styles.fieldValue}>{refValues.effectiveDate}</Text>

        <Text style={styles.fieldLabel}>MNDA Term</Text>
        <Text style={styles.fieldValue}>{refValues.mndaTerm}</Text>

        <Text style={styles.fieldLabel}>Term of Confidentiality</Text>
        <Text style={styles.fieldValue}>{refValues.confidentialityTerm}</Text>

        <Text style={styles.fieldLabel}>Governing Law</Text>
        <Text style={styles.fieldValue}>{refValues.governingLaw}</Text>

        <Text style={styles.fieldLabel}>Jurisdiction</Text>
        <Text style={styles.fieldValue}>{refValues.jurisdiction}</Text>

        {data.modifications.trim() && (
          <>
            <Text style={styles.fieldLabel}>MNDA Modifications</Text>
            <Text style={styles.fieldValue}>{data.modifications}</Text>
          </>
        )}

        <View style={styles.table}>
          <View style={styles.tableRow}>
            <View style={styles.tableLabelCell} />
            <Text style={styles.tableHeaderCell}>Party 1</Text>
            <Text style={styles.tableHeaderCell}>Party 2</Text>
          </View>
          {signatureRows.map(([label, v1, v2]) => (
            <View style={styles.tableRow} key={label}>
              <Text style={styles.tableLabelCell}>{label}</Text>
              <Text style={styles.tableCell}>{v1}</Text>
              <Text style={styles.tableCell}>{v2}</Text>
            </View>
          ))}
        </View>
      </Page>

      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Standard Terms</Text>
        {STANDARD_TERMS_SECTIONS.map((template, index) => (
          <RenderParts key={index} parts={tokenize(template)} />
        ))}
        <Text style={styles.attribution}>{STANDARD_TERMS_ATTRIBUTION}</Text>
      </Page>
    </Document>
  );
}

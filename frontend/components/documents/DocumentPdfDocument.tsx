import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import { getDocumentSchema } from "@/lib/documents/registry";
import { TEMPLATES } from "@/lib/documents/generated/templates.generated";
import { Block, resolveFieldDisplayValue } from "@/lib/documents/templateIR";

const styles = StyleSheet.create({
  page: { padding: 48, fontSize: 10, fontFamily: "Helvetica", lineHeight: 1.4 },
  title: { fontSize: 16, marginBottom: 16 },
  h2: { fontSize: 12, marginTop: 12, marginBottom: 8 },
  fieldLabel: { fontSize: 9, color: "#334155", marginBottom: 2 },
  fieldValue: { fontSize: 10, backgroundColor: "#fffbeb", padding: 4, marginBottom: 8 },
  paragraph: { marginBottom: 6, textAlign: "justify" },
  bold: { fontFamily: "Helvetica-Bold" },
  ref: { textDecoration: "underline" },
});

export function DocumentPdfDocument({
  documentType,
  documentName,
  data,
}: {
  documentType: string;
  documentName: string;
  data: Record<string, string | null | undefined>;
}) {
  const schema = getDocumentSchema(documentType);
  const template = TEMPLATES[documentType];

  return (
    <Document title={documentName}>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.title}>{documentName}</Text>
        <Text style={styles.h2}>Details</Text>
        {(schema?.fields ?? []).map((field) => (
          <View key={field.key}>
            <Text style={styles.fieldLabel}>{field.label}</Text>
            <Text style={styles.fieldValue}>{resolveFieldDisplayValue(field.key, field.label, data)}</Text>
          </View>
        ))}
      </Page>
      <Page size="LETTER" style={styles.page}>
        <Text style={styles.h2}>Standard Terms</Text>
        {(template?.blocks ?? []).map((block, index) => (
          <BlockText key={index} block={block} documentType={documentType} />
        ))}
      </Page>
    </Document>
  );
}

function BlockText({
  block,
  documentType,
}: {
  block: Block;
  documentType: string;
}) {
  const schema = getDocumentSchema(documentType);
  return (
    <Text style={[styles.paragraph, { marginLeft: block.depth * 12 }]}>
      {block.marker ? `${block.marker} ` : ""}
      {block.parts.map((part, index) => {
        if (part.kind === "bold") {
          return (
            <Text key={index} style={styles.bold}>
              {part.text}
            </Text>
          );
        }
        if (part.kind === "field") {
          const label = schema?.fields.find((field) => field.key === part.fieldKey)?.label ?? part.fieldKey;
          return (
            <Text key={index} style={styles.ref}>
              {label}
              {part.suffix}
            </Text>
          );
        }
        return <Text key={index}>{part.text}</Text>;
      })}
    </Text>
  );
}

import { getDocumentSchema } from "@/lib/documents/registry";
import { TEMPLATES } from "@/lib/documents/generated/templates.generated";
import { Block, InlinePart, resolveFieldDisplayValue } from "@/lib/documents/templateIR";

export function DocumentPreview({
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
  if (!schema || !template) return null;

  return (
    <article className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
      <header className="mb-6 border-b border-slate-200 pb-6">
        <h1 className="text-2xl font-semibold text-slate-900">{documentName}</h1>
      </header>

      <section className="mb-8">
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Details</h2>
        {schema.fields.map((field) => (
          <div className="mb-3" key={field.key}>
            <div className="text-sm font-medium text-slate-700">
              {field.label}
              {field.required && " *"}
            </div>
            <div className="mt-0.5 whitespace-pre-wrap rounded bg-amber-50 px-2 py-1 text-sm text-slate-900">
              {resolveFieldDisplayValue(field.key, field.label, data)}
            </div>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-slate-900">Standard Terms</h2>
        {template.blocks.map((block, index) => (
          <BlockView key={index} block={block} documentType={documentType} data={data} />
        ))}
      </section>
    </article>
  );
}

function BlockView({
  block,
  documentType,
  data,
}: {
  block: Block;
  documentType: string;
  data: Record<string, string | null | undefined>;
}) {
  return (
    <p className="mb-3 text-justify leading-relaxed" style={{ marginLeft: `${block.depth * 1.5}rem` }}>
      {block.marker && <span className="mr-1 text-slate-500">{block.marker}</span>}
      {block.parts.map((part, index) => (
        <PartView key={index} part={part} documentType={documentType} data={data} />
      ))}
    </p>
  );
}

function PartView({
  part,
  documentType,
  data,
}: {
  part: InlinePart;
  documentType: string;
  data: Record<string, string | null | undefined>;
}) {
  if (part.kind === "bold") {
    return <strong>{part.text}</strong>;
  }
  if (part.kind === "field") {
    const label = getDocumentSchema(documentType)?.fields.find((field) => field.key === part.fieldKey)?.label ?? part.fieldKey;
    const value = resolveFieldDisplayValue(part.fieldKey, label, data);
    return (
      <span
        className="cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2"
        title={value}
      >
        {label}
        {part.suffix}
      </span>
    );
  }
  return <>{part.text}</>;
}

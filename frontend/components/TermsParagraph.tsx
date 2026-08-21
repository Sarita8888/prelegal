import { ContentPart, RefKey, tokenize } from "@/lib/ndaContent";

export function TermsParagraph({
  template,
  refValues,
}: {
  template: string;
  refValues: Record<RefKey, string>;
}) {
  const parts = tokenize(template);
  return (
    <p className="mb-4 text-justify leading-relaxed">
      {parts.map((part, index) => (
        <Part key={index} part={part} refValues={refValues} />
      ))}
    </p>
  );
}

function Part({
  part,
  refValues,
}: {
  part: ContentPart;
  refValues: Record<RefKey, string>;
}) {
  switch (part.kind) {
    case "bold":
      return <strong>{part.text}</strong>;
    case "ref":
      return (
        <span
          className="cursor-help underline decoration-dotted decoration-slate-400 underline-offset-2"
          title={refValues[part.key]}
        >
          {part.label}
        </span>
      );
    case "text":
    default:
      return <>{part.text}</>;
  }
}

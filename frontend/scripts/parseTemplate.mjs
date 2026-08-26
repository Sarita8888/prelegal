// Parses one Common Paper template markdown file into a generic block/inline
// IR, resolving `<span class="..._link">Label</span>` references against a
// per-document field registry. Pure, framework-free — used only by
// build-templates.mjs at build time, never shipped to the browser.

function buildLabelIndex(fields) {
  const index = new Map();
  for (const field of fields) {
    const normalized = field.label.trim().toLowerCase();
    index.set(normalized, field.key);
    if (!normalized.endsWith("s")) {
      index.set(`${normalized}s`, field.key);
    }
  }
  return index;
}

function stripPossessive(text) {
  const match = /^(.*?)(['’]s)$/.exec(text.trim());
  if (match) {
    return { base: match[1], suffix: match[2] };
  }
  return { base: text.trim(), suffix: "" };
}

function extractClass(attrs) {
  const match = /class="([\w-]+)"/.exec(attrs || "");
  return match ? match[1] : null;
}

// A fresh RegExp per call (not a shared module-level `g` regex) — tokenizeInline
// recurses on unwrapped span content, and a shared stateful regex's `lastIndex`
// would get corrupted between the outer loop and the recursive call.
function tokenizeInline(text, labelIndex, warnings) {
  const inlineRe = /<span([^>]*)>([^<]*)<\/span>|<\/?span[^>]*>|\*\*(.+?)\*\*/g;
  const parts = [];
  let lastIndex = 0;
  let match;
  while ((match = inlineRe.exec(text))) {
    if (match.index > lastIndex) {
      parts.push({ kind: "text", text: text.slice(lastIndex, match.index) });
    }
    const [, attrs, inner, boldText] = match;
    if (inner !== undefined) {
      const cls = extractClass(attrs);
      if (cls === "header_2" || cls === "header_3") {
        if (inner.trim()) parts.push({ kind: "bold", text: inner });
      } else if (cls && cls.endsWith("_link")) {
        const { base, suffix } = stripPossessive(inner);
        const fieldKey = labelIndex.get(base.toLowerCase());
        if (fieldKey) {
          parts.push({ kind: "field", fieldKey, suffix });
        } else {
          warnings.push(`Unmatched field label "${base}"`);
          if (inner.trim()) parts.push({ kind: "text", text: inner });
        }
      } else if (inner.trim()) {
        parts.push(...tokenizeInline(inner, labelIndex, warnings));
      }
    } else if (boldText !== undefined) {
      // Bold markdown can itself wrap a field-reference span (e.g.
      // "**...the <span class="keyterms_link">General Cap Amount</span>...**"),
      // so recurse and only promote the plain-text pieces to bold.
      for (const innerPart of tokenizeInline(boldText, labelIndex, warnings)) {
        parts.push(innerPart.kind === "text" ? { kind: "bold", text: innerPart.text } : innerPart);
      }
    }
    // else: a bare/stray <span ...> or </span> tag with no captured groups — drop it.
    lastIndex = inlineRe.lastIndex;
  }
  if (lastIndex < text.length) {
    parts.push({ kind: "text", text: text.slice(lastIndex) });
  }
  return parts;
}

const LIST_ITEM_RE = /^(\s*)([A-Za-z0-9]+\.)\s+(.*)$/;

export function parseTemplate(markdown, fields, warnings = []) {
  const labelIndex = buildLabelIndex(fields);
  const lines = markdown.split(/\r?\n/);
  let title = "";
  const blocks = [];

  for (const rawLine of lines) {
    const line = rawLine.replace(/\s+$/, "");
    if (!line.trim()) continue;

    const titleMatch = /^#\s+(.*)$/.exec(line);
    if (titleMatch) {
      title = titleMatch[1].trim();
      continue;
    }

    const itemMatch = LIST_ITEM_RE.exec(line);
    if (itemMatch) {
      const [, indent, marker, rest] = itemMatch;
      const depth = Math.round(indent.length / 4);
      const parts = tokenizeInline(rest, labelIndex, warnings);
      if (parts.length > 0) blocks.push({ depth, marker, parts });
      continue;
    }

    const parts = tokenizeInline(line.trim(), labelIndex, warnings);
    if (parts.length > 0) blocks.push({ depth: 0, marker: "", parts });
  }

  return { title, blocks };
}

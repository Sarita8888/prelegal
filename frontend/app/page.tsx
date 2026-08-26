"use client";

import { useState } from "react";
import { DocumentPicker } from "@/components/DocumentPicker";
import { DocumentWorkspace } from "@/components/DocumentWorkspace";

type Screen =
  | { kind: "picker" }
  | { kind: "workspace"; documentType: string; documentName: string };

export default function Home() {
  const [screen, setScreen] = useState<Screen>({ kind: "picker" });

  if (screen.kind === "picker") {
    return (
      <DocumentPicker
        onSelect={(documentType, documentName) =>
          setScreen({ kind: "workspace", documentType, documentName })
        }
      />
    );
  }

  return (
    <DocumentWorkspace
      documentType={screen.documentType}
      documentName={screen.documentName}
      onSwitchDocumentType={(documentType, documentName) =>
        setScreen({ kind: "workspace", documentType, documentName })
      }
      onBackToPicker={() => setScreen({ kind: "picker" })}
    />
  );
}

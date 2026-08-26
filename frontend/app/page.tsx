"use client";

import { useState } from "react";
import { AuthScreen } from "@/components/auth/AuthScreen";
import { DocumentPicker } from "@/components/DocumentPicker";
import { DocumentWorkspace } from "@/components/DocumentWorkspace";
import { Header } from "@/components/Header";
import { MyDocuments } from "@/components/MyDocuments";
import { SavedDocumentView } from "@/components/SavedDocumentView";
import { AuthProvider, useAuth } from "@/lib/AuthContext";
import { SavedDocument } from "@/lib/documents";

type Screen =
  | { kind: "picker" }
  | { kind: "workspace"; documentType: string; documentName: string }
  | { kind: "signin" }
  | { kind: "signup" }
  | { kind: "documents" }
  | { kind: "saved-document"; document: SavedDocument };

function HomeContent() {
  const [screen, setScreen] = useState<Screen>({ kind: "picker" });
  const { user } = useAuth();

  function goToPicker() {
    setScreen({ kind: "picker" });
  }

  function goToDocuments() {
    setScreen(user ? { kind: "documents" } : { kind: "signin" });
  }

  return (
    <>
      <Header
        onNewDocument={goToPicker}
        onMyDocuments={goToDocuments}
        onSignIn={() => setScreen({ kind: "signin" })}
        onSignUp={() => setScreen({ kind: "signup" })}
      />

      {screen.kind === "picker" && (
        <DocumentPicker
          onSelect={(documentType, documentName) => setScreen({ kind: "workspace", documentType, documentName })}
        />
      )}

      {screen.kind === "workspace" && (
        <DocumentWorkspace
          documentType={screen.documentType}
          documentName={screen.documentName}
          onSwitchDocumentType={(documentType, documentName) =>
            setScreen({ kind: "workspace", documentType, documentName })
          }
          onBackToPicker={goToPicker}
          onRequestSignIn={() => setScreen({ kind: "signin" })}
        />
      )}

      {screen.kind === "signin" && (
        <AuthScreen mode="signin" onSuccess={goToPicker} onSwitchMode={() => setScreen({ kind: "signup" })} />
      )}

      {screen.kind === "signup" && (
        <AuthScreen mode="signup" onSuccess={goToPicker} onSwitchMode={() => setScreen({ kind: "signin" })} />
      )}

      {screen.kind === "documents" && (
        <MyDocuments onOpen={(document) => setScreen({ kind: "saved-document", document })} onBack={goToPicker} />
      )}

      {screen.kind === "saved-document" && (
        <SavedDocumentView document={screen.document} onBack={goToDocuments} />
      )}
    </>
  );
}

export default function Home() {
  return (
    <AuthProvider>
      <HomeContent />
    </AuthProvider>
  );
}

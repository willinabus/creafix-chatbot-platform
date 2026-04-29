/**
 * DocSection
 * Company documentation upload (preparation for RAG)
 */

"use client";

import { useState } from "react";
import { Upload, FileText, Trash2 } from "lucide-react";

interface DocSectionProps {
  docs: Array<{ name: string; content: string }>;
  onChange: (docs: Array<{ name: string; content: string }>) => void;
}

export function DocSection({ docs, onChange }: DocSectionProps) {
  const [isDragging, setIsDragging] = useState(false);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    // For demo, we just note the file names
    const files = Array.from(e.dataTransfer.files);
    const newDocs = files.map((file) => ({
      name: file.name,
      content: `[Contenu de ${file.name} — extraction texte côté backend prévue V2]`,
    }));
    onChange([...docs, ...newDocs]);
  };

  const removeDoc = (index: number) => {
    onChange(docs.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-6">
      <div>
        <h2
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Documentation Entreprise
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Documents que le chatbot pourra consulter pour répondre (préparation RAG)
        </p>
      </div>

      {/* Drop zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className="border-2 border-dashed p-8 text-center transition-colors cursor-pointer"
        style={{
          borderColor: isDragging ? "#3898EC" : "#E0E0E0",
          background: isDragging ? "rgba(56,152,236,0.02)" : "transparent",
          borderRadius: "2px",
        }}
      >
        <Upload
          size={24}
          style={{ color: isDragging ? "#3898EC" : "rgba(0,0,0,0.32)", margin: "0 auto 12px" }}
        />
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.62)",
          }}
        >
          Glissez-déposez des fichiers PDF ou DOCX ici
        </p>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "11px",
            color: "rgba(0,0,0,0.32)",
            marginTop: "4px",
          }}
        >
          Ou cliquez pour sélectionner des fichiers
        </p>
      </div>

      {/* File list */}
      {docs.length > 0 && (
        <div className="space-y-2">
          <h3
            style={{
              fontFamily: "'Space Mono', monospace",
              fontSize: "12px",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              color: "rgba(0,0,0,0.58)",
            }}
          >
            Fichiers ({docs.length})
          </h3>
          {docs.map((doc, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border border-[#E0E0E0]"
              style={{ borderRadius: "2px" }}
            >
              <div className="flex items-center gap-3">
                <FileText size={16} color="rgba(0,0,0,0.42)" />
                <span
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                  }}
                >
                  {doc.name}
                </span>
              </div>
              <button
                onClick={() => removeDoc(i)}
                className="hover:text-red-600 transition-colors"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))}
        </div>
      )}

      <div
        className="p-4 border border-[#E0E0E0]"
        style={{ borderRadius: "2px", background: "rgba(34,197,94,0.03)" }}
      >
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "12px",
            color: "rgba(0,0,0,0.52)",
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: "#22C55E" }}>V2 :</strong> L&apos;extraction de texte
          côté backend et l&apos;intégration RAG (Retrieval Augmented Generation) seront
          implémentées pour permettre au chatbot de répondre à partir de vos documents.
        </p>
      </div>
    </div>
  );
}

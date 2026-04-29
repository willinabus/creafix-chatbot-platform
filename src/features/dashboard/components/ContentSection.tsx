/**
 * ContentSection
 * Quick replies, FAQ, services, tone configuration
 */

"use client";

import { useState } from "react";
import { X, Plus } from "lucide-react";

interface ContentSectionProps {
  content: {
    quickReplies: Array<{ id: string; label: string; action: string }>;
    faq: Array<{ question: string; answer: string }>;
    services: Array<{ name: string; description: string; price?: string }>;
    tone: string;
    humanFallbackCta: string;
    hours: string;
    address: string;
    contact: string;
  };
  onChange: (values: Partial<ContentSectionProps["content"]>) => void;
}

export function ContentSection({ content, onChange }: ContentSectionProps) {
  const [newReply, setNewReply] = useState("");
  const [newFaqQ, setNewFaqQ] = useState("");
  const [newFaqA, setNewFaqA] = useState("");
  const [newServiceName, setNewServiceName] = useState("");
  const [newServiceDesc, setNewServiceDesc] = useState("");
  const [newServicePrice, setNewServicePrice] = useState("");

  const addQuickReply = () => {
    if (!newReply.trim()) return;
    onChange({
      quickReplies: [
        ...content.quickReplies,
        { id: `qr-${Date.now()}`, label: newReply, action: "custom" },
      ],
    });
    setNewReply("");
  };

  const removeQuickReply = (id: string) => {
    onChange({ quickReplies: content.quickReplies.filter((r) => r.id !== id) });
  };

  const addFaq = () => {
    if (!newFaqQ.trim() || !newFaqA.trim()) return;
    onChange({
      faq: [...content.faq, { question: newFaqQ, answer: newFaqA }],
    });
    setNewFaqQ("");
    setNewFaqA("");
  };

  const removeFaq = (index: number) => {
    onChange({ faq: content.faq.filter((_, i) => i !== index) });
  };

  const addService = () => {
    if (!newServiceName.trim()) return;
    onChange({
      services: [
        ...content.services,
        {
          name: newServiceName,
          description: newServiceDesc,
          price: newServicePrice || undefined,
        },
      ],
    });
    setNewServiceName("");
    setNewServiceDesc("");
    setNewServicePrice("");
  };

  const removeService = (index: number) => {
    onChange({ services: content.services.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-8">
      <div>
        <h2
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "24px",
            fontWeight: 700,
            marginBottom: "8px",
          }}
        >
          Contenu & Comportement
        </h2>
        <p
          style={{
            fontFamily: "'Space Mono', monospace",
            fontSize: "13px",
            color: "rgba(0,0,0,0.52)",
          }}
        >
          Configurez les messages, services et réponses rapides
        </p>
      </div>

      {/* Quick Replies */}
      <div>
        <h3 className="dashboard-section-title">Quick Replies initiales</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          {content.quickReplies.map((reply) => (
            <span
              key={reply.id}
              className="inline-flex items-center gap-1 px-2 py-1 border border-[#E0E0E0]"
              style={{
                fontFamily: "'Space Mono', monospace",
                fontSize: "12px",
                borderRadius: "2px",
              }}
            >
              {reply.label}
              <button
                onClick={() => removeQuickReply(reply.id)}
                className="ml-1 hover:text-red-600"
              >
                <X size={12} />
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={newReply}
            onChange={(e) => setNewReply(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addQuickReply()}
            placeholder="Nouvelle réponse rapide"
            className="dashboard-input flex-1"
          />
          <button
            onClick={addQuickReply}
            className="dashboard-btn-primary"
          >
            <Plus size={16} />
          </button>
        </div>
      </div>

      {/* Services */}
      <div>
        <h3 className="dashboard-section-title">Services</h3>
        <div className="space-y-2 mb-3">
          {content.services.map((service, i) => (
            <div
              key={i}
              className="flex items-center justify-between p-3 border border-[#E0E0E0]"
              style={{ borderRadius: "2px" }}
            >
              <div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                  }}
                >
                  {service.name}
                </div>
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "12px",
                    color: "rgba(0,0,0,0.52)",
                  }}
                >
                  {service.description} {service.price && `— ${service.price}`}
                </div>
              </div>
              <button onClick={() => removeService(i)} className="hover:text-red-600">
                <X size={16} />
              </button>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
          <input
            type="text"
            value={newServiceName}
            onChange={(e) => setNewServiceName(e.target.value)}
            placeholder="Nom du service"
            className="dashboard-input"
          />
          <input
            type="text"
            value={newServiceDesc}
            onChange={(e) => setNewServiceDesc(e.target.value)}
            placeholder="Description"
            className="dashboard-input"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newServicePrice}
              onChange={(e) => setNewServicePrice(e.target.value)}
              placeholder="Prix"
              className="dashboard-input flex-1"
            />
            <button onClick={addService} className="dashboard-btn-primary">
              <Plus size={16} />
            </button>
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div>
        <h3 className="dashboard-section-title">FAQ</h3>
        <div className="space-y-2 mb-3">
          {content.faq.map((item, i) => (
            <div
              key={i}
              className="p-3 border border-[#E0E0E0]"
              style={{ borderRadius: "2px" }}
            >
              <div className="flex items-start justify-between">
                <div
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "13px",
                    fontWeight: 700,
                    marginBottom: "4px",
                  }}
                >
                  {item.question}
                </div>
                <button onClick={() => removeFaq(i)} className="hover:text-red-600">
                  <X size={16} />
                </button>
              </div>
              <div
                style={{
                  fontFamily: "'Space Mono', monospace",
                  fontSize: "12px",
                  color: "rgba(0,0,0,0.62)",
                }}
              >
                {item.answer}
              </div>
            </div>
          ))}
        </div>
        <div className="grid grid-cols-1 gap-2">
          <input
            type="text"
            value={newFaqQ}
            onChange={(e) => setNewFaqQ(e.target.value)}
            placeholder="Question"
            className="dashboard-input"
          />
          <textarea
            value={newFaqA}
            onChange={(e) => setNewFaqA(e.target.value)}
            placeholder="Réponse"
            className="dashboard-input"
            rows={2}
          />
          <button onClick={addFaq} className="dashboard-btn-primary self-start">
            Ajouter une FAQ
          </button>
        </div>
      </div>

      {/* Info fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="dashboard-label">Ton du chatbot</label>
          <input
            type="text"
            value={content.tone}
            onChange={(e) => onChange({ tone: e.target.value })}
            className="dashboard-input"
          />
        </div>
        <div>
          <label className="dashboard-label">CTA Fallback humain</label>
          <input
            type="text"
            value={content.humanFallbackCta}
            onChange={(e) => onChange({ humanFallbackCta: e.target.value })}
            className="dashboard-input"
          />
        </div>
        <div>
          <label className="dashboard-label">Horaires</label>
          <input
            type="text"
            value={content.hours}
            onChange={(e) => onChange({ hours: e.target.value })}
            className="dashboard-input"
          />
        </div>
        <div>
          <label className="dashboard-label">Adresse</label>
          <input
            type="text"
            value={content.address}
            onChange={(e) => onChange({ address: e.target.value })}
            className="dashboard-input"
          />
        </div>
        <div className="md:col-span-2">
          <label className="dashboard-label">Contact</label>
          <input
            type="text"
            value={content.contact}
            onChange={(e) => onChange({ contact: e.target.value })}
            className="dashboard-input"
          />
        </div>
      </div>
    </div>
  );
}

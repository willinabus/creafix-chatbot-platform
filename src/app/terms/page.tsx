/**
 * Terms of Service Page
 * Required for Google OAuth app verification
 */

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Mono', monospace" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          Conditions d&apos;utilisation
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.52)", marginBottom: "32px" }}>
          Dernière mise à jour : avril 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>1. Description du service</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            CreaFix Chatbots fournit des assistants conversationnels intelligents pour les entreprises
            locales (salons, restaurants, commerces). Le service inclut la prise de rendez-vous
            automatisée via Google Calendar avec le consentement explicite du client.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>2. Accès Google Calendar</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            En connectant votre compte Google, vous autorisez CreaFix à :
          </p>
          <ul style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6, paddingLeft: "20px", marginTop: "8px" }}>
            <li>Lire les disponibilités de votre calendrier</li>
            <li>Créer des événements de rendez-vous</li>
          </ul>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6, marginTop: "8px" }}>
            Aucun accès à vos emails, documents ou autres données Google n&apos;est demandé ni utilisé.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>3. Responsabilités</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            Vous êtes responsable des informations fournies à votre chatbot (services, tarifs,
            horaires). CreaFix ne peut être tenu responsable des rendez-vous manqués ou des
            erreurs de communication résultant d&apos;informations incorrectes.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>4. Résiliation</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            Vous pouvez révoquer l&apos;accès à Google Calendar à tout moment depuis votre
            compte Google (Sécurité &gt; Accès des applications tierces). Vos données seront
            conservées 30 jours maximum puis définitivement supprimées.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>5. Contact</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            Pour toute question : amadeokalil@gmail.com
          </p>
        </section>
      </div>
    </div>
  );
}

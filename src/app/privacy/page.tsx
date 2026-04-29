/**
 * Privacy Policy Page
 * Required for Google OAuth app verification
 */

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "'Space Mono', monospace" }}>
      <div className="max-w-2xl mx-auto px-6 py-16">
        <h1 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>
          Politique de confidentialité
        </h1>
        <p style={{ fontSize: "13px", color: "rgba(0,0,0,0.52)", marginBottom: "32px" }}>
          Dernière mise à jour : avril 2026
        </p>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>1. Collecte des données</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            CreaFix Chatbot collecte uniquement les données nécessaires au fonctionnement du service :
            messages de conversation, informations de rendez-vous (nom, téléphone, email) et données
            de calendrier Google uniquement après consentement explicite de l&apos;utilisateur.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>2. Utilisation des données Google Calendar</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            L&apos;accès au calendrier Google est utilisé uniquement pour vérifier les disponibilités
            et créer des rendez-vous au nom de l&apos;entreprise cliente. Aucune donnée n&apos;est partagée
            avec des tiers. Le token d&apos;accès est stocké de manière sécurisée et chiffrée.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>3. Stockage et sécurité</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            Les données sont stockées sur des serveurs sécurisés (Supabase / PostgreSQL) avec
            chiffrement en transit (HTTPS/TLS). Nous ne vendons ni ne louons vos données.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>4. Suppression des données</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            Vous pouvez demander la suppression de vos données à tout moment en contactant
            bonjour@creafix.ch. Les données de conversation et les tokens d&apos;accès seront
            définitivement supprimés dans un délai de 30 jours.
          </p>
        </section>

        <section style={{ marginBottom: "24px" }}>
          <h2 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "8px" }}>5. Contact</h2>
          <p style={{ fontSize: "14px", color: "rgba(0,0,0,0.68)", lineHeight: 1.6 }}>
            Pour toute question relative à cette politique : bonjour@creafix.ch
          </p>
        </section>
      </div>
    </div>
  );
}

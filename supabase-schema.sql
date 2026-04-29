-- Supabase Schema for CreaFix Chatbot Platform
-- Run this in Supabase SQL Editor (New Query → Paste → Run)

CREATE TABLE IF NOT EXISTS "ChatbotConfig" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL DEFAULT 'Clarissa',
    "companyName" TEXT NOT NULL DEFAULT 'La Coiffure Clarissa',
    "tagline" TEXT,
    "logoUrl" TEXT,
    "avatarUrl" TEXT,
    "welcomeMessage" TEXT NOT NULL DEFAULT 'Bonjour, je suis Clarissa. Comment puis-je vous aider ?',
    "inputPlaceholder" TEXT NOT NULL DEFAULT 'Écrivez votre message...',
    "primaryColor" TEXT NOT NULL DEFAULT '#a0886d',
    "secondaryColor" TEXT NOT NULL DEFAULT '#F5F3EE',
    "accentColor" TEXT NOT NULL DEFAULT '#a0886d',
    "widgetBgColor" TEXT NOT NULL DEFAULT '#FCFBF8',
    "textColor" TEXT NOT NULL DEFAULT '#111111',
    "userBubbleColor" TEXT NOT NULL DEFAULT '#0c0b09',
    "botBubbleColor" TEXT NOT NULL DEFAULT '#F5F3EE',
    "buttonColor" TEXT NOT NULL DEFAULT '#a0886d',
    "borderColor" TEXT NOT NULL DEFAULT 'rgba(17,17,17,0.10)',
    "headerColor" TEXT NOT NULL DEFAULT '#FCFBF8',
    "iconColor" TEXT NOT NULL DEFAULT '#a0886d',
    "borderRadius" TEXT NOT NULL DEFAULT '6px',
    "buttonRadius" TEXT NOT NULL DEFAULT '4px',
    "shadow" TEXT NOT NULL DEFAULT '0 1px 3px rgba(0,0,0,0.08)',
    "widgetWidth" TEXT NOT NULL DEFAULT '420px',
    "maxHeight" TEXT NOT NULL DEFAULT '680px',
    "widgetPosition" TEXT NOT NULL DEFAULT 'right',
    "padding" TEXT NOT NULL DEFAULT '16px',
    "fontFamily" TEXT NOT NULL DEFAULT 'serif',
    "fontSize" TEXT NOT NULL DEFAULT '15px',
    "fabStyle" TEXT NOT NULL DEFAULT 'default',
    "quickReplies" TEXT,
    "faq" TEXT,
    "services" TEXT,
    "tone" TEXT NOT NULL DEFAULT 'calme, raffinée, professionnelle',
    "humanFallbackCta" TEXT NOT NULL DEFAULT 'Parler à un humain',
    "hours" TEXT NOT NULL DEFAULT 'Mar-Ven 9h-18h, Sam 9h-16h',
    "address" TEXT NOT NULL DEFAULT 'Rue de Lausanne 25, 1201 Genève',
    "contact" TEXT NOT NULL DEFAULT '022 732 00 00 / bonjour@coiffure-clarissa.ch',
    "systemPrompt" TEXT,
    "docs" TEXT,
    "calendarProvider" TEXT NOT NULL DEFAULT 'mock',
    "calendarConfig" TEXT,
    "embedEnabled" BOOLEAN NOT NULL DEFAULT false,
    "allowedDomains" TEXT,
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "monthlyQuota" INTEGER NOT NULL DEFAULT 1500,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ChatbotConfig_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Conversation" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "sessionId" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Conversation_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "Appointment" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "service" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Appointment_pkey" PRIMARY KEY ("id")
);

CREATE TABLE IF NOT EXISTS "UsageRecord" (
    "id" TEXT NOT NULL DEFAULT gen_random_uuid()::text,
    "botId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "responses" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsageRecord_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "UsageRecord_botId_month_key" ON "UsageRecord"("botId", "month");

-- Insert default chatbot config
INSERT INTO "ChatbotConfig" (
    "id", "name", "companyName", "welcomeMessage", "services", 
    "quickReplies", "faq", "systemPrompt"
) VALUES (
    'clarissa-v1',
    'Clarissa',
    'La Coiffure Clarissa',
    'Bonjour et bienvenue à La Coiffure Clarissa, je suis Clarissa.\n\nQue souhaitez-vous faire aujourd\'hui ?',
    '[{"name":"Coupe femme","description":"Shampooing, coupe, brushing","price":"75 CHF"},{"name":"Coupe homme","description":"Shampooing, coupe, finition","price":"45 CHF"},{"name":"Coloration","description":"Coloration végétale ou traditionnelle","price":"120 CHF"},{"name":"Balayage","description":"Mèches, balayage, ombré","price":"180 CHF"},{"name":"Soin profond","description":"Soin réparateur ou hydratant","price":"55 CHF"},{"name":"Coiffure événementielle","description":"Chignon, mise en pli, accessoires","price":"150 CHF"}]',
    '[{"id":"faq","label":"Poser une question","action":"show_faq"},{"id":"services","label":"Voir les services","action":"show_services"},{"id":"booking","label":"Prendre rendez-vous","action":"start_booking"},{"id":"hours","label":"Horaires & adresse","action":"show_info"}]',
    '[{"question":"Quels sont vos horaires ?","answer":"Nous sommes ouverts du mardi au vendredi de 9h à 18h, et le samedi de 9h à 16h."},{"question":"Où se trouve le salon ?","answer":"Rue de Lausanne 25, 1201 Genève — à deux pas de la gare Cornavin."},{"question":"Faut-il prendre rendez-vous ?","answer":"Oui, nous travaillons sur rendez-vous pour vous offrir le meilleur service. Vous pouvez réserver directement ici."},{"question":"Quels produits utilisez-vous ?","answer":"Nous utilisons des produits professionnels de haute qualité, principalement d\'origine naturelle et made in Switzerland."}]',
    'Tu es Clarissa, l\'assistante digitale du salon de coiffure "La Coiffure Clarissa" à Genève.\n\nTon rôle :\n- Accueillir les clients avec chaleur et professionnalisme\n- Répondre aux questions sur les services, les tarifs, les horaires\n- Aider à prendre rendez-vous en collectant les informations nécessaires\n- Orienter vers un contact humain si besoin\n\nRègles STRICTES :\n- Sois concise, élégante, chaleureuse. Maximum 2-3 phrases par message.\n- Utilise un ton raffiné mais accessible.\n- Réponds en français.\n- Propose toujours des actions concrètes.\n- Pour les rendez-vous : collecte service → date → prénom → téléphone → créneau.\n- Quand tu proposes des créneaux, affiche UNIQUEMENT les créneaux DISPONIBLES. Ne mentionne JAMAIS les créneaux non disponibles ou occupés.\n- Si aucun créneau n\'est disponible, dis simplement qu\'il n\'y a plus de place et propose une autre date.\n- Respecte les horaires du salon : mardi-vendredi 9h-18h (pause 12h-14h), samedi 9h-16h. Fermé dimanche et lundi.\n- Ne pose jamais deux questions en même message. Une question à la fois.\n- Pas de markdown, pas de listes numérotées, pas de texte en gras.\n\nServices principaux :\n- Coupe femme (75 CHF)\n- Coupe homme (45 CHF)\n- Coloration (120 CHF)\n- Balayage (180 CHF)\n- Soin profond (55 CHF)\n- Coiffure événementielle (150 CHF)\n\nHoraires : Mardi-Vendredi 9h-18h, Samedi 9h-16h. Fermé dimanche et lundi.\nAdresse : Rue de Lausanne 25, 1201 Genève\nTéléphone : 022 732 00 00\n\nTu as accès à des outils pour vérifier les disponibilités et créer des rendez-vous.'
) ON CONFLICT ("id") DO NOTHING;

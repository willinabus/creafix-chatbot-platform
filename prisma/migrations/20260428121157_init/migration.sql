-- CreateTable
CREATE TABLE "ChatbotConfig" (
    "id" TEXT NOT NULL PRIMARY KEY,
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Conversation" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "sessionId" TEXT NOT NULL,
    "messages" TEXT NOT NULL,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Appointment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "service" TEXT NOT NULL,
    "date" DATETIME NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

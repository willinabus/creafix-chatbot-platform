-- CreateTable
CREATE TABLE "UsageRecord" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "botId" TEXT NOT NULL,
    "month" TEXT NOT NULL,
    "responses" INTEGER NOT NULL DEFAULT 0,
    "inputTokens" INTEGER NOT NULL DEFAULT 0,
    "outputTokens" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_ChatbotConfig" (
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
    "plan" TEXT NOT NULL DEFAULT 'starter',
    "monthlyQuota" INTEGER NOT NULL DEFAULT 1500,
    "status" TEXT NOT NULL DEFAULT 'active',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_ChatbotConfig" ("accentColor", "address", "allowedDomains", "avatarUrl", "borderColor", "borderRadius", "botBubbleColor", "buttonColor", "buttonRadius", "calendarConfig", "calendarProvider", "companyName", "contact", "createdAt", "docs", "embedEnabled", "fabStyle", "faq", "fontFamily", "fontSize", "headerColor", "hours", "humanFallbackCta", "iconColor", "id", "inputPlaceholder", "logoUrl", "maxHeight", "name", "padding", "primaryColor", "quickReplies", "secondaryColor", "services", "shadow", "systemPrompt", "tagline", "textColor", "tone", "updatedAt", "userBubbleColor", "welcomeMessage", "widgetBgColor", "widgetPosition", "widgetWidth") SELECT "accentColor", "address", "allowedDomains", "avatarUrl", "borderColor", "borderRadius", "botBubbleColor", "buttonColor", "buttonRadius", "calendarConfig", "calendarProvider", "companyName", "contact", "createdAt", "docs", "embedEnabled", "fabStyle", "faq", "fontFamily", "fontSize", "headerColor", "hours", "humanFallbackCta", "iconColor", "id", "inputPlaceholder", "logoUrl", "maxHeight", "name", "padding", "primaryColor", "quickReplies", "secondaryColor", "services", "shadow", "systemPrompt", "tagline", "textColor", "tone", "updatedAt", "userBubbleColor", "welcomeMessage", "widgetBgColor", "widgetPosition", "widgetWidth" FROM "ChatbotConfig";
DROP TABLE "ChatbotConfig";
ALTER TABLE "new_ChatbotConfig" RENAME TO "ChatbotConfig";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "UsageRecord_botId_month_key" ON "UsageRecord"("botId", "month");

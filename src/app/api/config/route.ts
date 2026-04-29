/**
 * Config API Route
 * CRUD for chatbot configuration via PostgreSQL (Supabase)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { defaultChatbotConfig, DEFAULT_SYSTEM_PROMPT } from "@/features/chatbot/config/chatbotConfig";

function flattenConfig(apiConfig: any) {
  const d = defaultChatbotConfig;
  // Helper: return value if truthy, else default (never store null)
  const v = (val: any, def: any) => val ?? def;
  return {
    id: apiConfig.id || 'clarissa-v1',
    name: v(apiConfig.branding?.name, d.branding.name),
    companyName: v(apiConfig.branding?.companyName, d.branding.companyName),
    tagline: v(apiConfig.branding?.tagline, d.branding.tagline),
    logoUrl: v(apiConfig.branding?.logoUrl, d.branding.logoUrl),
    avatarUrl: v(apiConfig.branding?.avatarUrl, d.branding.avatarUrl),
    welcomeMessage: v(apiConfig.branding?.welcomeMessage, d.branding.welcomeMessage),
    inputPlaceholder: v(apiConfig.branding?.inputPlaceholder, d.branding.inputPlaceholder),
    primaryColor: v(apiConfig.style?.primaryColor, d.style.primaryColor),
    secondaryColor: v(apiConfig.style?.secondaryColor, d.style.secondaryColor),
    accentColor: v(apiConfig.style?.accentColor, d.style.accentColor),
    widgetBgColor: v(apiConfig.style?.widgetBgColor, d.style.widgetBgColor),
    textColor: v(apiConfig.style?.textColor, d.style.textColor),
    userBubbleColor: v(apiConfig.style?.userBubbleColor, d.style.userBubbleColor),
    botBubbleColor: v(apiConfig.style?.botBubbleColor, d.style.botBubbleColor),
    buttonColor: v(apiConfig.style?.buttonColor, d.style.buttonColor),
    borderColor: v(apiConfig.style?.borderColor, d.style.borderColor),
    headerColor: v(apiConfig.style?.headerColor, d.style.headerColor),
    iconColor: v(apiConfig.style?.iconColor, d.style.iconColor),
    borderRadius: v(apiConfig.style?.borderRadius, d.style.borderRadius),
    buttonRadius: v(apiConfig.style?.buttonRadius, d.style.buttonRadius),
    shadow: v(apiConfig.style?.shadow, d.style.shadow),
    widgetWidth: v(apiConfig.style?.widgetWidth, d.style.widgetWidth),
    maxHeight: v(apiConfig.style?.maxHeight, d.style.maxHeight),
    widgetPosition: v(apiConfig.style?.widgetPosition, d.style.widgetPosition),
    padding: v(apiConfig.style?.padding, d.style.padding),
    fontFamily: v(apiConfig.style?.fontFamily, d.style.fontFamily),
    fontSize: v(apiConfig.style?.fontSize, d.style.fontSize),
    fabStyle: v(apiConfig.style?.fabStyle, d.style.fabStyle),
    quickReplies: apiConfig.content?.quickReplies ? JSON.stringify(apiConfig.content.quickReplies) : JSON.stringify(d.content.quickReplies),
    faq: apiConfig.content?.faq ? JSON.stringify(apiConfig.content.faq) : JSON.stringify(d.content.faq),
    services: apiConfig.content?.services ? JSON.stringify(apiConfig.content.services) : JSON.stringify(d.content.services),
    tone: v(apiConfig.content?.tone, d.content.tone),
    humanFallbackCta: v(apiConfig.content?.humanFallbackCta, d.content.humanFallbackCta),
    hours: v(apiConfig.content?.hours, d.content.hours),
    address: v(apiConfig.content?.address, d.content.address),
    contact: v(apiConfig.content?.contact, d.content.contact),
    systemPrompt: v(apiConfig.systemPrompt, DEFAULT_SYSTEM_PROMPT),
    docs: apiConfig.docs ? JSON.stringify(apiConfig.docs) : JSON.stringify(d.docs),
    calendarProvider: v(apiConfig.calendarProvider, d.calendarProvider),
    calendarConfig: apiConfig.calendarConfig ? JSON.stringify(apiConfig.calendarConfig) : JSON.stringify(d.calendarConfig),
    embedEnabled: apiConfig.embedEnabled ?? d.embedEnabled,
    allowedDomains: apiConfig.allowedDomains ? JSON.stringify(apiConfig.allowedDomains) : JSON.stringify(d.allowedDomains),
  };
}

function unflattenConfig(dbConfig: any) {
  const d = defaultChatbotConfig;
  return {
    id: dbConfig.id || d.id,
    branding: {
      name: dbConfig.name || d.branding.name,
      companyName: dbConfig.companyName || d.branding.companyName,
      tagline: dbConfig.tagline || d.branding.tagline,
      logoUrl: dbConfig.logoUrl || d.branding.logoUrl,
      avatarUrl: dbConfig.avatarUrl || d.branding.avatarUrl,
      welcomeMessage: dbConfig.welcomeMessage || d.branding.welcomeMessage,
      inputPlaceholder: dbConfig.inputPlaceholder || d.branding.inputPlaceholder,
    },
    style: {
      primaryColor: dbConfig.primaryColor || d.style.primaryColor,
      secondaryColor: dbConfig.secondaryColor || d.style.secondaryColor,
      accentColor: dbConfig.accentColor || d.style.accentColor,
      widgetBgColor: dbConfig.widgetBgColor || d.style.widgetBgColor,
      textColor: dbConfig.textColor || d.style.textColor,
      userBubbleColor: dbConfig.userBubbleColor || d.style.userBubbleColor,
      botBubbleColor: dbConfig.botBubbleColor || d.style.botBubbleColor,
      buttonColor: dbConfig.buttonColor || d.style.buttonColor,
      borderColor: dbConfig.borderColor || d.style.borderColor,
      headerColor: dbConfig.headerColor || d.style.headerColor,
      iconColor: dbConfig.iconColor || d.style.iconColor,
      borderRadius: dbConfig.borderRadius || d.style.borderRadius,
      buttonRadius: dbConfig.buttonRadius || d.style.buttonRadius,
      shadow: dbConfig.shadow || d.style.shadow,
      widgetWidth: dbConfig.widgetWidth || d.style.widgetWidth,
      maxHeight: dbConfig.maxHeight || d.style.maxHeight,
      widgetPosition: dbConfig.widgetPosition || d.style.widgetPosition,
      padding: dbConfig.padding || d.style.padding,
      fontFamily: dbConfig.fontFamily || d.style.fontFamily,
      fontSize: dbConfig.fontSize || d.style.fontSize,
      fabStyle: dbConfig.fabStyle || d.style.fabStyle,
    },
    content: {
      quickReplies: dbConfig.quickReplies ? JSON.parse(dbConfig.quickReplies) : d.content.quickReplies,
      faq: dbConfig.faq ? JSON.parse(dbConfig.faq) : d.content.faq,
      services: dbConfig.services ? JSON.parse(dbConfig.services) : d.content.services,
      tone: dbConfig.tone || d.content.tone,
      humanFallbackCta: dbConfig.humanFallbackCta || d.content.humanFallbackCta,
      hours: dbConfig.hours || d.content.hours,
      address: dbConfig.address || d.content.address,
      contact: dbConfig.contact || d.content.contact,
    },
    systemPrompt: dbConfig.systemPrompt || DEFAULT_SYSTEM_PROMPT,
    docs: dbConfig.docs ? JSON.parse(dbConfig.docs) : d.docs,
    calendarProvider: dbConfig.calendarProvider || d.calendarProvider,
    calendarConfig: dbConfig.calendarConfig ? JSON.parse(dbConfig.calendarConfig) : d.calendarConfig,
    embedEnabled: dbConfig.embedEnabled ?? d.embedEnabled,
    allowedDomains: dbConfig.allowedDomains ? JSON.parse(dbConfig.allowedDomains) : d.allowedDomains,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId") || "clarissa-v1";

    const dbConfig = await prisma.chatbotConfig.findUnique({
      where: { id: botId },
    });

    if (!dbConfig) {
      return NextResponse.json(
        { success: false, error: "Config not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, data: unflattenConfig(dbConfig) });
  } catch (error) {
    console.error("[API /config] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to load config" },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const botId = body.id || "clarissa-v1";
    const flat = flattenConfig(body);

    const { id, ...flatWithoutId } = flat;
    const updated = await prisma.chatbotConfig.upsert({
      where: { id: botId },
      update: flatWithoutId,
      create: { id: botId, ...flatWithoutId },
    });

    return NextResponse.json({ success: true, data: unflattenConfig(updated) });
  } catch (error) {
    console.error("[API /config] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to save config" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const botId = searchParams.get("botId") || "clarissa-v1";

    // Reset to defaults (delete the override)
    await prisma.chatbotConfig.delete({
      where: { id: botId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[API /config] Error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to reset config" },
      { status: 500 }
    );
  }
}

/**
 * Config API Route
 * CRUD for chatbot configuration via PostgreSQL (Supabase)
 */

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

function flattenConfig(apiConfig: any) {
  return {
    id: apiConfig.id || 'clarissa-v1',
    name: apiConfig.branding?.name,
    companyName: apiConfig.branding?.companyName,
    tagline: apiConfig.branding?.tagline,
    logoUrl: apiConfig.branding?.logoUrl,
    avatarUrl: apiConfig.branding?.avatarUrl,
    welcomeMessage: apiConfig.branding?.welcomeMessage,
    inputPlaceholder: apiConfig.branding?.inputPlaceholder,
    primaryColor: apiConfig.style?.primaryColor,
    secondaryColor: apiConfig.style?.secondaryColor,
    accentColor: apiConfig.style?.accentColor,
    widgetBgColor: apiConfig.style?.widgetBgColor,
    textColor: apiConfig.style?.textColor,
    userBubbleColor: apiConfig.style?.userBubbleColor,
    botBubbleColor: apiConfig.style?.botBubbleColor,
    buttonColor: apiConfig.style?.buttonColor,
    borderColor: apiConfig.style?.borderColor,
    headerColor: apiConfig.style?.headerColor,
    iconColor: apiConfig.style?.iconColor,
    borderRadius: apiConfig.style?.borderRadius,
    buttonRadius: apiConfig.style?.buttonRadius,
    shadow: apiConfig.style?.shadow,
    widgetWidth: apiConfig.style?.widgetWidth,
    maxHeight: apiConfig.style?.maxHeight,
    widgetPosition: apiConfig.style?.widgetPosition,
    padding: apiConfig.style?.padding,
    fontFamily: apiConfig.style?.fontFamily,
    fontSize: apiConfig.style?.fontSize,
    fabStyle: apiConfig.style?.fabStyle,
    quickReplies: apiConfig.content?.quickReplies ? JSON.stringify(apiConfig.content.quickReplies) : undefined,
    faq: apiConfig.content?.faq ? JSON.stringify(apiConfig.content.faq) : undefined,
    services: apiConfig.content?.services ? JSON.stringify(apiConfig.content.services) : undefined,
    tone: apiConfig.content?.tone,
    humanFallbackCta: apiConfig.content?.humanFallbackCta,
    hours: apiConfig.content?.hours,
    address: apiConfig.content?.address,
    contact: apiConfig.content?.contact,
    systemPrompt: apiConfig.systemPrompt,
    docs: apiConfig.docs ? JSON.stringify(apiConfig.docs) : undefined,
    calendarProvider: apiConfig.calendarProvider,
    calendarConfig: apiConfig.calendarConfig ? JSON.stringify(apiConfig.calendarConfig) : undefined,
    embedEnabled: apiConfig.embedEnabled,
    allowedDomains: apiConfig.allowedDomains ? JSON.stringify(apiConfig.allowedDomains) : undefined,
  };
}

function unflattenConfig(dbConfig: any) {
  return {
    id: dbConfig.id,
    branding: {
      name: dbConfig.name,
      companyName: dbConfig.companyName,
      tagline: dbConfig.tagline,
      logoUrl: dbConfig.logoUrl,
      avatarUrl: dbConfig.avatarUrl,
      welcomeMessage: dbConfig.welcomeMessage,
      inputPlaceholder: dbConfig.inputPlaceholder,
    },
    style: {
      primaryColor: dbConfig.primaryColor,
      secondaryColor: dbConfig.secondaryColor,
      accentColor: dbConfig.accentColor,
      widgetBgColor: dbConfig.widgetBgColor,
      textColor: dbConfig.textColor,
      userBubbleColor: dbConfig.userBubbleColor,
      botBubbleColor: dbConfig.botBubbleColor,
      buttonColor: dbConfig.buttonColor,
      borderColor: dbConfig.borderColor,
      headerColor: dbConfig.headerColor,
      iconColor: dbConfig.iconColor,
      borderRadius: dbConfig.borderRadius,
      buttonRadius: dbConfig.buttonRadius,
      shadow: dbConfig.shadow,
      widgetWidth: dbConfig.widgetWidth,
      maxHeight: dbConfig.maxHeight,
      widgetPosition: dbConfig.widgetPosition,
      padding: dbConfig.padding,
      fontFamily: dbConfig.fontFamily,
      fontSize: dbConfig.fontSize,
      fabStyle: dbConfig.fabStyle,
    },
    content: {
      quickReplies: dbConfig.quickReplies ? JSON.parse(dbConfig.quickReplies) : [],
      faq: dbConfig.faq ? JSON.parse(dbConfig.faq) : [],
      services: dbConfig.services ? JSON.parse(dbConfig.services) : [],
      tone: dbConfig.tone,
      humanFallbackCta: dbConfig.humanFallbackCta,
      hours: dbConfig.hours,
      address: dbConfig.address,
      contact: dbConfig.contact,
    },
    systemPrompt: dbConfig.systemPrompt,
    docs: dbConfig.docs ? JSON.parse(dbConfig.docs) : [],
    calendarProvider: dbConfig.calendarProvider,
    calendarConfig: dbConfig.calendarConfig ? JSON.parse(dbConfig.calendarConfig) : {},
    embedEnabled: dbConfig.embedEnabled,
    allowedDomains: dbConfig.allowedDomains ? JSON.parse(dbConfig.allowedDomains) : [],
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

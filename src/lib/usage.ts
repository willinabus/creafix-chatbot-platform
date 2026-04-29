/**
 * Usage tracking and quota management
 * Tracks AI responses per chatbot per month
 */

import { prisma } from "./prisma";

export interface UsageStatus {
  responses: number;
  monthlyQuota: number;
  percentage: number;
  status: "normal" | "warning" | "limit_reached";
  month: string;
}

function getCurrentMonth(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

export async function trackUsage(
  botId: string,
  inputTokens: number = 0,
  outputTokens: number = 0
): Promise<UsageStatus> {
  const month = getCurrentMonth();

  const record = await prisma.usageRecord.upsert({
    where: {
      botId_month: {
        botId,
        month,
      },
    },
    update: {
      responses: { increment: 1 },
      inputTokens: { increment: inputTokens },
      outputTokens: { increment: outputTokens },
    },
    create: {
      botId,
      month,
      responses: 1,
      inputTokens,
      outputTokens,
    },
  });

  const config = await prisma.chatbotConfig.findUnique({
    where: { id: botId },
    select: { monthlyQuota: true },
  });

  const quota = config?.monthlyQuota ?? 1500;
  const percentage = Math.round((record.responses / quota) * 100);

  let status: UsageStatus["status"] = "normal";
  if (percentage >= 100) status = "limit_reached";
  else if (percentage >= 80) status = "warning";

  return {
    responses: record.responses,
    monthlyQuota: quota,
    percentage,
    status,
    month,
  };
}

export async function getUsageStatus(botId: string): Promise<UsageStatus> {
  const month = getCurrentMonth();

  const [record, config] = await Promise.all([
    prisma.usageRecord.findUnique({
      where: { botId_month: { botId, month } },
    }),
    prisma.chatbotConfig.findUnique({
      where: { id: botId },
      select: { monthlyQuota: true },
    }),
  ]);

  const responses = record?.responses ?? 0;
  const quota = config?.monthlyQuota ?? 1500;
  const percentage = Math.round((responses / quota) * 100);

  let status: UsageStatus["status"] = "normal";
  if (percentage >= 100) status = "limit_reached";
  else if (percentage >= 80) status = "warning";

  return {
    responses,
    monthlyQuota: quota,
    percentage,
    status,
    month,
  };
}

export async function isQuotaExceeded(botId: string): Promise<boolean> {
  const status = await getUsageStatus(botId);
  return status.status === "limit_reached";
}

export async function getAllBotsUsage(): Promise<
  Array<{
    botId: string;
    name: string;
    companyName: string;
    plan: string;
    status: string;
    usage: UsageStatus;
  }>
> {
  const month = getCurrentMonth();

  const [bots, records] = await Promise.all([
    prisma.chatbotConfig.findMany({
      select: {
        id: true,
        name: true,
        companyName: true,
        plan: true,
        status: true,
        monthlyQuota: true,
      },
    }),
    prisma.usageRecord.findMany({
      where: { month },
      select: { botId: true, responses: true },
    }),
  ]);

  const recordMap = new Map(
    records.map((r: { botId: string; responses: number }) => [r.botId, r.responses])
  );

  return bots.map((bot: { id: string; name: string; companyName: string; plan: string; status: string; monthlyQuota: number }) => {
    const responses = recordMap.get(bot.id) || 0;
    const percentage = Math.round((responses / bot.monthlyQuota) * 100);
    let status: UsageStatus["status"] = "normal";
    if (percentage >= 100) status = "limit_reached";
    else if (percentage >= 80) status = "warning";

    return {
      botId: bot.id,
      name: bot.name,
      companyName: bot.companyName,
      plan: bot.plan,
      status: bot.status,
      usage: {
        responses,
        monthlyQuota: bot.monthlyQuota,
        percentage,
        status,
        month,
      },
    };
  });
}

/**
 * OpenAI client configuration
 * Supports standard chat models (gpt-4o-mini, gpt-4o) and reasoning models (o1, o3)
 */

import OpenAI from "openai";
import { APP_CONFIG } from "@/config";

const apiKey = process.env.OPENAI_API_KEY;

export const openai = new OpenAI({
  apiKey: apiKey || "sk-dummy-key-for-build",
});

export function isOpenAIConfigured(): boolean {
  return !!apiKey && apiKey.startsWith("sk-") && apiKey.length > 20;
}

function isReasoningModel(model: string): boolean {
  return (
    model.includes("o1") ||
    model.includes("o3") ||
    model.startsWith("o-") ||
    model.includes("gpt-5")
  );
}

function isGpt5Model(model: string): boolean {
  return model.includes("gpt-5");
}

export const OPENAI_CONFIG = {
  model: APP_CONFIG.defaultModel,
  temperature: APP_CONFIG.defaultTemperature,
  maxTokens: APP_CONFIG.maxTokens,
} as const;

export interface ChatCompletionOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  tools?: OpenAI.Chat.ChatCompletionTool[];
  temperature?: number;
  model?: string;
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = options.model || OPENAI_CONFIG.model;
  const useReasoning = isReasoningModel(model);
  const isGpt5 = isGpt5Model(model);

  const body: any = {
    model,
    messages: options.messages,
  };

  if (isGpt5) {
    // GPT-5 models use max_output_tokens and reasoning effort
    body.max_output_tokens = OPENAI_CONFIG.maxTokens;
    body.reasoning = { effort: "medium" };
    // GPT-5 does not use temperature — reasoning effort controls variability
  } else if (useReasoning) {
    // Legacy reasoning models (o1, o3)
    body.max_completion_tokens = OPENAI_CONFIG.maxTokens;
    body.reasoning_effort = "medium";
  } else {
    body.max_tokens = OPENAI_CONFIG.maxTokens;
    body.temperature = options.temperature ?? OPENAI_CONFIG.temperature;
  }

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = "auto";
    // GPT-5 benefits from parallel tool calling; keep default unless issues arise
    if (isGpt5) {
      body.parallel_tool_calls = true;
    }
  }

  const completion = await openai.chat.completions.create(body);

  // Log usage for debugging
  const usage = completion.usage;
  if (usage) {
    console.log(
      `[OpenAI] Model: ${model}, Input: ${usage.prompt_tokens}, Output: ${usage.completion_tokens}, Total: ${usage.total_tokens}`
    );
  }

  return completion;
}

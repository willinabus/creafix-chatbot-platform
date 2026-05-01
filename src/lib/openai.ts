/**
 * OpenAI client configuration
 * Supports standard chat models and reasoning chat models (o-series, GPT-5)
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
  model: process.env.OPENAI_MODEL || APP_CONFIG.defaultModel,
  temperature: APP_CONFIG.defaultTemperature,
  maxTokens: APP_CONFIG.maxTokens,
} as const;

export interface ChatCompletionOptions {
  messages: OpenAI.Chat.ChatCompletionMessageParam[];
  tools?: OpenAI.Chat.ChatCompletionTool[];
  toolChoice?: OpenAI.Chat.ChatCompletionToolChoiceOption;
  temperature?: number;
  model?: string;
  maxTokens?: number;
  reasoningEffort?: OpenAI.Chat.ChatCompletionReasoningEffort;
  responseFormat?: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming["response_format"];
}

export async function createChatCompletion(options: ChatCompletionOptions) {
  if (!isOpenAIConfigured()) {
    throw new Error("OPENAI_API_KEY is not configured");
  }

  const model = options.model || OPENAI_CONFIG.model;
  const useReasoning = isReasoningModel(model);
  const isGpt5 = isGpt5Model(model);
  const maxTokens = options.maxTokens ?? OPENAI_CONFIG.maxTokens;

  const body: OpenAI.Chat.ChatCompletionCreateParamsNonStreaming = {
    model,
    messages: options.messages,
  };

  if (useReasoning) {
    // Chat Completions reasoning models use max_completion_tokens + reasoning_effort.
    body.max_completion_tokens = maxTokens;
    body.reasoning_effort = options.reasoningEffort ?? "low";
  } else {
    body.max_tokens = maxTokens;
    body.temperature = options.temperature ?? OPENAI_CONFIG.temperature;
  }

  if (options.responseFormat) {
    body.response_format = options.responseFormat;
  }

  if (options.tools && options.tools.length > 0) {
    body.tools = options.tools;
    body.tool_choice = options.toolChoice ?? "auto";
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

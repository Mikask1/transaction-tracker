import { ChatOpenAI } from '@langchain/openai';

export default function createOpenRouter(config: {
  // New primary configuration
  primaryModel?: string; // primary model to use
  backups?: string[]; // backup models for fallback
  providerOrder?: string[]; // provider order preference (e.g., ["google", "openai"])
  allowFallbacks?: boolean; // enable fallbacks to other providers

  // Legacy support (deprecated but maintained for backward compatibility)
  model?: string; // single model slug (legacy)
  provider?: string[]; // preferred provider order (legacy)
  providerSort?: 'latency' | 'price' | 'throughput'; // legacy sorting

  // Common parameters
  temperature?: number;
  maxTokens?: number;
  includeReasoning?: boolean; // enable reasoning for supported models
  responseFormat?: 'json' | 'text'; // response format (json or text)
}): ChatOpenAI {
  const apiKey = process.env.OPENROUTER_API_KEY;

  if (!apiKey) {
    throw new Error('OPENROUTER_API_KEY environment variable is not set');
  }

  // Determine the primary model and configuration
  const primaryModel = config.primaryModel || config.model;
  if (!primaryModel) {
    throw new Error('Either primaryModel or model must be specified');
  }

  // Build the models array for fallbacks
  const models = config.backups?.length
    ? [primaryModel, ...config.backups]
    : undefined;

  // Build provider configuration
  const providerConfig: any = {
    allow_fallbacks: config.allowFallbacks ?? true,
  };

  // Use new providerOrder if provided, otherwise fall back to legacy provider/providerSort
  if (config.providerOrder?.length) {
    providerConfig.order = config.providerOrder;
  } else if (config.provider?.length) {
    // Legacy support
    providerConfig.order = config.provider;
    providerConfig.sort = config.providerSort ?? 'price';
  } else if (config.providerSort) {
    // Legacy support for sort only
    providerConfig.sort = config.providerSort;
  }

  return new ChatOpenAI({
    model: primaryModel,
    // Use the provided temperature or default to 0
    temperature: config.temperature ?? 0,
    topP: 1.0,
    streaming: false,
    maxTokens: config.maxTokens ?? 10000,

    openAIApiKey: apiKey,
    configuration: {
      baseURL: 'https://openrouter.ai/api/v1',
    },

    // request JSON-only at the transport level (broadly supported)
    modelKwargs: {
      provider: providerConfig,
      ...(models ? { models } : {}),
      ...(config.includeReasoning
        ? {
          reasoning: { effort: 'none' }, // or: { max_tokens: 2048 }
          include_reasoning: true,
        }
        : {}),
      ...(config.responseFormat === 'json'
        ? {
          response_format: { type: 'json_object' },
        }
        : {}),
    },
  });
};

import type {
    ChatCompletionsContentPart,
    ChatCompletionsFunctionTool,
    ChatCompletionsImagePart,
    ChatCompletionsLumoExtension,
    ChatCompletionsMessage,
    ChatCompletionsRequest,
    ChatCompletionsTool,
    LumoApiGenerationRequest,
    LumoCompletionTarget,
    ResponseFormat,
    ToolName,
    WireImage,
    WireTurn,
} from '../types-api';
import { Role } from '../types-api';

export const DEFAULT_CHAT_MODEL = 'lumo-lite';
export const LUMO_LITE_MODEL = 'lumo-lite';
export const LUMO_MAX_MODEL = 'lumo-max';
export const APERTUS_15_MODEL = 'apertus-15';

export type LumoApiModelTier = 'auto' | 'lumo-lite' | 'lumo-max' | 'apertus-15';

export type ToChatCompletionsOptions = {
    enableReasoning?: boolean;
    model?: string;
    modelTier?: LumoApiModelTier;
    target?: LumoCompletionTarget;
    responseFormat?: ResponseFormat;
    /**
     * Client-defined function tools (OpenAI shape), executed on the client. When present they are
     * forwarded as the request `tools`, merged with any built-in scheduler tools.
     */
    clientTools?: ChatCompletionsFunctionTool[];
    /**
     * Built-in server-side scheduler tools (name-only shape, e.g. `web_search`) to advertise alongside
     * the client tools. The backend accepts a mixed `tools` array — it executes these worker-side and
     * auto-resumes the same stream — products can use `web_search` AND client function tools in one
     * request. Merged with `request.options.tools`.
     */
    serverTools?: ToolName[];
};

export function resolveChatModel(modelTier: LumoApiModelTier = 'auto', model?: string): string {
    if (model) {
        return model;
    }

    switch (modelTier) {
        case 'lumo-lite':
            return LUMO_LITE_MODEL;
        case 'lumo-max':
            return LUMO_MAX_MODEL;
        case 'apertus-15':
            return APERTUS_15_MODEL;
        default:
            return DEFAULT_CHAT_MODEL;
    }
}

export function formatRequestedModel(model: string, enableReasoning: boolean): string {
    return `${model} (${enableReasoning ? 'thinking' : 'fast'})`;
}

const JSON_SCHEMA_DRAFT = 'https://json-schema.org/draft/2020-12/schema';

function normalizeFunctionTool(tool: ChatCompletionsFunctionTool): ChatCompletionsFunctionTool {
    const parameters = tool.function.parameters ?? { type: 'object', properties: {} };
    return {
        type: 'function',
        function: {
            name: tool.function.name,
            description: tool.function.description ?? '',
            parameters: {
                ...parameters,
                type: parameters.type ?? 'object',
                $schema: parameters.$schema ?? JSON_SCHEMA_DRAFT,
                properties: parameters.properties ?? {},
            },
        },
    };
}

function normalizeTools(tools: boolean | ToolName[] | ChatCompletionsTool[] | undefined): ChatCompletionsTool[] {
    if (!tools || tools === true) {
        return [];
    }

    return tools.map((tool) => {
        if (typeof tool === 'string') {
            return { name: tool };
        }
        if ('type' in tool && tool.type === 'function') {
            return normalizeFunctionTool(tool);
        }
        if ('name' in tool && ('description' in tool || 'parameters' in tool)) {
            return normalizeFunctionTool({
                type: 'function',
                function: {
                    name: tool.name,
                    description: tool.description,
                    parameters: tool.parameters,
                },
            });
        }
        return tool;
    });
}

function toOpenAiRole(role: Role): ChatCompletionsMessage['role'] {
    switch (role) {
        case Role.System:
            return 'system';
        case Role.User:
            return 'user';
        case Role.Assistant:
            return 'assistant';
        case Role.ToolResult:
            return 'tool';
        case Role.ToolCall:
            // Non-standard Lumo role: keeps the tool call's canonical JSON in
            // `content` so it can be U2L-encrypted. The scheduler re-emits it as
            // a structured `assistant` `tool_calls` message for vLLM. Using
            // `assistant` here would leak the raw JSON to the model as text.
            return 'lumo_tool_call';
        default:
            return 'user';
    }
}

/**
 * Infer an image's MIME type from the magic bytes encoded at the start of its
 * base64 payload. WireImage carries no MIME type, but a valid OpenAI data URL
 * needs one. Falls back to image/png.
 */
function inferImageMimeType(base64: string): string {
    if (base64.startsWith('iVBORw0KGgo')) return 'image/png';
    if (base64.startsWith('/9j/')) return 'image/jpeg';
    if (base64.startsWith('R0lGOD')) return 'image/gif';
    if (base64.startsWith('UklGR')) return 'image/webp'; // RIFF container (WebP)
    if (base64.startsWith('Qk')) return 'image/bmp';
    return 'image/png';
}

/**
 * Convert a WireImage into an OpenAI `image_url` content part.
 *
 * The `url` is always a `data:<mime>;base64,...` URL. For an encrypted image the
 * payload is U2L ciphertext so a generic `application/octet-stream` MIME is used;
 * encryption is additionally signalled by `image_url.encrypted` as a sibling to `url`.
 */
function toImagePart(image: WireImage): ChatCompletionsImagePart {
    const mimeType = image.encrypted ? 'application/octet-stream' : inferImageMimeType(image.data);
    return {
        type: 'image_url',
        image_url: {
            url: `data:${mimeType};base64,${image.data}`,
            ...(image.encrypted ? { encrypted: true } : {}),
        },
    };
}

function serializeMessages(turns: WireTurn[]): ChatCompletionsMessage[] {
    return turns.map((turn) => {
        const role = toOpenAiRole(turn.role);
        const hasImages = Boolean(turn.images && turn.images.length > 0);

        // Text-only messages keep OpenAI's native string `content`. The Lumo
        // `encrypted` flag stays at the message level for this case.
        if (!hasImages) {
            const message: ChatCompletionsMessage = { role };
            if (turn.content !== undefined) {
                message.content = turn.content;
            }
            if (turn.encrypted) {
                message.encrypted = true;
            }
            return message;
        }

        // Multimodal messages use OpenAI's content-parts array. Each part carries
        // its own `encrypted` flag as a sibling to the sensitive field.
        // Normally, message.encrypted is not necessary. However,
        // for temporary backward compatibility reason, we also set a
        // message-level `encrypted` flag for the parts-content form.
        const parts: ChatCompletionsContentPart[] = [];

        if (turn.content) {
            const textPart: ChatCompletionsContentPart = { type: 'text', text: turn.content };
            if (turn.encrypted) {
                textPart.encrypted = true;
            }
            parts.push(textPart);
        }

        for (const image of turn.images!) {
            parts.push(toImagePart(image));
        }

        // Compat: set encrypted at the message level too.
        const encrypted = turn.images!.some((im) => im.encrypted);

        return { role, content: parts, ...(encrypted ? { encrypted: true } : {}) };
    });
}

function buildLumoExtension(
    request: LumoApiGenerationRequest,
    options: ToChatCompletionsOptions
): ChatCompletionsLumoExtension {
    const lumo: ChatCompletionsLumoExtension = {
        client_type: 'frontend',
    };

    if (options.target) {
        lumo.target = options.target;
    }

    if (request.request_key && request.request_id) {
        lumo.request_key = request.request_key;
        lumo.request_id = request.request_id;
    } else if (request.request_key || request.request_id) {
        console.warn(
            '[Lumo] request_key and request_id must both be set for U2L encryption — ignoring partial encryption params'
        );
    }

    if (request.options?.image_aspect_ratio) {
        lumo.image_aspect_ratio = request.options.image_aspect_ratio;
    }

    return lumo;
}

export function toChatCompletionsBody(
    request: LumoApiGenerationRequest,
    options: ToChatCompletionsOptions = {}
): ChatCompletionsRequest {
    const { enableReasoning = Boolean(request.options?.reasoning), model, modelTier = 'auto' } = options;

    const body: ChatCompletionsRequest = {
        model: resolveChatModel(modelTier, model),
        messages: serializeMessages(request.turns),
        stream: true,
        stream_options: { include_usage: true },
        reasoning_effort: enableReasoning ? 'high' : 'none',
    };

    // Merge built-in server tools with client function tools so ONE request can carry both.
    // Server tools may arrive on the generation request (`enableExternalTools`) or explicitly via
    // `options.serverTools`. Server tools come first, then the client tools.
    const clientTools = options.clientTools ?? [];
    const serverTools = [...normalizeTools(request.options?.tools), ...normalizeTools(options.serverTools)];
    const tools = [...serverTools, ...clientTools];
    if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
    }

    if (options.responseFormat) {
        body.response_format = options.responseFormat;
    }

    body.lumo = buildLumoExtension(request, options);

    return body;
}

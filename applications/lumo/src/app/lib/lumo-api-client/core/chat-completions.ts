import type { LumoModelId } from '../../../features/api-docs/lumoApiDocs.config';
import type {
    ChatCompletionsContentPart,
    ChatCompletionsImagePart,
    ChatCompletionsLumoExtension,
    ChatCompletionsMessage,
    ChatCompletionsRequest,
    ChatCompletionsTool,
    LumoApiGenerationRequest,
    LumoCompletionTarget,
    ToolName,
    WireImage,
    WireTurn,
} from '../../../types-api';
import { Role } from '../../../types-api';

export const DEFAULT_CHAT_MODEL = 'lumo';
export const DEFAULT_REASONING_MODEL: LumoModelId = 'lumo-plus-v1';

export type ToChatCompletionsOptions = {
    enableReasoning?: boolean;
    model?: string;
    reasoningModel?: string;
    target?: LumoCompletionTarget;
};

export function toChatCompletionsBody(
    request: LumoApiGenerationRequest,
    options: ToChatCompletionsOptions = {}
): ChatCompletionsRequest {
    const {
        enableReasoning = Boolean(request.options?.reasoning),
        model = DEFAULT_CHAT_MODEL,
        reasoningModel = DEFAULT_REASONING_MODEL,
    } = options;

    const tools = normalizeTools(request.options?.tools);
    const body: ChatCompletionsRequest = {
        model: enableReasoning ? reasoningModel : model,
        messages: serializeMessages(request.turns),
        stream: true,
        reasoning_effort: enableReasoning ? 'high' : 'none',
    };

    if (tools.length > 0) {
        body.tools = tools;
        body.tool_choice = 'auto';
    }

    body.lumo = buildLumoExtension(request, options);

    return body;
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

    return lumo;
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
            return 'assistant';
        default:
            return 'user';
    }
}

function normalizeTools(tools: boolean | ToolName[] | undefined): ChatCompletionsTool[] {
    if (!tools || tools === true) {
        return [];
    }

    return tools.map((name) => ({ name }));
}

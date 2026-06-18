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
export const DEFAULT_REASONING_MODEL = 'lumo-thinking';

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

    // if (options.target) {
    //     lumo.target = options.target;
    // }

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

        // Multimodal messages use OpenAI's content-parts array. Encryption stays
        // at the message level (mirroring the text-only case): the `encrypted`
        // flag marks the whole message, and the text/image parts carry ciphertext
        // (the image ciphertext wrapped as a `data:` URL, see `toImagePart`).
        const parts: ChatCompletionsContentPart[] = [];

        if (turn.content) {
            parts.push({ type: 'text', text: turn.content });
        }

        for (const image of turn.images!) {
            parts.push(toImagePart(image));
        }

        const message: ChatCompletionsMessage = { role, content: parts };
        if (turn.encrypted) {
            message.encrypted = true;
        }
        return message;
    });
}

/**
 * Convert a WireImage into an OpenAI `image_url` content part.
 *
 * The `url` is always a `data:<mime>;base64,...` URL. For an unencrypted image the
 * MIME type is inferred from the payload's magic bytes. For an encrypted image the
 * payload is U2L ciphertext (not real image bytes), so a generic
 * `application/octet-stream` MIME is used; the backend strips the prefix and
 * decrypts the bytes at the worker boundary. Encryption is signalled by the
 * message-level `encrypted` flag, not per part.
 */
function toImagePart(image: WireImage): ChatCompletionsImagePart {
    const mimeType = image.encrypted ? 'application/octet-stream' : inferImageMimeType(image.data);
    return {
        type: 'image_url',
        image_url: { url: `data:${mimeType};base64,${image.data}` },
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

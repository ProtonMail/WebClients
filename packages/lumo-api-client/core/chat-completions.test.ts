import type { ChatCompletionsFunctionTool } from '../types-api';
import { Role } from '../types-api';
import {
    APERTUS_15_MODEL,
    DEFAULT_CHAT_MODEL,
    LUMO_LITE_MODEL,
    LUMO_MAX_MODEL,
    formatRequestedModel,
    toChatCompletionsBody,
} from './chat-completions';
import type { LumoApiGenerationRequest } from './types';

const baseRequest: LumoApiGenerationRequest = {
    type: 'generation_request',
    turns: [{ role: Role.User, content: 'Hello' }],
    targets: ['message'],
};

const mailTool: ChatCompletionsFunctionTool = {
    type: 'function',
    function: {
        name: 'view_emails',
        description: 'List the emails currently on screen.',
        parameters: { type: 'object', properties: {}, additionalProperties: false },
    },
};

describe('toChatCompletionsBody', () => {
    it('builds a default streaming request without targets', () => {
        expect(toChatCompletionsBody(baseRequest)).toEqual({
            model: DEFAULT_CHAT_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: 'none',
            lumo: { client_type: 'frontend' },
        });
    });

    it('sets reasoning effort independently from the selected model', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            options: { reasoning: true },
        };

        expect(
            toChatCompletionsBody(request, {
                enableReasoning: true,
                modelTier: 'lumo-lite',
            })
        ).toEqual({
            model: LUMO_LITE_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: 'high',
            lumo: { client_type: 'frontend' },
        });
    });

    it('maps model tiers to API model names', () => {
        expect(toChatCompletionsBody(baseRequest, { modelTier: 'lumo-lite' }).model).toBe(LUMO_LITE_MODEL);
        expect(toChatCompletionsBody(baseRequest, { modelTier: 'lumo-max' }).model).toBe(LUMO_MAX_MODEL);
        expect(toChatCompletionsBody(baseRequest, { modelTier: 'apertus-15' }).model).toBe(APERTUS_15_MODEL);
        expect(toChatCompletionsBody(baseRequest, { modelTier: 'auto' }).model).toBe(DEFAULT_CHAT_MODEL);
    });

    it('serializes built-in tools as name-only objects and maps Lumo roles to OpenAI roles', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            turns: [
                { role: Role.System, content: 'Be helpful' },
                { role: Role.ToolResult, content: 'search results' },
                { role: Role.ToolCall, content: '{"name":"web_search"}' },
                { role: Role.User, content: 'Hello' },
            ],
            options: {
                tools: ['web_search'],
            },
        };

        expect(toChatCompletionsBody(request)).toEqual({
            model: DEFAULT_CHAT_MODEL,
            messages: [
                { role: 'system', content: 'Be helpful' },
                { role: 'tool', content: 'search results' },
                { role: 'lumo_tool_call', content: '{"name":"web_search"}' },
                { role: 'user', content: 'Hello' },
            ],
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: 'none',
            tools: [{ name: 'web_search' }],
            tool_choice: 'auto',
            lumo: { client_type: 'frontend' },
        });
    });

    it('merges server tools and client function tools into one tools array when both are supplied', () => {
        expect(
            toChatCompletionsBody(baseRequest, {
                clientTools: [mailTool],
                serverTools: ['web_search'],
            })
        ).toEqual({
            model: DEFAULT_CHAT_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: 'none',
            tools: [{ name: 'web_search' }, mailTool],
            tool_choice: 'auto',
            lumo: { client_type: 'frontend' },
        });
    });

    it('forwards client function tools alone when no server tools are supplied', () => {
        expect(toChatCompletionsBody(baseRequest, { clientTools: [mailTool] })).toEqual({
            model: DEFAULT_CHAT_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: 'none',
            tools: [mailTool],
            tool_choice: 'auto',
            lumo: { client_type: 'frontend' },
        });
    });

    it('forwards server tools requested via options as name-only objects', () => {
        expect(toChatCompletionsBody(baseRequest, { serverTools: ['web_search'] })).toEqual({
            model: DEFAULT_CHAT_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            stream_options: { include_usage: true },
            reasoning_effort: 'none',
            tools: [{ name: 'web_search' }],
            tool_choice: 'auto',
            lumo: { client_type: 'frontend' },
        });
    });

    it('omits empty image arrays from serialized messages', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            turns: [{ role: Role.User, content: 'Hello', images: [] }],
        };

        expect(toChatCompletionsBody(request).messages).toEqual([{ role: 'user', content: 'Hello' }]);
    });

    it('serializes images as OpenAI content parts with data URLs', () => {
        // "UklGR" base64 prefix → RIFF/WebP magic bytes
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            turns: [
                {
                    role: Role.User,
                    content: '<lumo-image id="abc" source="user" name="pic.webp" />',
                    images: [{ encrypted: false, image_id: 'abc', data: 'UklGRsAEAAA' }],
                },
            ],
        };

        expect(toChatCompletionsBody(request).messages).toEqual([
            {
                role: 'user',
                content: [
                    { type: 'text', text: '<lumo-image id="abc" source="user" name="pic.webp" />' },
                    { type: 'image_url', image_url: { url: 'data:image/webp;base64,UklGRsAEAAA' } },
                ],
            },
        ]);
    });

    it('carries U2L ciphertext via a data URL with per-part encrypted flags', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            turns: [
                {
                    role: Role.User,
                    content: 'cipher-text-refs',
                    encrypted: true,
                    images: [{ encrypted: true, image_id: 'abc', data: 'cipher-text-bytes' }],
                },
            ],
        };

        expect(toChatCompletionsBody(request).messages).toEqual([
            {
                role: 'user',
                content: [
                    { type: 'text', text: 'cipher-text-refs', encrypted: true },
                    {
                        type: 'image_url',
                        image_url: { url: 'data:application/octet-stream;base64,cipher-text-bytes', encrypted: true },
                    },
                ],
                encrypted: true, // tmp backward compat, see note in `serializeMessages()`.
            },
        ]);
    });

    it('maps chat/completions target and encryption fields into the lumo extension', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            request_key: 'encrypted-key',
            request_id: 'request-id',
        };

        expect(toChatCompletionsBody(request).lumo).toEqual({
            client_type: 'frontend',
            request_key: 'encrypted-key',
            request_id: 'request-id',
        });
    });

    it('passes through OpenAI function tools for desktop connectors', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            options: {
                tools: [
                    { name: 'web_search' },
                    {
                        type: 'function',
                        function: {
                            name: 'filesystem__fs_read',
                            description: 'Read a file',
                            parameters: {
                                type: 'object',
                                properties: { path: { type: 'string' } },
                                required: ['path'],
                            },
                        },
                    },
                ],
            },
        };

        expect(toChatCompletionsBody(request).tools).toEqual([
            { name: 'web_search' },
            {
                type: 'function',
                function: {
                    name: 'filesystem__fs_read',
                    description: 'Read a file',
                    parameters: {
                        $schema: 'https://json-schema.org/draft/2020-12/schema',
                        type: 'object',
                        properties: { path: { type: 'string' } },
                        required: ['path'],
                    },
                },
            },
        ]);
    });

    it('maps image aspect ratio into the lumo extension', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            options: { image_aspect_ratio: '16:9' },
        };

        expect(toChatCompletionsBody(request).lumo).toEqual({
            client_type: 'frontend',
            image_aspect_ratio: '16:9',
        });
    });
});

describe('formatRequestedModel', () => {
    it('appends the response mode to the requested model id', () => {
        expect(formatRequestedModel(LUMO_MAX_MODEL, true)).toBe('lumo-max (thinking)');
        expect(formatRequestedModel(LUMO_LITE_MODEL, false)).toBe('lumo-lite (fast)');
        expect(formatRequestedModel(DEFAULT_CHAT_MODEL, false)).toBe('lumo (fast)');
    });
});

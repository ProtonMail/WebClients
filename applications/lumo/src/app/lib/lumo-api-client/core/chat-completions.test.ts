import { Role } from '../../../types-api';
import { DEFAULT_CHAT_MODEL, DEFAULT_REASONING_MODEL, toChatCompletionsBody } from './chat-completions';
import type { LumoApiGenerationRequest } from './types';

const baseRequest: LumoApiGenerationRequest = {
    type: 'generation_request',
    turns: [{ role: Role.User, content: 'Hello' }],
    targets: ['message'],
};

describe('toChatCompletionsBody', () => {
    it('builds a default streaming request without targets', () => {
        expect(toChatCompletionsBody(baseRequest)).toEqual({
            model: DEFAULT_CHAT_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            reasoning_effort: 'none',
            lumo: { client_type: 'frontend' },
        });
    });

    it('uses the reasoning model and effort when enabled', () => {
        const request: LumoApiGenerationRequest = {
            ...baseRequest,
            options: { reasoning: true },
        };

        expect(
            toChatCompletionsBody(request, {
                enableReasoning: true,
            })
        ).toEqual({
            model: DEFAULT_REASONING_MODEL,
            messages: [{ role: 'user', content: 'Hello' }],
            stream: true,
            reasoning_effort: 'high',
            lumo: { client_type: 'frontend' },
        });
    });

    it('serializes built-in tools as name-only objects and maps the Lumo ToolCall role to lumo_tool_call and ToolResult to the standard OpenAI tool role', () => {
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

        expect(
            toChatCompletionsBody(request, {
                target: 'title',
            }).lumo
        ).toEqual({
            client_type: 'frontend',
            target: 'title',
            request_key: 'encrypted-key',
            request_id: 'request-id',
        });
    });
});

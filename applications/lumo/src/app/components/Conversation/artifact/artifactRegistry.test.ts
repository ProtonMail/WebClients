import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import {
    buildArtifactRegistry,
    getArtifactVersionIndexForMessage,
    mergeProvisionalArtifactRegistry,
} from './artifactRegistry';
import { CREATE_ARTIFACT_TOOL_NAME } from './createArtifactTool';

let counter = 0;
function makeMessage(overrides: Partial<Message> & { content: string }): Message {
    counter += 1;
    return {
        id: `msg-${counter}`,
        createdAt: `2026-01-01T00:00:0${counter}.000Z`,
        role: Role.Assistant,
        conversationId: 'conv-1',
        status: 'succeeded',
        ...overrides,
    };
}

describe('buildArtifactRegistry', () => {
    it('registers a single artifact with one version', () => {
        const chain: Message[] = [
            makeMessage({
                content: '<artifact id="poem" type="document" title="Poem">Roses are red</artifact>',
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(Object.keys(registry)).toEqual(['poem']);
        expect(registry.poem!.versions).toHaveLength(1);
        expect(registry.poem!.versions[0]!.content).toBe('Roses are red');
    });

    it('accumulates a new version when a later message reuses the same id', () => {
        const chain: Message[] = [
            makeMessage({
                content: '<artifact id="poem" type="document" title="Poem">Roses are red</artifact>',
            }),
            makeMessage({
                content: '<artifact id="poem" type="document" title="Poem">Roses are red, violets are blue</artifact>',
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(Object.keys(registry)).toEqual(['poem']);
        expect(registry.poem!.versions).toHaveLength(2);
        expect(registry.poem!.versions[0]!.content).toBe('Roses are red');
        expect(registry.poem!.versions[1]!.content).toBe('Roses are red, violets are blue');
    });

    it('keeps distinct artifact ids as separate registry entries', () => {
        const chain: Message[] = [
            makeMessage({
                content: '<artifact id="doc-1" type="document" title="Doc One">First</artifact>',
            }),
            makeMessage({
                content: '<artifact id="code-1" type="code" language="python" title="Snippet">print(1)</artifact>',
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(Object.keys(registry).sort()).toEqual(['code-1', 'doc-1']);
        expect(registry['doc-1']!.versions).toHaveLength(1);
        expect(registry['code-1']!.versions).toHaveLength(1);
    });

    it('assigns a stable fallback id to legacy tags with no id attribute', () => {
        const chain: Message[] = [
            makeMessage({
                content: '<artifact type="document" title="No Id Here">content</artifact>',
            }),
        ];

        const registry = buildArtifactRegistry(chain);
        const ids = Object.keys(registry);

        expect(ids).toHaveLength(1);
        expect(ids[0]).toMatch(/^legacy-/);
    });

    it('ignores messages that are not finalized assistant messages', () => {
        const chain: Message[] = [
            makeMessage({
                role: Role.User,
                content: '<artifact id="user-artifact" type="document" title="Should Be Ignored">x</artifact>',
            }),
            makeMessage({
                status: undefined,
                content: '<artifact id="streaming-artifact" type="document" title="Should Be Ignored">x</artifact>',
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(Object.keys(registry)).toHaveLength(0);
    });

    it('registers an artifact created via the create_artifact tool call, with no prose content at all', () => {
        const args = { id: 'letter-1', type: 'document', title: 'Landlord Letter', content: 'Dear landlord,' };
        const chain: Message[] = [
            makeMessage({
                content: '',
                blocks: [
                    {
                        type: 'tool_call',
                        content: JSON.stringify({ id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
                        toolCall: { id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args },
                    },
                ],
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(Object.keys(registry)).toEqual(['letter-1']);
        expect(registry['letter-1']!.versions[0]!.content).toBe('Dear landlord,');
    });

    it('accumulates a new version when a later message reuses the same tool-call artifact id', () => {
        const makeArgs = (content: string) => ({ id: 'letter-1', type: 'document', title: 'Landlord Letter', content });
        const toolCallBlock = (args: ReturnType<typeof makeArgs>) => ({
            type: 'tool_call' as const,
            content: JSON.stringify({ id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
            toolCall: { id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args },
        });
        const chain: Message[] = [
            makeMessage({ content: '', blocks: [toolCallBlock(makeArgs('Dear landlord,'))] }),
            makeMessage({ content: '', blocks: [toolCallBlock(makeArgs('Dear landlord, revised.'))] }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(registry['letter-1']!.versions).toHaveLength(2);
        expect(registry['letter-1']!.versions[1]!.content).toBe('Dear landlord, revised.');
    });

    it('collapses multiple tool calls for the same id within one message into a single version', () => {
        const makeArgs = (title: string) => ({ id: 'letter-1', type: 'document', title, content: 'Dear landlord,' });
        const toolCallBlock = (args: ReturnType<typeof makeArgs>, callId: string) => ({
            type: 'tool_call' as const,
            content: JSON.stringify({ id: callId, name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
            toolCall: { id: callId, name: CREATE_ARTIFACT_TOOL_NAME, arguments: args },
        });
        const chain: Message[] = [
            makeMessage({
                content: '',
                blocks: [
                    toolCallBlock(makeArgs('First Attempt'), 'call_1'),
                    toolCallBlock(makeArgs('First Attempt'), 'call_2'),
                    toolCallBlock(makeArgs('Final Title'), 'call_3'),
                ],
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(registry['letter-1']!.versions).toHaveLength(1);
        expect(registry['letter-1']!.title).toBe('Final Title');
    });

    it('maps a message id to its artifact version index', () => {
        const first = makeMessage({
            content: '<artifact id="poem" type="document" title="Poem">Roses are red</artifact>',
        });
        const second = makeMessage({
            content: '<artifact id="poem" type="document" title="Poem">Roses are red, violets are blue</artifact>',
        });
        const chain = [first, second];
        const registry = buildArtifactRegistry(chain);

        expect(getArtifactVersionIndexForMessage(registry, 'poem', first.id)).toBe(0);
        expect(getArtifactVersionIndexForMessage(registry, 'poem', second.id)).toBe(1);
        expect(getArtifactVersionIndexForMessage(registry, 'poem', 'missing-message')).toBeNull();
        expect(getArtifactVersionIndexForMessage(registry, 'missing-artifact', first.id)).toBeNull();
    });

    it('does not register a create_artifact tool call still mid-stream (arguments still a raw string)', () => {
        const chain: Message[] = [
            makeMessage({
                content: '',
                blocks: [
                    {
                        type: 'tool_call',
                        content: '{"id":"call_1","name":"create_artifact","arguments":"{\\"id\\":\\"x\\""}',
                        toolCall: { id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: '{"id":"x"' },
                    },
                ],
            }),
        ];

        const registry = buildArtifactRegistry(chain);

        expect(Object.keys(registry)).toHaveLength(0);
    });
});

describe('mergeProvisionalArtifactRegistry', () => {
    const makeArgs = (content: string) => ({
        id: 'letter-1',
        type: 'document' as const,
        title: 'Landlord Letter',
        content,
    });
    const toolCallBlock = (args: ReturnType<typeof makeArgs>, callId: string) => ({
        type: 'tool_call' as const,
        content: JSON.stringify({ id: callId, name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
        toolCall: { id: callId, name: CREATE_ARTIFACT_TOOL_NAME, arguments: args },
    });

    it('adds a provisional version for an in-flight assistant message', () => {
        const streaming = makeMessage({
            status: undefined,
            content: '',
            blocks: [toolCallBlock(makeArgs('Dear landlord,'), 'call_1')],
        });
        const finalized = buildArtifactRegistry([]);
        const merged = mergeProvisionalArtifactRegistry(finalized, [streaming]);

        expect(Object.keys(merged)).toEqual(['letter-1']);
        expect(merged['letter-1']!.versions).toHaveLength(1);
        expect(merged['letter-1']!.versions[0]!.provisional).toBe(true);
        expect(merged['letter-1']!.versions[0]!.content).toBe('Dear landlord,');
        expect(getArtifactVersionIndexForMessage(merged, 'letter-1', streaming.id)).toBe(0);
    });

    it('appends a provisional revision to an existing finalized artifact', () => {
        const first = makeMessage({
            content: '',
            blocks: [toolCallBlock(makeArgs('Dear landlord,'), 'call_1')],
        });
        const streaming = makeMessage({
            status: undefined,
            content: '',
            blocks: [toolCallBlock(makeArgs('Dear landlord, revised.'), 'call_2')],
        });
        const finalized = buildArtifactRegistry([first]);
        const merged = mergeProvisionalArtifactRegistry(finalized, [first, streaming]);

        expect(merged['letter-1']!.versions).toHaveLength(2);
        expect(merged['letter-1']!.versions[0]!.provisional).toBeUndefined();
        expect(merged['letter-1']!.versions[1]!.provisional).toBe(true);
        expect(getArtifactVersionIndexForMessage(merged, 'letter-1', streaming.id)).toBe(1);
    });

    it('does not duplicate once the message finalizes', () => {
        const finalizedMessage = makeMessage({
            content: '',
            blocks: [toolCallBlock(makeArgs('Dear landlord,'), 'call_1')],
        });
        const finalized = buildArtifactRegistry([finalizedMessage]);
        const merged = mergeProvisionalArtifactRegistry(finalized, [finalizedMessage]);

        expect(merged['letter-1']!.versions).toHaveLength(1);
        expect(merged['letter-1']!.versions[0]!.provisional).toBeUndefined();
    });

    it('does not stick to an empty parse cached before the tool call landed', () => {
        const streaming = makeMessage({
            status: undefined,
            content: '',
            blocks: [],
        });
        mergeProvisionalArtifactRegistry(buildArtifactRegistry([]), [streaming]);

        streaming.blocks = [toolCallBlock(makeArgs('Dear landlord,'), 'call_1')];
        const mergedWhileStreaming = mergeProvisionalArtifactRegistry(buildArtifactRegistry([]), [streaming]);
        expect(mergedWhileStreaming['letter-1']!.versions[0]!.provisional).toBe(true);

        streaming.status = 'succeeded';
        const finalized = buildArtifactRegistry([streaming]);
        expect(finalized['letter-1']!.versions).toHaveLength(1);
        expect(finalized['letter-1']!.versions[0]!.provisional).toBeUndefined();
    });
});

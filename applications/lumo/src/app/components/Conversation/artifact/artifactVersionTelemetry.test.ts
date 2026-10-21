import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import type { ArtifactRegistry } from './artifactRegistry';
import {
    type LiveArtifactMessage,
    collectArtifactVersionTelemetry,
    consumeArtifactTelemetryLiveMessages,
    getArtifactTelemetryLiveMessages,
    markArtifactTelemetryLiveMessage,
    markArtifactTelemetryLiveMessageStopped,
    resolveArtifactRevisionSource,
} from './artifactVersionTelemetry';

const assistantRevisionMessage: Message = {
    id: 'assistant-1',
    parentId: 'user-1',
    conversationId: 'conv-1',
    createdAt: '2026-01-01T00:00:00Z',
    role: Role.Assistant,
    status: 'succeeded',
    placeholder: false,
    blocks: [],
};

const promptUserMessage: Message = {
    id: 'user-1',
    parentId: 'assistant-0',
    conversationId: 'conv-1',
    createdAt: '2026-01-01T00:00:00Z',
    role: Role.User,
    status: 'succeeded',
    placeholder: false,
    blocks: [],
};

const inlineEditUserMessage: Message = {
    ...promptUserMessage,
    id: 'user-inline',
    artifactAction: {
        kind: 'edit',
        artifactId: 'doc-1',
        artifactTitle: 'Doc',
        artifactType: 'document',
        selection: 'selected text',
        userInstruction: 'make it shorter',
    },
};

const manualEditMessage: Message = {
    id: 'manual-1',
    parentId: 'assistant-1',
    conversationId: 'conv-1',
    createdAt: '2026-01-02T00:00:00Z',
    role: Role.User,
    status: 'succeeded',
    placeholder: false,
    blocks: [],
    artifactManualEdit: {
        artifactId: 'doc-1',
        artifactTitle: 'Doc',
        artifactType: 'document',
    },
};

describe('resolveArtifactRevisionSource', () => {
    it('returns manual-edit for manual edit messages', () => {
        expect(resolveArtifactRevisionSource([manualEditMessage], 'manual-1')).toBe('manual-edit');
    });

    it('returns inline-edit when the parent user message has an artifact action', () => {
        const chain = [
            inlineEditUserMessage,
            { ...assistantRevisionMessage, id: 'assistant-inline', parentId: 'user-inline' },
        ];

        expect(resolveArtifactRevisionSource(chain, 'assistant-inline')).toBe('inline-edit');
    });

    it('returns prompt for assistant revisions without an artifact action parent', () => {
        const chain = [promptUserMessage, assistantRevisionMessage];

        expect(resolveArtifactRevisionSource(chain, 'assistant-1')).toBe('prompt');
    });

    it('returns null when the version message is missing', () => {
        expect(resolveArtifactRevisionSource([], 'missing')).toBeNull();
    });
});

describe('collectArtifactVersionTelemetry', () => {
    const firstAssistant: Message = { ...assistantRevisionMessage, id: 'assistant-0', parentId: 'user-0' };
    const secondAssistant: Message = { ...assistantRevisionMessage, id: 'assistant-1', parentId: 'user-1' };

    const version = (messageId: string, content: string, provisional?: boolean) => {
        return {
            messageId,
            content,
            createdAt: '2026-01-01T00:00:00Z',
            source: 'prompt' as const,
            ...(provisional && { provisional }),
        };
    };

    const registryWith = (versions: ReturnType<typeof version>[], type: 'document' | 'code' = 'document') => {
        const registry: ArtifactRegistry = {
            'doc-1': { id: 'doc-1', type, title: 'Doc', language: type === 'code' ? 'py' : undefined, versions },
        };
        return registry;
    };

    const live = (entries: Record<string, LiveArtifactMessage>) => {
        return new Map(Object.entries(entries));
    };

    it('reports nothing for artifacts loaded from history', () => {
        const registry = registryWith([version('assistant-0', 'a'), version('assistant-1', 'b')]);
        const result = collectArtifactVersionTelemetry(registry, [firstAssistant, secondAssistant], new Map());

        expect(result).toEqual({ events: [], consumedMessageIds: [] });
    });

    it('reports a creation from a live generation once it has finalized', () => {
        const registry = registryWith([version('assistant-0', 'a')], 'code');
        const result = collectArtifactVersionTelemetry(
            registry,
            [firstAssistant],
            live({ 'assistant-0': { artifactToolMode: 'auto' } })
        );

        expect(result.events).toEqual([
            {
                kind: 'created',
                payload: {
                    artifactType: 'code',
                    artifactToolMode: 'auto',
                    artifactPosition: 1,
                    contentLengthBucket: '0-1k',
                    languageBucket: 'python',
                },
            },
        ]);
        expect(result.consumedMessageIds).toEqual(['assistant-0']);
    });

    it('waits while the live version is still provisional', () => {
        const registry = registryWith([version('assistant-0', 'a', true)]);
        const inFlight: Message = { ...firstAssistant, status: undefined };
        const result = collectArtifactVersionTelemetry(
            registry,
            [inFlight],
            live({ 'assistant-0': { artifactToolMode: 'auto' } })
        );

        expect(result).toEqual({ events: [], consumedMessageIds: [] });
    });

    it('reports a live revision of a historical artifact with its source and version number', () => {
        const registry = registryWith([version('assistant-0', 'a'), version('assistant-inline', 'b')]);
        const chain = [
            firstAssistant,
            inlineEditUserMessage,
            { ...assistantRevisionMessage, id: 'assistant-inline', parentId: 'user-inline' },
        ];
        const result = collectArtifactVersionTelemetry(
            registry,
            chain,
            live({ 'assistant-inline': { artifactToolMode: 'revise' } })
        );

        expect(result.events).toEqual([
            {
                kind: 'revised',
                payload: {
                    artifactType: 'document',
                    artifactToolMode: 'revise',
                    artifactPosition: 1,
                    contentLengthBucket: '0-1k',
                    revisionSource: 'inline-edit',
                    versionNumber: 2,
                    viewedOlderVersion: false,
                },
            },
        ]);
    });

    it('flags a revision that arrived while the panel showed an older version of that artifact', () => {
        const registry = registryWith([
            version('assistant-0', 'a'),
            version('manual-1', 'b'),
            version('assistant-1', 'c'),
        ]);
        const chain = [firstAssistant, manualEditMessage, promptUserMessage, assistantRevisionMessage];
        const liveRevision = live({ 'assistant-1': { artifactToolMode: 'revise' } });

        const viewingV1 = collectArtifactVersionTelemetry(registry, chain, liveRevision, {
            artifactId: 'doc-1',
            versionIndex: 0,
        });
        // v2 was the latest when the user asked, so this is an ordinary revision.
        const viewingPreviousLatest = collectArtifactVersionTelemetry(registry, chain, liveRevision, {
            artifactId: 'doc-1',
            versionIndex: 1,
        });
        const viewingOtherArtifact = collectArtifactVersionTelemetry(registry, chain, liveRevision, {
            artifactId: 'other',
            versionIndex: 0,
        });

        expect(viewingV1.events[0].payload).toMatchObject({ viewedOlderVersion: true });
        expect(viewingPreviousLatest.events[0].payload).toMatchObject({ viewedOlderVersion: false });
        expect(viewingOtherArtifact.events[0].payload).toMatchObject({ viewedOlderVersion: false });
    });

    it('reports manual edits without a tool mode', () => {
        const registry = registryWith([version('assistant-0', 'a'), version('manual-1', 'b')]);
        const result = collectArtifactVersionTelemetry(
            registry,
            [firstAssistant, manualEditMessage],
            live({ 'manual-1': {} })
        );

        expect(result.events).toHaveLength(1);
        expect(result.events[0]).toMatchObject({ kind: 'revised', payload: { revisionSource: 'manual-edit' } });
        expect(result.events[0].payload).not.toHaveProperty('artifactToolMode', expect.anything());
    });

    it('consumes a finalized live message that produced no artifact', () => {
        const result = collectArtifactVersionTelemetry({}, [firstAssistant], live({ 'assistant-0': {} }));

        expect(result).toEqual({ events: [], consumedMessageIds: ['assistant-0'] });
    });

    it('keeps live messages that are not on the active branch', () => {
        const result = collectArtifactVersionTelemetry({}, [firstAssistant], live({ 'other-branch': {} }));

        expect(result.consumedMessageIds).toEqual([]);
    });

    describe('invalid create_artifact calls', () => {
        const toolCallBlock = (content: string) => {
            let toolCall: unknown;
            try {
                toolCall = JSON.parse(content);
            } catch {
                toolCall = undefined;
            }
            return { type: 'tool_call' as const, content, toolCall };
        };

        const validCall = toolCallBlock(
            JSON.stringify({ name: 'create_artifact', arguments: { id: 'doc-1', title: 'Doc', content: 'a' } })
        );
        const truncatedCall = toolCallBlock('{"name": "create_artifact", "arguments": {"title": "Do');
        const callWithoutContent = toolCallBlock(
            JSON.stringify({ name: 'create_artifact', arguments: { title: 'Doc' } })
        );
        const otherToolCall = toolCallBlock(JSON.stringify({ name: 'web_search', arguments: { query: 'x' } }));

        const invalidEvents = (result: ReturnType<typeof collectArtifactVersionTelemetry>) => {
            return result.events.filter((event) => {
                return event.kind === 'invalid';
            });
        };

        it('reports calls whose JSON did not parse, or that lack a title or content', () => {
            const message: Message = { ...firstAssistant, blocks: [truncatedCall, callWithoutContent, otherToolCall] };
            const result = collectArtifactVersionTelemetry(
                {},
                [message],
                live({ 'assistant-0': { artifactToolMode: 'auto' } })
            );

            expect(invalidEvents(result)).toEqual([
                {
                    kind: 'invalid',
                    payload: { reason: 'invalid-json', artifactToolMode: 'auto', recoveredInSameMessage: false },
                },
                {
                    kind: 'invalid',
                    payload: { reason: 'missing-fields', artifactToolMode: 'auto', recoveredInSameMessage: false },
                },
            ]);
        });

        it('marks an invalid call as recovered when the same response made a valid one', () => {
            const message: Message = { ...firstAssistant, blocks: [callWithoutContent, validCall] };
            const result = collectArtifactVersionTelemetry(
                registryWith([version('assistant-0', 'a')]),
                [message],
                live({ 'assistant-0': { artifactToolMode: 'auto' } })
            );

            expect(invalidEvents(result)).toEqual([
                {
                    kind: 'invalid',
                    payload: { reason: 'missing-fields', artifactToolMode: 'auto', recoveredInSameMessage: true },
                },
            ]);
        });

        it('ignores stopped, failed and unfinished responses', () => {
            const stopped = collectArtifactVersionTelemetry(
                {},
                [{ ...firstAssistant, blocks: [truncatedCall] }],
                live({ 'assistant-0': { artifactToolMode: 'auto', stopped: true } })
            );
            const failed = collectArtifactVersionTelemetry(
                {},
                [{ ...firstAssistant, status: 'failed', blocks: [truncatedCall] }],
                live({ 'assistant-0': { artifactToolMode: 'auto' } })
            );
            const unfinished = collectArtifactVersionTelemetry(
                {},
                [{ ...firstAssistant, status: undefined, blocks: [truncatedCall] }],
                live({ 'assistant-0': { artifactToolMode: 'auto' } })
            );

            expect(invalidEvents(stopped)).toEqual([]);
            expect(stopped.consumedMessageIds).toEqual(['assistant-0']);
            expect(invalidEvents(failed)).toEqual([]);
            expect(invalidEvents(unfinished)).toEqual([]);
        });

        it('ignores responses loaded from history', () => {
            const result = collectArtifactVersionTelemetry(
                {},
                [{ ...firstAssistant, blocks: [truncatedCall] }],
                new Map()
            );

            expect(result.events).toEqual([]);
        });
    });

    describe('markArtifactTelemetryLiveMessageStopped', () => {
        afterEach(() => {
            consumeArtifactTelemetryLiveMessages(['stop-live', 'stop-unknown']);
        });

        it('flags a live message as stopped and ignores unknown ones', () => {
            markArtifactTelemetryLiveMessage('stop-live', { artifactToolMode: 'auto' });
            markArtifactTelemetryLiveMessageStopped('stop-live');
            markArtifactTelemetryLiveMessageStopped('stop-unknown');

            expect(getArtifactTelemetryLiveMessages().get('stop-live')).toEqual({
                artifactToolMode: 'auto',
                stopped: true,
            });
            expect(getArtifactTelemetryLiveMessages().has('stop-unknown')).toBe(false);
        });
    });
});

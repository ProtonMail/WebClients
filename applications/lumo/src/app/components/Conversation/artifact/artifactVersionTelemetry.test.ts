import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import type { ArtifactRegistry } from './artifactRegistry';
import {
    type LiveArtifactMessage,
    collectArtifactVersionTelemetry,
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
        return { messageId, content, createdAt: '2026-01-01T00:00:00Z', ...(provisional && { provisional }) };
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
                },
            },
        ]);
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
});

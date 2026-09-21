import type { ContentBlock, Message } from '../../../types';
import { Role } from '../../../types-api';
import {
    getToolCallNameFromBlock,
    isArtifactGenerationLoading,
    isArtifactRevisionLoading,
} from './artifactGenerationState';
import type { ArtifactRegistry } from './artifactRegistry';
import { CREATE_ARTIFACT_TOOL_NAME } from './createArtifactTool';

const makeUserMessage = (overrides: Partial<Message> = {}): Message => ({
    id: 'user-1',
    createdAt: '2024-01-01T00:00:00.000Z',
    role: Role.User,
    conversationId: 'conv-1',
    status: 'succeeded',
    content: 'Write me a letter',
    blocks: [{ type: 'text', content: 'Write me a letter' }],
    ...overrides,
});

const makeAssistantBlocks = (args: Record<string, unknown> | string): ContentBlock[] => [
    {
        type: 'tool_call',
        content: JSON.stringify({ id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
        toolCall: {
            id: 'call_1',
            name: CREATE_ARTIFACT_TOOL_NAME,
            arguments: args,
        },
    },
];

describe('getToolCallNameFromBlock', () => {
    it('reads the tool name from parsed toolCall data', () => {
        const block = makeAssistantBlocks({})[0]!;
        expect(getToolCallNameFromBlock(block)).toBe(CREATE_ARTIFACT_TOOL_NAME);
    });

    it('falls back to parsing block content when toolCall is missing', () => {
        const block: ContentBlock = {
            type: 'tool_call',
            content: JSON.stringify({ id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME }),
        };
        expect(getToolCallNameFromBlock(block)).toBe(CREATE_ARTIFACT_TOOL_NAME);
    });
});

describe('isArtifactGenerationLoading', () => {
    it('is false when the artifact is already complete', () => {
        expect(
            isArtifactGenerationLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [
                    {
                        id: 'letter-1',
                        type: 'document',
                        title: 'Letter',
                        content: 'Hello',
                    },
                ],
                blocks: [],
                parentUserMessage: makeUserMessage({ artifactCreateModeActive: true }),
            })
        ).toBe(false);
    });

    it('is true when the user explicitly entered create-artifact mode', () => {
        expect(
            isArtifactGenerationLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [],
                blocks: [],
                parentUserMessage: makeUserMessage({ artifactCreateModeActive: true }),
            })
        ).toBe(true);
    });

    it('is true for artifact inline-edit follow-ups', () => {
        expect(
            isArtifactGenerationLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [],
                blocks: [],
                parentUserMessage: makeUserMessage({
                    artifactAction: {
                        kind: 'improve',
                        artifactId: 'letter-1',
                        artifactTitle: 'Letter',
                        artifactType: 'code',
                        selection: 'const x = 1;',
                    },
                }),
            })
        ).toBe(true);
    });

    it('is true while a create_artifact tool call is in progress', () => {
        expect(
            isArtifactGenerationLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [],
                blocks: makeAssistantBlocks('{"id":"x"'),
                parentUserMessage: makeUserMessage(),
            })
        ).toBe(true);
    });

    it('is false for ordinary chat turns', () => {
        expect(
            isArtifactGenerationLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [],
                blocks: [{ type: 'text', content: 'Here is a short answer.' }],
                parentUserMessage: makeUserMessage(),
            })
        ).toBe(false);
    });
});

describe('isArtifactRevisionLoading', () => {
    const registry: ArtifactRegistry = {
        'letter-1': {
            id: 'letter-1',
            type: 'document',
            title: 'Letter',
            versions: [
                {
                    messageId: 'assistant-1',
                    content: 'Version 1',
                    createdAt: '2024-01-01T00:00:00.000Z',
                },
                {
                    messageId: 'assistant-2',
                    content: 'Version 2',
                    createdAt: '2024-01-02T00:00:00.000Z',
                },
            ],
        },
    };

    it('is true while revising the artifact the user was viewing', () => {
        expect(
            isArtifactRevisionLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [],
                parentUserMessage: makeUserMessage({
                    artifactRevisionTargetId: 'letter-1',
                }),
                selectedId: 'letter-1',
                selectedVersionIndex: 1,
                registry,
            })
        ).toBe(true);
    });

    it('is false when the new version is already parseable', () => {
        expect(
            isArtifactRevisionLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [
                    {
                        id: 'letter-1',
                        type: 'document',
                        title: 'Letter',
                        content: 'Version 3',
                    },
                ],
                parentUserMessage: makeUserMessage({
                    artifactRevisionTargetId: 'letter-1',
                }),
                selectedId: 'letter-1',
                selectedVersionIndex: 1,
                registry,
            })
        ).toBe(false);
    });

    it('is false when the user is viewing an older version', () => {
        expect(
            isArtifactRevisionLoading({
                isGenerating: true,
                isLastMessage: true,
                completeArtifacts: [],
                parentUserMessage: makeUserMessage({
                    artifactRevisionTargetId: 'letter-1',
                }),
                selectedId: 'letter-1',
                selectedVersionIndex: 0,
                registry,
            })
        ).toBe(false);
    });
});

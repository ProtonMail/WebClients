import type { ContentBlock, Message } from '../../types';
import { Role } from '../../types-api';
import { CREATE_ARTIFACT_TOOL_NAME } from './artifact/createArtifactTool';
import { resolveArtifactToolMode } from './helper';

let counter = 0;
function makeMessage(overrides: Partial<Message> & Pick<Message, 'content'>): Message {
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

function makeArtifactMessage(content: string): Message {
    const args = { id: 'poem', type: 'document', title: 'Poem', content: 'Roses are red' };
    const block: ContentBlock = {
        type: 'tool_call',
        content: JSON.stringify({ id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args }),
        toolCall: { id: 'call_1', name: CREATE_ARTIFACT_TOOL_NAME, arguments: args },
    };
    return makeMessage({ content, blocks: [block] });
}

describe('resolveArtifactToolMode', () => {
    it('returns "off" when the artifacts view feature flag is disabled', () => {
        const chainWithArtifact: Message[] = [makeArtifactMessage('')];

        expect(resolveArtifactToolMode(true, chainWithArtifact, false)).toBe('off');
        expect(resolveArtifactToolMode(false, chainWithArtifact, false)).toBe('off');
        expect(resolveArtifactToolMode(undefined, chainWithArtifact, false)).toBe('off');
    });

    it('returns "off" when mode is inactive and the conversation has no artifact', () => {
        const chain: Message[] = [makeMessage({ content: 'just a plain reply' })];

        expect(resolveArtifactToolMode(false, chain, true)).toBe('off');
        expect(resolveArtifactToolMode(undefined, chain, true)).toBe('off');
    });

    it('returns "create" whenever canvas mode is active, regardless of existing artifacts', () => {
        expect(resolveArtifactToolMode(true, [], true)).toBe('create');

        const chainWithArtifact: Message[] = [makeArtifactMessage('')];
        expect(resolveArtifactToolMode(true, chainWithArtifact, true)).toBe('create');
    });

    it('returns "revise" when mode is inactive but the conversation already has an artifact', () => {
        const chain: Message[] = [makeArtifactMessage('')];

        expect(resolveArtifactToolMode(false, chain, true)).toBe('revise');
        expect(resolveArtifactToolMode(undefined, chain, true)).toBe('revise');
    });
});

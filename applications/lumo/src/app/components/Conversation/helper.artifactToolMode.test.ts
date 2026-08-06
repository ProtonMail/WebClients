import type { Message } from '../../types';
import { Role } from '../../types-api';
import { resolveArtifactToolMode } from './helper';

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

describe('resolveArtifactToolMode', () => {
    it('returns "off" when mode is inactive and the conversation has no artifact', () => {
        const chain: Message[] = [makeMessage({ content: 'just a plain reply' })];

        expect(resolveArtifactToolMode(false, chain)).toBe('off');
        expect(resolveArtifactToolMode(undefined, chain)).toBe('off');
    });

    it('returns "create" whenever canvas mode is active, regardless of existing artifacts', () => {
        expect(resolveArtifactToolMode(true, [])).toBe('create');

        const chainWithArtifact: Message[] = [
            makeMessage({ content: '<artifact id="poem" type="document" title="Poem">Roses are red</artifact>' }),
        ];
        expect(resolveArtifactToolMode(true, chainWithArtifact)).toBe('create');
    });

    it('returns "revise" when mode is inactive but the conversation already has an artifact', () => {
        const chain: Message[] = [
            makeMessage({ content: '<artifact id="poem" type="document" title="Poem">Roses are red</artifact>' }),
        ];

        expect(resolveArtifactToolMode(false, chain)).toBe('revise');
        expect(resolveArtifactToolMode(undefined, chain)).toBe('revise');
    });
});

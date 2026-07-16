import type { Message } from '../../../types';
import { Role } from '../../../types-api';
import { buildArtifactRegistry } from './artifactRegistry';

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
});

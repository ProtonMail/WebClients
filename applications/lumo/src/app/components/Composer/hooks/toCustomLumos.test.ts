import type { CustomAgent } from '../../../redux/slices/lumoUserSettings';
import { toCustomLumo, toCustomLumos } from './toCustomLumos';

const agent = (overrides: Partial<CustomAgent> = {}): CustomAgent => ({
    id: 'agent-1',
    name: 'Agent One',
    source: 'personal',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
});

describe('toCustomLumo', () => {
    it('maps display fields only, dropping instructions and conversationStarters', () => {
        const a = agent({
            id: 'a1',
            name: 'Writer',
            icon: 'pen-sparks',
            description: 'Helps you write',
            source: 'published',
            instructions: 'secret system prompt',
            conversationStarters: ['Hello'],
        });

        expect(toCustomLumo(a)).toEqual({
            id: 'a1',
            name: 'Writer',
            icon: 'pen-sparks',
            description: 'Helps you write',
            source: 'published',
        });
    });

    it('falls back to the default icon when the agent has none', () => {
        expect(toCustomLumo(agent({ icon: undefined })).icon).toBe('robot');
    });

    it('derives a description from instructions when there is no explicit one, matching the picker byline', () => {
        const a = agent({ description: undefined, instructions: 'Answer like a pirate.\nBe concise.' });

        expect(toCustomLumo(a).description).toBe('Answer like a pirate.');
    });

    it('leaves description undefined when there is neither an explicit one nor instructions', () => {
        expect(toCustomLumo(agent({ description: undefined, instructions: undefined })).description).toBeUndefined();
    });
});

describe('toCustomLumos', () => {
    it('maps every agent via toCustomLumo', () => {
        const agents = [agent({ id: 'a1', name: 'Writer' })];

        expect(toCustomLumos(agents)).toEqual([toCustomLumo(agents[0])]);
    });

    it('excludes hidden agents', () => {
        const agents = [agent({ id: 'a1', hidden: true }), agent({ id: 'a2' })];

        expect(toCustomLumos(agents).map((a) => a.id)).toEqual(['a2']);
    });

    it('keeps a hidden agent if it is the active one', () => {
        const agents = [agent({ id: 'a1', hidden: true }), agent({ id: 'a2' })];

        expect(toCustomLumos(agents, 'a1').map((a) => a.id)).toEqual(['a1', 'a2']);
    });

    it('returns an empty list for an empty input', () => {
        expect(toCustomLumos([])).toEqual([]);
    });
});

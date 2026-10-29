import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import { customAgentToSkillDraft, getAgentsToMigrate } from './customAgentMigration';

const agent = (overrides: Partial<CustomAgent>): CustomAgent => ({
    id: 'agent-1',
    name: 'Writer',
    instructions: 'Write well',
    description: 'Helps write',
    source: 'personal',
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
});

describe('customAgentToSkillDraft', () => {
    it('maps a Custom Lumo to a skill draft', () => {
        expect(customAgentToSkillDraft(agent({ hidden: true, icon: 'pen' }))).toEqual({
            name: 'Writer',
            description: 'Helps write',
            instructions: 'Write well',
            icon: 'pen',
            enabled: false,
            source: 'custom-lumo',
            conversationStarters: undefined,
            legacyAgentId: 'agent-1',
            files: [],
        });
    });
});

describe('getAgentsToMigrate', () => {
    it('keeps personal agents that have not been migrated', () => {
        const agents = [agent({ id: 'a' }), agent({ id: 'b' }), agent({ id: 'shared', source: 'shared' })];
        expect(getAgentsToMigrate(agents, new Set(['b'])).map(({ id }) => id)).toEqual(['a']);
    });
});

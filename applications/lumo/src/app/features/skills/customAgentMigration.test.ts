import type { CustomAgent } from '../../redux/slices/lumoUserSettings';
import {
    customAgentEditsToSkillDraft,
    customAgentToSkillDraft,
    getAgentsToMigrate,
    getSkillsToResync,
} from './customAgentMigration';
import type { Skill, SkillFileDraft } from './types';

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

const skill = (overrides: Partial<Skill>): Skill => ({
    id: 'skill-1',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    legacyAgentId: 'agent-1',
    skillKey: 'key',
    name: 'Writer',
    description: 'Helps write',
    instructions: 'Write well',
    enabled: true,
    source: 'custom-lumo',
    ...overrides,
});

describe('getSkillsToResync', () => {
    const skillSavedAt = Date.parse('2026-11-01T10:00:00.000Z');

    it('picks migrated skills whose Custom Lumo was edited later', () => {
        const agents = [agent({ id: 'agent-1', updatedAt: skillSavedAt + 1 })];
        expect(getSkillsToResync(agents, [skill({})]).map(({ skill }) => skill.id)).toEqual(['skill-1']);
    });

    it('keeps skills edited after their Custom Lumo', () => {
        const agents = [agent({ id: 'agent-1', updatedAt: skillSavedAt })];
        expect(getSkillsToResync(agents, [skill({})])).toEqual([]);
    });

    it('ignores skills without a Custom Lumo, and Custom Lumos that are not personal', () => {
        const agents = [agent({ id: 'agent-1', source: 'shared', updatedAt: skillSavedAt + 1 })];
        expect(getSkillsToResync(agents, [skill({}), skill({ id: 'skill-2', legacyAgentId: undefined })])).toEqual([]);
    });
});

describe('customAgentEditsToSkillDraft', () => {
    it('takes the persona from the Custom Lumo and keeps the skill files', () => {
        const files: SkillFileDraft[] = [
            { id: 'file-1', path: 'notes.md', mimeType: 'text/markdown', data: new Uint8Array() },
        ];
        const edited = agent({ name: 'Editor', instructions: 'Edit well', description: undefined, icon: 'pen' });
        expect(customAgentEditsToSkillDraft(skill({ metadata: { license: 'MIT' } }), edited, files)).toEqual({
            name: 'Editor',
            description: '',
            instructions: 'Edit well',
            icon: 'pen',
            source: 'custom-lumo',
            metadata: { license: 'MIT' },
            conversationStarters: undefined,
            files,
        });
    });
});

import type { Skill } from '../skills/types';
import { groupSkills } from './skillGroups';

const skill = (overrides: Partial<Skill>): Skill => ({
    id: 'id',
    createdAt: '',
    updatedAt: '',
    skillKey: '',
    name: 'weekly-report',
    description: 'Status updates',
    instructions: 'Summarize',
    enabled: true,
    source: 'created',
    ...overrides,
});

const plugin = (id: string, name: string) =>
    skill({
        id,
        name,
        description: `${name} plugin`,
        instructions: '',
        source: 'uploaded',
        plugin: { version: '1.0.0' },
        subSkills: [
            { path: 'skills/one', name: `${id}-one`, description: 'First', enabled: true },
            { path: 'skills/two', name: `${id}-two`, description: 'Second', enabled: true },
        ],
    });

const keys = (skills: Skill[], query?: string) => groupSkills(skills, query).map((group) => group.key);

describe('groupSkills', () => {
    const skills = [
        skill({ id: 'proton', source: 'proton', name: 'summarize' }),
        plugin('greenhouse', 'Greenhouse'),
        skill({ id: 'mine', source: 'created' }),
        skill({ id: 'lumo', source: 'custom-lumo', name: 'tone' }),
        plugin('finance', 'Finance'),
    ];

    it('puts your skills first, then plugins by name, then migrated and Proton skills', () => {
        expect(keys(skills)).toEqual(['created', 'finance', 'greenhouse', 'custom-lumo', 'proton']);
    });

    it('keeps a whole plugin when its name matches the search', () => {
        const [group] = groupSkills(skills, 'finance');
        expect(group.kind === 'plugin' && group.subSkills).toHaveLength(2);
    });

    it('keeps only the matching skills of a plugin otherwise', () => {
        const groups = groupSkills(skills, 'greenhouse-two');
        expect(groups).toHaveLength(1);
        expect(groups[0].kind === 'plugin' && groups[0].subSkills.map((subSkill) => subSkill.name)).toEqual([
            'greenhouse-two',
        ]);
    });

    it('drops groups with no matches', () => {
        expect(keys(skills, 'tone')).toEqual(['custom-lumo']);
    });
});

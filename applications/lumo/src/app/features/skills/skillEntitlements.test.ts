import {
    SKILL_TIER_LIMITS,
    countActiveSkills,
    getSkillLimitBlock,
    getSkillTier,
    getSkillWeight,
} from './skillEntitlements';
import type { Skill, SubSkill } from './types';

const skill = (overrides: Partial<Skill>): Skill => ({
    id: 'skill',
    createdAt: '2026-11-01T10:00:00.000Z',
    updatedAt: '2026-11-01T10:00:00.000Z',
    skillKey: 'key',
    name: 'Writer',
    description: 'Helps write',
    instructions: 'Write well',
    enabled: true,
    source: 'created',
    ...overrides,
});

const subSkill = (path: string, enabled = true): SubSkill => ({ path, name: path, description: '', enabled });

describe('getSkillTier', () => {
    it('puts business seats first, then Lumo Plus, then free', () => {
        expect(getSkillTier({ hasLumoPlus: true, hasLumoB2B: true })).toBe('business');
        expect(getSkillTier({ hasLumoPlus: true, hasLumoB2B: false })).toBe('plus');
        expect(getSkillTier({ hasLumoPlus: false, hasLumoB2B: false })).toBe('free');
    });
});

describe('getSkillWeight', () => {
    it('counts a standalone skill as one', () => {
        expect(getSkillWeight(skill({}))).toBe(1);
    });

    it('counts each sub-skill that is on, and the root SKILL.md only when it has instructions', () => {
        const subSkills = [subSkill('a'), subSkill('b'), subSkill('c', false)];
        expect(getSkillWeight(skill({ instructions: '', subSkills }))).toBe(2);
        expect(getSkillWeight(skill({ instructions: 'Overview', subSkills }))).toBe(3);
    });
});

describe('countActiveSkills', () => {
    it('skips skills that are off', () => {
        const skills = [
            skill({ id: 'a' }),
            skill({ id: 'b', enabled: false }),
            skill({ id: 'c', instructions: '', subSkills: [subSkill('x'), subSkill('y')] }),
        ];
        expect(countActiveSkills(skills)).toBe(3);
    });
});

describe('getSkillLimitBlock', () => {
    it('blocks skill sets on tiers without them, before checking the count', () => {
        expect(getSkillLimitBlock(SKILL_TIER_LIMITS.free, 0, 3, true)).toBe('skill-sets');
        expect(getSkillLimitBlock(SKILL_TIER_LIMITS.plus, 0, 3, true)).toBeUndefined();
    });

    it('blocks going over the active skill limit', () => {
        expect(getSkillLimitBlock(SKILL_TIER_LIMITS.free, 0, 1)).toBeUndefined();
        expect(getSkillLimitBlock(SKILL_TIER_LIMITS.free, 1, 1)).toBe('limit');
        expect(getSkillLimitBlock({ maxActiveSkills: 50, skillSets: true }, 48, 3, true)).toBe('limit');
    });

    it('allows changes that add nothing, even over the limit', () => {
        expect(getSkillLimitBlock(SKILL_TIER_LIMITS.free, 4, 0)).toBeUndefined();
    });
});

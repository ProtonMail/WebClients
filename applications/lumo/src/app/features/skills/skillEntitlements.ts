import { hasRootSkillMarkdown } from './skillBundle';
import type { Skill } from './types';

/**
 * What a user may do with skills. Derived from what they hold (a Lumo seat, a business organization),
 * never from a single plan name, since a user can hold several subscriptions.
 */
export type SkillTier = 'free' | 'plus' | 'business';

export type SkillTierLimits = {
    /** Skills that can be turned on at once; each skill of a skill set counts. */
    maxActiveSkills: number;
    /** Whether skill sets (plugins with several skills) can be added and turned on. */
    skillSets: boolean;
};

/** Change limits or skill set access per tier here. */
export const SKILL_TIER_LIMITS: Record<SkillTier, SkillTierLimits> = {
    free: { maxActiveSkills: 1, skillSets: false },
    plus: { maxActiveSkills: 50, skillSets: true },
    business: { maxActiveSkills: 50, skillSets: true },
};

export const getSkillTier = ({ hasLumoPlus, hasLumoB2B }: { hasLumoPlus: boolean; hasLumoB2B: boolean }): SkillTier => {
    if (hasLumoB2B) {
        return 'business';
    }
    return hasLumoPlus ? 'plus' : 'free';
};

/** How many skills a skill counts for once turned on: its own SKILL.md, plus each sub-skill that is on. */
export const getSkillWeight = (skill: Pick<Skill, 'plugin' | 'subSkills' | 'instructions'>): number =>
    (hasRootSkillMarkdown(skill) ? 1 : 0) + (skill.subSkills ?? []).filter((subSkill) => subSkill.enabled).length;

export const countActiveSkills = (skills: Skill[]): number =>
    skills.filter((skill) => skill.enabled).reduce((total, skill) => total + getSkillWeight(skill), 0);

export type SkillLimitBlock = 'skill-sets' | 'limit';

/** Why `added` more active skills (from a skill set when `isSkillSet`) can't be turned on, if they can't. */
export const getSkillLimitBlock = (
    limits: SkillTierLimits,
    activeCount: number,
    added: number,
    isSkillSet = false
): SkillLimitBlock | undefined => {
    if (isSkillSet && !limits.skillSets) {
        return 'skill-sets';
    }
    if (added > 0 && activeCount + added > limits.maxActiveSkills) {
        return 'limit';
    }
    return undefined;
};

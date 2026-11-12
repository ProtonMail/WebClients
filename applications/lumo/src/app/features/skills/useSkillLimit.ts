import { useState } from 'react';

import { c } from 'ttag';

import { useNotifications } from '@proton/app-context/useNotifications';
import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useLumoSelector } from '../../redux/hooks';
import { isSkillPlugin } from './skillBundle';
import {
    SKILL_TIER_LIMITS,
    type SkillLimitBlock,
    countActiveSkills,
    getSkillLimitBlock,
    getSkillTier,
    getSkillWeight,
} from './skillEntitlements';
import type { Skill } from './types';

/** How the user can get more: buy Lumo Plus, ask their organization's admin, or nothing to buy. */
export type SkillUpgradePath = 'checkout' | 'admin' | 'none';

export type SkillLimitModalState = {
    block: SkillLimitBlock;
    maxActiveSkills: number;
    upgradePath: SkillUpgradePath;
};

export function useSkillLimit() {
    const plan = useLumoPlan();
    const { skills, status } = useLumoSelector((state) => state.skills);
    const { createNotification } = useNotifications();
    const skillLimitModal = useModalStateObject();
    const [block, setBlock] = useState<SkillLimitBlock>('limit');

    const limits = SKILL_TIER_LIMITS[getSkillTier(plan)];
    const skillList = Object.values(skills);
    const activeSkillCount = countActiveSkills(skillList);
    const isReady = !plan.isLumoPlanLoading && status === 'ready';

    let upgradePath: SkillUpgradePath = 'none';
    if (plan.canShowLumoUpsellFree || plan.canShowLumoUpsellB2C || plan.canShowLumoUpsellB2B) {
        upgradePath = 'checkout';
    } else if (plan.canShowTalkToAdminLumoUpsell && !plan.hasLumoPlus) {
        upgradePath = 'admin';
    }

    const check = (added: number, isSkillSet: boolean) => {
        if (plan.isLumoPlanLoading) {
            // translator: Notification when an action is blocked while subscription details are loading.
            createNotification({ text: c('collider_2025:Info').t`Checking your plan, try again in a moment.` });
            return false;
        }
        if (status !== 'ready') {
            // translator: Notification when an action is blocked while skills status are loading.
            createNotification({ text: c('collider_2025:Info').t`Checking your skills, try again in a moment.` });
            return false;
        }
        const reason = getSkillLimitBlock(limits, activeSkillCount, added, isSkillSet);
        if (!reason) return true;
        setBlock(reason);
        skillLimitModal.openModal(true);
        return false;
    };

    return {
        /** `added` is how many skills will be turned on, counting each skill of a skill set. */
        checkCanAddSkills: (added = 1, isSkillSet = false) => check(added, isSkillSet),
        checkCanEnableSkill: (skill: Skill) => check(getSkillWeight(skill), isSkillPlugin(skill)),
        /** Turning on a skill inside a skill set that is itself off adds nothing yet. */
        checkCanEnableSubSkill: (skill: Skill) => !skill.enabled || check(1, true),
        skillLimitModal,
        skillLimitModalState: { block, maxActiveSkills: limits.maxActiveSkills, upgradePath } as SkillLimitModalState,
        openUpgradeModal: (reason: SkillLimitBlock = 'skill-sets') => {
            setBlock(reason);
            skillLimitModal.openModal(true);
        },
        canAddSkillSets: !plan.isLumoPlanLoading && limits.skillSets,
        activeSkillCount,
        maxActiveSkills: limits.maxActiveSkills,
        isOverLimit: isReady && activeSkillCount > limits.maxActiveSkills,
        /** Skill sets left on from a plan that included them. */
        hasUnavailableSkillSets: isReady && !limits.skillSets && skillList.some((s) => s.enabled && isSkillPlugin(s)),
        upgradePath,
    };
}

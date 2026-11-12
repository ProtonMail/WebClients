import { useEffect } from 'react';

import { createSelector } from '@reduxjs/toolkit';

import { useLumoPlan } from '../../hooks/useLumoPlan';
import { useLumoDispatch, useLumoSelector } from '../../redux/hooks';
import { selectMasterKeyState } from '../../redux/selectors';
import type { LumoState } from '../../redux/store';
import { SKILL_TIER_LIMITS, getSkillTier } from './skillEntitlements';
import { loadSkills, migrateCustomAgentsToSkills } from './skillsThunks';
import type { Skill, SkillId } from './types';

const selectSkillsState = (state: LumoState) => state.skills;

const selectSkillList = createSelector([selectSkillsState], ({ skills }): Skill[] =>
    Object.values(skills).sort((a, b) => a.name.localeCompare(b.name))
);

export const selectSkillById = (id: SkillId | undefined) => (state: LumoState) =>
    id ? state.skills.skills[id] : undefined;

/**
 * Loads skills from IndexedDB once the master key is ready, then migrates any Custom Lumos after the first sync.
 * With `enabled: false` it only reads what is already loaded.
 */
export const useSkills = ({ enabled = true }: { enabled?: boolean } = {}) => {
    const dispatch = useLumoDispatch();
    const masterKeyStatus = useLumoSelector(selectMasterKeyState).status;
    const status = useLumoSelector((state) => state.skills.status);
    const synced = useLumoSelector((state) => state.skills.synced);
    const customAgents = useLumoSelector((state) => state.lumoUserSettings.customAgents);
    const skills = useLumoSelector(selectSkillList);
    const plan = useLumoPlan();
    const { maxActiveSkills } = SKILL_TIER_LIMITS[getSkillTier(plan)];

    useEffect(() => {
        if (enabled && masterKeyStatus === 'ready' && status === 'idle') {
            void dispatch(loadSkills());
        }
    }, [dispatch, enabled, masterKeyStatus, status]);

    useEffect(() => {
        if (enabled && !plan.isLumoPlanLoading && status === 'ready' && synced && customAgents?.length) {
            void dispatch(migrateCustomAgentsToSkills({ maxActiveSkills }));
        }
    }, [dispatch, enabled, plan.isLumoPlanLoading, maxActiveSkills, status, synced, customAgents]);

    return { status, skills };
};

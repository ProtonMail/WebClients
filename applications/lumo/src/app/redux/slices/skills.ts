import { createSlice, isAnyOf } from '@reduxjs/toolkit';

import {
    deleteSkill,
    loadSkills,
    migrateCustomAgentsToSkills,
    refreshSkills,
    saveSkill,
    setSkillEnabled,
    setSubSkillEnabled,
} from '../../features/skills/skillsThunks';
import type { Skill, SkillId } from '../../features/skills/types';

type SkillsState = {
    status: 'idle' | 'loading' | 'ready' | 'error';
    skills: Record<SkillId, Skill>;
    /** Every Custom Lumo id that already has a skill, deleted ones included. */
    migratedAgentIds: string[];
    migrating: boolean;
};

const initialState: SkillsState = {
    status: 'idle',
    skills: {},
    migratedAgentIds: [],
    migrating: false,
};

const skillsSlice = createSlice({
    name: 'skills',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(loadSkills.pending, (state) => {
                state.status = 'loading';
            })
            .addCase(loadSkills.rejected, (state) => {
                state.status = 'error';
            })
            .addCase(saveSkill.fulfilled, (state, { payload }) => {
                state.skills[payload.id] = payload;
                if (payload.legacyAgentId && !state.migratedAgentIds.includes(payload.legacyAgentId)) {
                    state.migratedAgentIds.push(payload.legacyAgentId);
                }
            })
            .addCase(setSkillEnabled.fulfilled, (state, { payload }) => {
                state.skills[payload.id] = payload;
            })
            .addCase(setSubSkillEnabled.fulfilled, (state, { payload }) => {
                state.skills[payload.id] = payload;
            })
            .addCase(deleteSkill.fulfilled, (state, { payload: skillId }) => {
                delete state.skills[skillId];
            })
            .addCase(migrateCustomAgentsToSkills.pending, (state) => {
                state.migrating = true;
            })
            .addCase(migrateCustomAgentsToSkills.fulfilled, (state) => {
                state.migrating = false;
            })
            .addCase(migrateCustomAgentsToSkills.rejected, (state) => {
                state.migrating = false;
            })
            .addMatcher(isAnyOf(loadSkills.fulfilled, refreshSkills.fulfilled), (state, { payload }) => {
                state.status = 'ready';
                state.skills = Object.fromEntries(payload.skills.map((skill) => [skill.id, skill]));
                state.migratedAgentIds = payload.migratedAgentIds;
            });
    },
});

export default skillsSlice.reducer;

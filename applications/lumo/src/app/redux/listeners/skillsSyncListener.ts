import { isAnyOf } from '@reduxjs/toolkit';

import { syncSkills } from '../../features/skills/skillSync';
import {
    deleteSkill,
    loadSkills,
    saveSkill,
    setSkillEnabled,
    setSubSkillEnabled,
} from '../../features/skills/skillsThunks';
import type { AppStartListening } from '../store';

const SYNC_DEBOUNCE_MS = 1000;

/** Syncs skills once loaded, and shortly after local changes so bursts (e.g. migrations) go out together. */
export function startSkillsSyncListeners(startListening: AppStartListening) {
    startListening({
        matcher: isAnyOf(
            loadSkills.fulfilled,
            saveSkill.fulfilled,
            setSkillEnabled.fulfilled,
            setSubSkillEnabled.fulfilled,
            deleteSkill.fulfilled
        ),
        effect: async (_action, listenerApi) => {
            listenerApi.cancelActiveListeners();
            await listenerApi.delay(SYNC_DEBOUNCE_MS);
            await listenerApi.dispatch(syncSkills());
        },
    });
}

import { createAction } from '@reduxjs/toolkit';

import type { LumoUserSettings } from './lumoUserSettingsTypes';

export const updateLumoUserSettings = createAction<Partial<LumoUserSettings>>(
    'lumoUserSettings/updateLumoUserSettings'
);
export const updateLumoUserSettingsWithAutoSave = createAction<Partial<LumoUserSettings>>(
    'lumoUserSettings/updateLumoUserSettingsWithAutoSave'
);
export const resetLumoUserSettings = createAction('lumoUserSettings/resetLumoUserSettings');
export const setLumoUserSettings = createAction<LumoUserSettings>('lumoUserSettings/setLumoUserSettings');

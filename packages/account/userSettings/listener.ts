import { createNextState } from '@reduxjs/toolkit';

import { welcomeCompleted } from '@proton/account/welcomeFlags/actions';
import type { SharedStartListening } from '@proton/redux-shared-store-types';
import { updateFlags, updateWelcomeFlags } from '@proton/shared/lib/api/settings';
import noop from '@proton/utils/noop';

import { type UserSettingsState, selectUserSettings, userSettingsActions } from './index';

export const userSettingsListener = <T extends UserSettingsState>(startListening: SharedStartListening<T>) => {
    startListening({
        actionCreator: welcomeCompleted,
        effect: async (action, { extra, dispatch, getState }) => {
            const userSettings = selectUserSettings(getState())?.value;
            if (!userSettings) {
                return;
            }
            const api = extra.api;
            const newUserSettings = createNextState(userSettings, (newUserSettings) => {
                if (!userSettings.Flags.Welcomed) {
                    // Set generic welcome to true
                    api(updateFlags({ Welcomed: 1 })).catch(noop);
                    newUserSettings.Flags.Welcomed = 1;
                }
                if (!userSettings.WelcomeFlag) {
                    // Set product specific welcome to true
                    api(updateWelcomeFlags()).catch(noop);
                    newUserSettings.WelcomeFlag = 1;
                }
            });
            if (newUserSettings !== userSettings) {
                dispatch(userSettingsActions.update({ UserSettings: newUserSettings }));
            }
        },
    });
};

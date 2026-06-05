import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';

import { selectUser } from '../user';
import { selectUserSettings } from '../userSettings';
import { getIsPasswordReminderAvailable } from './helpers/getIsPasswordReminderAvailable';
import { getIsPasswordReminderEnabled } from './helpers/getIsPasswordReminderEnabled';
import { getMessageCadenceHasExpired } from './helpers/getMessageCadenceHasExpired';
import { getShowPasswordReminders } from './helpers/getShowPasswordReminders';
import { type PasswordReminderReduxState, passwordReminderActions } from './index';

interface RequiredState extends PasswordReminderReduxState {}

export const passwordReminderListener = (startListening: SharedStartListening<RequiredState>) => {
    /**
     * Determine whether password reminders should show
     */
    startListening({
        predicate: (action, currentState, previousState) => {
            const previousUser = selectUser(previousState);
            const currentUser = selectUser(currentState);

            const previousUserSettings = selectUserSettings(previousState);
            const currentUserSettings = selectUserSettings(currentState);

            return currentUser !== previousUser || currentUserSettings !== previousUserSettings;
        },
        effect: async (action, listenerApi) => {
            const { getState, dispatch, extra } = listenerApi;

            const { user, userSettings } = getState();
            if (!user.value || !userSettings.value) {
                dispatch(passwordReminderActions.hideReminders());
                return;
            }

            const isAvailable = getIsPasswordReminderAvailable({
                unleashClient: extra.unleashClient,
                user: user.value,
            });
            const isEnabled = getIsPasswordReminderEnabled({ userSettings: userSettings.value });
            const messageCadenceHasExpired = getMessageCadenceHasExpired({ userSettings: userSettings.value });

            const showReminders = getShowPasswordReminders({
                unleashClient: extra.unleashClient,
                user: user.value,
                userSettings: userSettings.value,
            });

            dispatch(passwordReminderActions.setIsAvailable({ isAvailable }));
            dispatch(passwordReminderActions.setIsEnabled({ isEnabled }));
            dispatch(passwordReminderActions.setMessageCadenceHasExpired({ messageCadenceHasExpired }));
            dispatch(passwordReminderActions.setShowReminders({ showReminders }));
        },
    });
};

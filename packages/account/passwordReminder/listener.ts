import type { SharedStartListening } from '@proton/redux-shared-store/listenerInterface';

import { selectOrganization } from '../organization';
import { selectUser } from '../user';
import { selectUserSettings } from '../userSettings';
import { getIsPasswordReminderAvailable } from './helpers/getIsPasswordReminderAvailable';
import { getIsPasswordReminderEnabled } from './helpers/getIsPasswordReminderEnabled';
import { getIsPasswordReminderEnforced } from './helpers/getIsPasswordReminderEnforced';
import { getMessageCadenceHasExpired } from './helpers/getMessageCadenceHasExpired';
import { getPasswordReminderAccountType } from './helpers/getPasswordReminderAccountType';
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

            // The organization is fetched lazily, so recompute once it lands: it decides
            // whether an admin counts as belonging to an organization.
            const previousOrganization = selectOrganization(previousState);
            const currentOrganization = selectOrganization(currentState);

            return (
                currentUser !== previousUser ||
                currentUserSettings !== previousUserSettings ||
                currentOrganization !== previousOrganization
            );
        },
        effect: async (action, listenerApi) => {
            const { getState, dispatch, extra } = listenerApi;

            const { user, userSettings, organization } = getState();
            if (!user.value || !userSettings.value) {
                dispatch(passwordReminderActions.hideReminders());
                return;
            }

            const isAvailable = getIsPasswordReminderAvailable({
                unleashClient: extra.unleashClient,
                user: user.value,
                organization: organization.value,
            });
            // Computed here rather than in the telemetry hook so it comes from the same
            // user/organization state that decided `isAvailable`, and so the hook doesn't
            // have to fetch the organization in every app that mounts the top banner.
            const accountType = getPasswordReminderAccountType({
                user: user.value,
                organization: organization.value,
            });
            const isEnforced = getIsPasswordReminderEnforced({ organization: organization.value });
            const isEnabled = getIsPasswordReminderEnabled({ userSettings: userSettings.value });
            const messageCadenceHasExpired = getMessageCadenceHasExpired({ userSettings: userSettings.value });

            const showReminders = getShowPasswordReminders({
                unleashClient: extra.unleashClient,
                user: user.value,
                userSettings: userSettings.value,
                organization: organization.value,
            });

            dispatch(passwordReminderActions.setIsAvailable({ isAvailable }));
            dispatch(passwordReminderActions.setAccountType({ accountType }));
            dispatch(passwordReminderActions.setIsEnforced({ isEnforced }));
            dispatch(passwordReminderActions.setIsEnabled({ isEnabled }));
            dispatch(passwordReminderActions.setMessageCadenceHasExpired({ messageCadenceHasExpired }));
            dispatch(passwordReminderActions.setShowReminders({ showReminders }));
        },
    });
};

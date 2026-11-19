import { useCallback } from 'react';

import { useApi } from '@proton/app-context/useApi';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { type ViewLayoutSource, updateViewLayout } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import type { VIEW_LAYOUT } from '@proton/shared/lib/mail/mailSettings';

/**
 * Persists the inbox view layout (Row/Column) and syncs it into the mailSettings store.
 * Shared by the settings page, the quick-settings drawer and the onboarding step so the
 * mutation lives in a single place. Returns the updated MailSettings; callers decide whether
 * to surface a "Preference saved" notification.
 *
 * Only the onboarding passes `source`: the API then also records the choice for the layout experiment.
 */
const useUpdateViewLayout = () => {
    const api = useApi();
    const dispatch = useDispatch();

    return useCallback(
        async (viewLayout: VIEW_LAYOUT, source?: ViewLayoutSource) => {
            const { MailSettings } = await api<{ MailSettings: MailSettings }>(updateViewLayout(viewLayout, source));
            dispatch(mailSettingsActions.updateMailSettings(MailSettings));
            return MailSettings;
        },
        [api, dispatch]
    );
};

export default useUpdateViewLayout;

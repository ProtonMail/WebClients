import { c } from 'ttag';

import { useApi } from '@proton/app-context/useApi';
import { useNotifications } from '@proton/app-context/useNotifications';
import Toggle from '@proton/components/components/toggle/Toggle';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import useLoading from '@proton/hooks/useLoading';
import useToggle from '@proton/hooks/useToggle';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryViewCountersEnabled } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';

export const CategoriesUnreadCountToggle = () => {
    const api = useApi();

    const [mailSettings, mailSettingsLoading] = useMailSettings();

    const [loading, withLoading] = useLoading();
    const { state, toggle } = useToggle(mailSettings.MailCategoryViewCountersEnabled);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleChange = async (checked: boolean) => {
        const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryViewCountersEnabled(checked));
        dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));

        createNotification({ text: c('Success').t`Preference saved` });
        toggle();
    };

    return (
        <SettingsToggleRow
            id="toggleCategoryViewCounters"
            label={<SettingsToggleRow.Label>{c('Label').t`Show unread count`}</SettingsToggleRow.Label>}
            toggle={
                <Toggle
                    id="toggleCategoryViewCounters"
                    checked={state}
                    onChange={({ target }) => withLoading(handleChange(target.checked))}
                    loading={loading || mailSettingsLoading}
                />
            }
        />
    );
};

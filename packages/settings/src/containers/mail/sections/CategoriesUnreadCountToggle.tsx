import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import { SettingsToggleRow } from '@proton/components/containers/account/SettingsToggleRow';
import { useUpdateMailSetting } from '@proton/mail/hooks/useUpdateMailSetting';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';

export const CategoriesUnreadCountToggle = () => {
    const [mailSettings, mailSettingsLoading] = useMailSettings();
    const { update, loading } = useUpdateMailSetting();

    return (
        <SettingsToggleRow
            id="toggleCategoryViewCounters"
            label={<SettingsToggleRow.Label>{c('Label').t`Show unread count`}</SettingsToggleRow.Label>}
            toggle={
                <Toggle
                    id="toggleCategoryViewCounters"
                    checked={mailSettings.MailCategoryViewCountersEnabled}
                    onChange={({ target }) => {
                        update('MailCategoryViewCountersEnabled', target.checked);
                    }}
                    loading={loading || mailSettingsLoading}
                />
            }
        />
    );
};

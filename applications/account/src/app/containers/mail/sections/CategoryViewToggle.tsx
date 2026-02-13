import { c } from 'ttag';

import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import SettingsLayoutLeft from '@proton/components/containers/account/SettingsLayoutLeft';
import SettingsLayoutRight from '@proton/components/containers/account/SettingsLayoutRight';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/store/mailSettings';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';

export const CategoryViewToggle = () => {
    const api = useApi();

    const [mailSettings, mailSettingsLoading] = useMailSettings();

    const [loading, withLoading] = useLoading();
    const { state, toggle } = useToggle(mailSettings.MailCategoryView);
    const { createNotification } = useNotifications();
    const dispatch = useDispatch();

    const handleChange = async (checked: boolean) => {
        const response = await api<{ MailSettings: MailSettings }>(updateMailCategoryView(checked));
        dispatch(mailSettingsActions.updateMailSettings(response.MailSettings));

        createNotification({ text: c('Success').t`Preference saved` });
        toggle();
    };

    return (
        <SettingsLayout className="w-full">
            <SettingsLayoutLeft>
                <label htmlFor="toggleCategoryView" className="text-semibold">
                    <span className="mr-2">{c('Label').t`Use email categories`}</span>
                    <Info title={c('Tooltip').t`Emails in your inbox are shown organized into categories`} />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id="toggleCategoryView"
                    checked={state}
                    onChange={({ target }) => withLoading(handleChange(target.checked))}
                    loading={loading || mailSettingsLoading}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

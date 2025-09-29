import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import Info from '@proton/components/components/link/Info';
import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import useLoading from '@proton/hooks/useLoading';
import { mailSettingsActions } from '@proton/mail/index';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateMailCategoryView } from '@proton/shared/lib/api/mailSettings';
import type { MailSettings } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import SettingsLayout from '../account/SettingsLayout';
import SettingsLayoutLeft from '../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../account/SettingsLayoutRight';

export const CategoryViewSection = () => {
    const api = useApi();

    const [mailSettings, loadingMailSettings] = useMailSettings();
    const [organization, loadingOrganization] = useOrganization();

    const isCategoryViewEnabled = useFlag('CategoryView');

    const [loading, withLoading] = useLoading();
    const { createNotification } = useNotifications();
    const { state, toggle } = useToggle(mailSettings?.MailCategoryView);

    const dispatch = useDispatch();

    const loadingData = loadingMailSettings || loadingOrganization;

    if (!isCategoryViewEnabled || (organization && !organization?.Settings.MailCategoryViewEnabled) || loadingData) {
        return null;
    }

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
                    <span className="mr-2">{c('Label').t`Email categories`}</span>
                    <Info title={c('Tooltip').t`Emails in your inbox are shown organized into categories`} />
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id="toggleCategoryView"
                    checked={state}
                    onChange={({ target }) => withLoading(handleChange(target.checked))}
                    loading={loading}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

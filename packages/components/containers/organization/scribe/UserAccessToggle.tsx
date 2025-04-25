import { c } from 'ttag';

import Toggle from '@proton/components/components/toggle/Toggle';
import useApi from '@proton/components/hooks/useApi';
import useEventManager from '@proton/components/hooks/useEventManager';
import useNotifications from '@proton/components/hooks/useNotifications';
import useToggle from '@proton/components/hooks/useToggle';
import useLoading from '@proton/hooks/useLoading';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { OrganizationExtended } from '@proton/shared/lib/interfaces';

import SettingsLayout from '../../account/SettingsLayout';
import SettingsLayoutLeft from '../../account/SettingsLayoutLeft';
import SettingsLayoutRight from '../../account/SettingsLayoutRight';

interface Props {
    organization?: OrganizationExtended;
}

const UserAccessToggle = ({ organization }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const enabledForAllUsers = !!organization?.Settings.ShowScribeWritingAssistant;
    const { state, toggle } = useToggle(enabledForAllUsers);

    const handleChange = async (value: boolean) => {
        await api(updateOrganizationSettings({ ShowScribeWritingAssistant: value }));
        void call();
        toggle();

        createNotification({ text: c('Success notification').t`Preferences updated` });
    };

    const handleToggleSetting = () => {
        void withLoading(handleChange(!state));
    };

    return (
        <SettingsLayout>
            <SettingsLayoutLeft>
                <label htmlFor="enableAllUsers" className="flex-1">
                    <span className="text-semibold">{c('Title').t`Enable for all users`}</span>
                </label>
                <div className="color-weak text-xs">{c('Description')
                    .t`If disabled, only admins will have access.`}</div>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle id="enableAllUsers" checked={state} onChange={handleToggleSetting} loading={loading} />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

export default UserAccessToggle;

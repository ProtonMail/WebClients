import { c } from 'ttag';

import {
    SettingsLayout,
    SettingsLayoutLeft,
    SettingsLayoutRight,
    Toggle,
    useApi,
    useEventManager,
    useToggle,
} from '@proton/components';
import { useNotifications } from '@proton/components/hooks';
import useLoading from '@proton/hooks/useLoading';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { OrganizationWithSettings } from '@proton/shared/lib/interfaces';

interface Props {
    organization?: OrganizationWithSettings;
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

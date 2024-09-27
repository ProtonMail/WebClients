import { c } from 'ttag';

import { useApi, useEventManager, useNotifications, useOrganization, useToggle } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import { Info, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';

interface Props {
    withInfo?: boolean;
}

export const VideoConferenceToggle = ({ withInfo }: Props) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [organization, loadingOrganization] = useOrganization();
    const { state, toggle } = useToggle(organization?.Settings.VideoConferencingEnabled);

    const handleToggle = async (checked: boolean) => {
        toggle();
        await api(updateOrganizationSettings({ VideoConferencingEnabled: checked }));
        await call();
        createNotification({ text: c('Notification').t`Video conferencing settings have been updated` });
    };

    return (
        <SettingsLayout className="gap-4">
            <SettingsLayoutLeft>
                <label htmlFor="zoomToggle" className="text-semibold">
                    <span className="mr-2">{c('Label').t`Enable video conferencing `}</span>
                    {withInfo && (
                        <Info
                            title={c('Tooltip')
                                .t`Allows to seamlessly add video conferencing links to your calendar invitations.`}
                        />
                    )}
                </label>
            </SettingsLayoutLeft>
            <SettingsLayoutRight isToggleContainer>
                <Toggle
                    id="zoomToggle"
                    checked={state}
                    className="mt-2"
                    loading={loading || loadingOrganization}
                    onChange={({ target }) => withLoading(handleToggle(target.checked))}
                />
            </SettingsLayoutRight>
        </SettingsLayout>
    );
};

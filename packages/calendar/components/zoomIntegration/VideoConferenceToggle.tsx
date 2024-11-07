import { c } from 'ttag';

import { toggleZoomSettings } from '@proton/calendar/calendars/actions';
import { useNotifications, useOrganization, useToggle } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import { Info, SettingsLayoutLeft, SettingsLayoutRight } from '@proton/components/index';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';

import { useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';

interface Props {
    withInfo?: boolean;
}

export const VideoConferenceToggle = ({ withInfo }: Props) => {
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const dispatch = useDispatch();
    const { sendEventVideoConferenceSettingsToggle } = useVideoConfTelemetry();
    const [organization, loadingOrganization] = useOrganization();
    const { state } = useToggle(organization?.Settings.VideoConferencingEnabled);

    const handleToggle = async (checked: boolean) => {
        await dispatch(toggleZoomSettings({ checked }));
        sendEventVideoConferenceSettingsToggle(checked);
        createNotification({ text: c('Notification').t`Video conferencing settings have been updated` });
    };

    return (
        <SettingsLayout className="gap-4">
            <SettingsLayoutLeft>
                <label htmlFor="zoomToggle" className="text-semibold">
                    <span className="mr-2">{c('Label').t`Video conferencing with Zoom`}</span>
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

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { toggleOrganizationSetting } from '@proton/calendar/calendars/actions';
import { Info, SettingsLayoutLeft, SettingsLayoutRight, useNotifications, useToggle } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import useFlag from '@proton/unleash/useFlag';

import { useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';

interface Props {
    withInfo?: boolean;
}

export const VideoConferenceToggle = ({ withInfo }: Props) => {
    const { createNotification } = useNotifications();
    const [zoomLoading, withZoomLoading] = useLoading();
    const [protonMeetLoading, withProtonMeetLoading] = useLoading();
    const dispatch = useDispatch();
    const { sendEventVideoConferenceSettingsToggle, sentEventProtonMeetSettingsToggle } = useVideoConfTelemetry();
    const [organization, loadingOrganization] = useOrganization();
    const { state: zoomState } = useToggle(organization?.Settings.VideoConferencingEnabled);
    const { state: protonMeetState } = useToggle(organization?.Settings.MeetVideoConferencingEnabled);

    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');
    const isZoomEnabled = useFlag('ZoomIntegration');

    const handleZoomToggle = async (checked: boolean) => {
        try {
            await dispatch(toggleOrganizationSetting({ settingName: 'VideoConferencingEnabled', checked }));
            sendEventVideoConferenceSettingsToggle(checked);
            createNotification({ text: c('Notification').t`Zoom video conferencing settings have been updated` });
        } catch (e) {
            createNotification({
                text: c('Notification').t`Failed to update Zoom video conferencing settings`,
                type: 'error',
            });
        }
    };

    const handleProtonMeetToggle = async (checked: boolean) => {
        try {
            await dispatch(toggleOrganizationSetting({ settingName: 'MeetVideoConferencingEnabled', checked }));
            sentEventProtonMeetSettingsToggle(checked);
            createNotification({
                text: c('Notification').t`${MEET_APP_NAME} video conferencing settings have been updated`,
            });
        } catch (e) {
            createNotification({
                text: c('Notification').t`Failed to update ${MEET_APP_NAME} video conferencing settings`,
                type: 'error',
            });
        }
    };

    const settingsLayoutRightClass = withInfo ? undefined : 'flex justify-end';

    return (
        <>
            {isZoomEnabled && (
                <SettingsLayout className="gap-4">
                    <SettingsLayoutLeft>
                        <label htmlFor="zoomToggle" className="text-semibold">
                            <span className="mr-2">{c('Label').t`Video conferencing with Zoom`}</span>
                            {withInfo && (
                                <Info
                                    title={c('Tooltip')
                                        .t`Allows to seamlessly add Zoom video conferencing links to your calendar invitations.`}
                                />
                            )}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer className={settingsLayoutRightClass}>
                        <Toggle
                            id="zoomToggle"
                            checked={zoomState}
                            className="mt-2"
                            loading={zoomLoading || loadingOrganization}
                            onChange={({ target }) => withZoomLoading(handleZoomToggle(target.checked))}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
            {isMeetVideoConferenceEnabled && (
                <SettingsLayout className="gap-4">
                    <SettingsLayoutLeft>
                        <label htmlFor="protonMeetToggle" className="text-semibold">
                            <span className="mr-2">{c('Label').t`Video conferencing with ${MEET_APP_NAME}`}</span>
                            {withInfo && (
                                <Info
                                    title={c('Tooltip')
                                        .t`Allows to seamlessly add ${MEET_APP_NAME} video conferencing links to your calendar invitations.`}
                                />
                            )}
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer className={settingsLayoutRightClass}>
                        <Toggle
                            id="protonMeetToggle"
                            checked={protonMeetState}
                            className="mt-2"
                            loading={protonMeetLoading || loadingOrganization}
                            onChange={({ target }) => withProtonMeetLoading(handleProtonMeetToggle(target.checked))}
                        />
                    </SettingsLayoutRight>
                </SettingsLayout>
            )}
        </>
    );
};

import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { Info, SettingsLayoutLeft, SettingsLayoutRight, useNotifications, useToggle } from '@proton/components';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsLayout from '@proton/components/containers/account/SettingsLayout';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import useFlag from '@proton/unleash/useFlag';

import { toggleOrganizationSetting } from '../../calendars/actions';
import { useVideoConfTelemetry } from '../videoConferencing/useVideoConfTelemetry';

export const VideoConferenceToggle = () => {
    const { createNotification } = useNotifications();
    const [zoomLoading, withZoomLoading] = useLoading();
    const dispatch = useDispatch();
    const { sendEventVideoConferenceSettingsToggle } = useVideoConfTelemetry();
    const [organization, loadingOrganization] = useOrganization();
    const { state: zoomState } = useToggle(organization?.Settings.VideoConferencingEnabled);

    const isZoomEnabled = useFlag('ZoomIntegration');

    const handleZoomToggle = async (checked: boolean) => {
        await dispatch(toggleOrganizationSetting({ settingName: 'VideoConferencingEnabled', checked }));
        sendEventVideoConferenceSettingsToggle(checked);
        createNotification({ text: c('Notification').t`Zoom video conferencing settings have been updated` });
    };

    return (
        <>
            {isZoomEnabled && (
                <SettingsLayout className="gap-4">
                    <SettingsLayoutLeft>
                        <label htmlFor="zoomToggle" className="text-semibold">
                            <span className="mr-2">{c('Label').t`Video conferencing with Zoom`}</span>
                            <Info
                                title={c('Tooltip')
                                    .t`Allows to seamlessly add Zoom video conferencing links to your calendar invitations.`}
                            />
                        </label>
                    </SettingsLayoutLeft>
                    <SettingsLayoutRight isToggleContainer>
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
        </>
    );
};

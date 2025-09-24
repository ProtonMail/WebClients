import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { useVideoConfTelemetry } from '@proton/calendar';
import { useApi, useNotifications } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';
import ZoomLogo from '@proton/styles/assets/img/brand/zoom.svg';
import useFlag from '@proton/unleash/useFlag';

import { AccessToggle } from './AccessToggle';

export const AccessToggleZoom = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();
    const { sendEventVideoConferenceSettingsToggle } = useVideoConfTelemetry();

    const isZoomEnabled = useFlag('ZoomIntegration');

    const [zoomLoading, withZoomLoading] = useLoading();

    const handleToggleZoom = async () => {
        sendEventVideoConferenceSettingsToggle(!organization?.Settings.VideoConferencingEnabled);

        const organizationSettings = await api<OrganizationSettings>(
            updateOrganizationSettings({
                VideoConferencingEnabled: !organization?.Settings.VideoConferencingEnabled,
            })
        );

        dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));
        createNotification({ text: c('Notification').t`Zoom video conferencing settings have been updated` });
    };

    if (!isZoomEnabled) {
        return null;
    }

    return (
        <AccessToggle
            id="zoom-toggle"
            icon={<img src={ZoomLogo} alt="" className="h-6 w-6" />}
            title={c('Title').t`Video conferencing with Zoom`}
            checked={!!organization?.Settings.VideoConferencingEnabled}
            loading={zoomLoading}
            onChange={() => withZoomLoading(handleToggleZoom)}
            className="mt-4"
        >
            <p className="m-0 text-sm">{c('Info').t`Add video conferencing links to calendar invitations`}</p>
        </AccessToggle>
    );
};

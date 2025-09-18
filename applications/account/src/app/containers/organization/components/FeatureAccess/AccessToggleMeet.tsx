import { c } from 'ttag';

import { organizationActions } from '@proton/account/organization';
import { useOrganization } from '@proton/account/organization/hooks';
import { useVideoConfTelemetry } from '@proton/calendar';
import { useApi, useNotifications } from '@proton/components';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import useLoading from '@proton/hooks/useLoading';
import { useDispatch } from '@proton/redux-shared-store';
import { updateOrganizationSettings } from '@proton/shared/lib/api/organization';
import { MEET_APP_NAME } from '@proton/shared/lib/constants';
import type { OrganizationSettings } from '@proton/shared/lib/interfaces';
import useFlag from '@proton/unleash/useFlag';

import { AccessToggle } from '../AccessToggle';

export const AccessToggleMeet = () => {
    const api = useApi();
    const dispatch = useDispatch();
    const [organization] = useOrganization();
    const { createNotification } = useNotifications();

    const isMeetVideoConferenceEnabled = useFlag('NewScheduleOption');

    const [meetLoading, withMeetLoading] = useLoading();

    const { sentEventProtonMeetSettingsToggle } = useVideoConfTelemetry();

    const handleToggleMeet = async () => {
        sentEventProtonMeetSettingsToggle(!organization?.Settings.MeetVideoConferencingEnabled);

        const organizationSettings = await api<OrganizationSettings>(
            updateOrganizationSettings({
                MeetVideoConferencingEnabled: !organization?.Settings.MeetVideoConferencingEnabled,
            })
        );

        dispatch(organizationActions.updateOrganizationSettings({ value: organizationSettings }));

        createNotification({
            text: c('Notification').t`${MEET_APP_NAME} video conferencing settings have been updated`,
        });
    };

    if (!isMeetVideoConferenceEnabled) {
        return null;
    }

    return (
        <AccessToggle
            id="meet-toggle"
            icon={<MeetLogo size={6} variant="glyph-only" />}
            title={c('Title').t`Video conferencing with ${MEET_APP_NAME}`}
            checked={!!organization?.Settings.MeetVideoConferencingEnabled}
            loading={meetLoading}
            onChange={() => {
                void withMeetLoading(handleToggleMeet());
            }}
            className="mt-4"
        >
            <p className="m-0 text-sm">{c('Info')
                .t`Allows to seamlessly add ${MEET_APP_NAME} video conferencing links to your calendar invitations.`}</p>
        </AccessToggle>
    );
};

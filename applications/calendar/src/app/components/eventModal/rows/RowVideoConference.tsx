import { useOrganization } from '@proton/account/organization/hooks';
import { useUser } from '@proton/account/user/hooks';
import { ProtonMeetRow, ZoomRow } from '@proton/calendar';
import { PROTON_MEET_REGEX } from '@proton/calendar/components/videoConferencing/protonMeet/protonMeetHelpers';
import { Spotlight } from '@proton/components';
import type { EventModel } from '@proton/shared/lib/interfaces/calendar';
import { useFlag } from '@proton/unleash';

import useVideoConferenceSpotlight from '../../../hooks/useVideoConferenceSpotlight';

interface Props {
    model: EventModel;
    isCreateEvent: boolean;
    setModel: (value: EventModel) => void;
    hasZoomError: boolean;
}

export const RowVideoConference = ({ model, setModel, isCreateEvent, hasZoomError }: Props) => {
    const [user] = useUser();
    const [organization] = useOrganization();
    const isZoomIntegrationEnabled = useFlag('ZoomIntegration');

    const isProtonMeetEnabled = useFlag('NewScheduleOption');

    const isSettingEnabled = organization?.Settings.VideoConferencingEnabled;
    const hasFullZoomAccess = user.hasPaidMail && isSettingEnabled;
    const hasLimitedZoomAccess = user.hasPaidMail && !isSettingEnabled;
    const hasAccessToZoomIntegration =
        isZoomIntegrationEnabled &&
        // We want to upsell free Mail users or only display the feature for mail subscribers
        (!user.hasPaidMail || hasFullZoomAccess || hasLimitedZoomAccess);

    const { spotlightContent, shouldShowSotlight, onDisplayed, onClose } = useVideoConferenceSpotlight({
        isEventCreation: isCreateEvent,
    });

    const isZoomMeeting = !!model.conferenceUrl?.includes('zoom.us') && !model.isConferenceTmpDeleted;
    const isProtonMeetMeeting = !!model.conferenceUrl?.match(PROTON_MEET_REGEX) && !model.isConferenceTmpDeleted;

    const noActiveMeeting = !isZoomMeeting && !isProtonMeetMeeting;

    if (!hasAccessToZoomIntegration && !isProtonMeetEnabled) {
        return null;
    }

    const getAccessLevel = () => {
        if (!user.hasPaidMail) {
            return 'show-upsell';
        }
        return hasFullZoomAccess ? 'full-access' : 'limited-access';
    };

    return (
        <>
            {isProtonMeetEnabled && (isProtonMeetMeeting || noActiveMeeting) && (
                <ProtonMeetRow model={model} setModel={setModel} isActive={isProtonMeetMeeting} />
            )}
            {(isZoomMeeting || noActiveMeeting) && (
                <Spotlight
                    content={spotlightContent}
                    className="ml-2"
                    show={shouldShowSotlight}
                    onDisplayed={onDisplayed}
                    originalPlacement="left"
                    onClose={onClose}
                >
                    <div>
                        <ZoomRow
                            model={model}
                            setModel={setModel}
                            accessLevel={getAccessLevel()}
                            onRowClick={() => onClose()}
                            hasZoomError={hasZoomError}
                        />
                    </div>
                </Spotlight>
            )}
        </>
    );
};

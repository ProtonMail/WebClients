import { type EventModel, VIDEO_CONFERENCE_PROVIDER } from '@proton/shared/lib/interfaces/calendar';

import { hasValidVideoConferenceInData } from '../videoConferencing/hasValidVideoConferenceInData';

interface ShouldAutoAddMeetingLinkParams {
    isDuplicating?: boolean;
    model: EventModel;
    attendeesCount: number;
    prevAttendeesCount: number;
    triedAddingMeetingLinkToDuplicateEvent?: boolean;
}

export const shouldAutoAddMeetingLink = ({
    isDuplicating = false,
    model,
    attendeesCount,
    prevAttendeesCount,
    triedAddingMeetingLinkToDuplicateEvent = true,
}: ShouldAutoAddMeetingLinkParams) => {
    const hasValidVideoConference = hasValidVideoConferenceInData(model);

    if (hasValidVideoConference) {
        return false;
    }

    if (isDuplicating && !triedAddingMeetingLinkToDuplicateEvent) {
        return attendeesCount > 0 && model.conferenceProvider !== VIDEO_CONFERENCE_PROVIDER.ZOOM;
    }

    return (
        (!model.conferenceUrl ||
            (!!model.isConferenceTmpDeleted && model.conferenceProvider !== VIDEO_CONFERENCE_PROVIDER.ZOOM)) &&
        attendeesCount > 0 &&
        prevAttendeesCount === 0
    );
};

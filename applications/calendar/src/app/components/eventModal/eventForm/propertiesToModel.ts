import { getVideoConferencingData } from '@proton/calendar/videoConferencing/helpers';
import { PROTON_MEET_REGEX_LOCATION, getProtonMeetData } from '@proton/calendar/videoConferencing/protonMeetHelpers';
import { removeVideoConfInfoFromDescription } from '@proton/calendar/videoConferencing/videoConfHelpers';
import { EVENT_VERIFICATION_STATUS, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getDtendProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { getVeventStatus } from '@proton/shared/lib/calendar/vcalHelper';
import {
    type EventModelView,
    type SelfAddressData,
    VIDEO_CONFERENCE_PROVIDER,
    type VcalVeventComponent,
} from '@proton/shared/lib/interfaces/calendar';
import truncate from '@proton/utils/truncate';

import { propertiesToAttendeeModel } from './propertiesToAttendeeModel';
import propertiesToDateTimeModel from './propertiesToDateTimeModel';
import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import { propertiesToOrganizerModel } from './propertiesToOrganizerModel';

const DEFAULT_TIME = {
    value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    parameters: { tzid: 'UTC' },
};

export const propertiesToModel = ({
    veventComponent,
    hasDefaultNotifications,
    verificationStatus = EVENT_VERIFICATION_STATUS.NOT_VERIFIED,
    selfAddressData,
    isAllDay,
    isProtonProtonInvite,
    tzid,
}: {
    veventComponent: VcalVeventComponent;
    hasDefaultNotifications: boolean;
    verificationStatus?: EVENT_VERIFICATION_STATUS;
    selfAddressData?: SelfAddressData;
    isAllDay: boolean;
    isProtonProtonInvite: boolean;
    tzid: string;
}): EventModelView => {
    const {
        uid,
        location,
        description,
        summary,
        dtstart = DEFAULT_TIME,
        rrule,
        attendee,
        organizer,
        color,
        ...rest
    } = veventComponent;

    const { start, end } = propertiesToDateTimeModel(dtstart, getDtendProperty(veventComponent), isAllDay, tzid);
    const { selfAttendeeIndex, selfAddress } = selfAddressData || {};
    let { meetingId, meetingUrl, password, meetingHost, meetingProvider } = getVideoConferencingData(veventComponent);

    // Fallback: when x-pm-conference-* properties are absent but the description contains an embedded Proton Meet link
    if (!meetingUrl && description?.value?.match(PROTON_MEET_REGEX_LOCATION)) {
        const protonMeetData = getProtonMeetData(description.value);
        meetingUrl = protonMeetData.meetingUrl;
        meetingId = protonMeetData.meetingId;
        meetingProvider = VIDEO_CONFERENCE_PROVIDER.PROTON_MEET;
    }

    let cleanDescription = description?.value ?? '';

    // Only clean the description if we have a meeting URL (i.e., the description contains video conferencing info)
    if (meetingUrl) {
        cleanDescription = removeVideoConfInfoFromDescription(cleanDescription);
    }

    return {
        uid: uid ? uid.value : undefined,
        frequencyModel: propertiesToFrequencyModel(rrule, start),
        title: truncate((summary?.value ?? '').trim(), MAX_CHARS_API.TITLE),
        location: truncate((location?.value ?? '').trim(), MAX_CHARS_API.LOCATION),
        description: truncate(cleanDescription.trim(), MAX_CHARS_API.EVENT_DESCRIPTION),
        color: color?.value,
        attendees: propertiesToAttendeeModel(attendee),
        organizer: propertiesToOrganizerModel(organizer),
        isProtonProtonInvite,
        status: getVeventStatus(veventComponent),
        verificationStatus,
        isOrganizer: !!selfAddressData?.isOrganizer,
        isAttendee: !!selfAddressData?.isAttendee,
        hasDefaultNotifications,
        selfAttendeeIndex,
        selfAddress,
        start,
        end,
        conferenceId: meetingId,
        conferenceUrl: meetingUrl,
        conferencePassword: password,
        conferenceHost: meetingHost,
        conferenceProvider: meetingProvider,
        rest,
    };
};

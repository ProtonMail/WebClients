import { getVideoConferencingData } from '@proton/calendar';
import { removeZoomInfoFromDescription } from '@proton/calendar/components/videoConferencing/zoom/zoomHelpers';
import { EVENT_VERIFICATION_STATUS, MAX_CHARS_API } from '@proton/shared/lib/calendar/constants';
import { getDtendProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { getVeventStatus } from '@proton/shared/lib/calendar/vcalHelper';
import type { EventModelView, SelfAddressData, VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar';
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
    const { meetingId, meetingUrl, password, meetingHost } = getVideoConferencingData(veventComponent);

    const cleanDescription = removeZoomInfoFromDescription(description?.value ?? '');

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
        rest,
    };
};

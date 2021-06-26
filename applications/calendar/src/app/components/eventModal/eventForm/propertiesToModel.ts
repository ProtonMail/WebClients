import { MAX_LENGTHS, EVENT_VERIFICATION_STATUS } from '@proton/shared/lib/calendar/constants';
import { EventModelView, DecryptedVeventResult } from '@proton/shared/lib/interfaces/calendar';
import { getDtendProperty } from '@proton/shared/lib/calendar/vcalConverter';
import { getEventStatus } from '@proton/shared/lib/calendar/vcalHelper';
import { truncate } from '@proton/shared/lib/helpers/string';

import { RequireSome } from '@proton/shared/lib/interfaces/utils';

import { propertiesToAttendeeModel } from './propertiesToAttendeeModel';
import propertiesToDateTimeModel from './propertiesToDateTimeModel';

import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import { propertiesToOrganizerModel } from './propertiesToOrganizerModel';

const DEFAULT_TIME = {
    value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    parameters: { tzid: 'UTC' },
};

export const propertiesToModel = (
    {
        veventComponent,
        verificationStatus = EVENT_VERIFICATION_STATUS.NOT_VERIFIED,
        selfAddressData,
    }: RequireSome<Partial<DecryptedVeventResult>, 'veventComponent'>,
    isAllDay: boolean,
    isOrganizer: boolean,
    tzid: string
): EventModelView => {
    const {
        uid,
        location,
        description,
        summary,
        dtstart = DEFAULT_TIME,
        rrule,
        attendee,
        organizer,
        ...rest
    } = veventComponent;

    const { start, end } = propertiesToDateTimeModel(dtstart, getDtendProperty(veventComponent), isAllDay, tzid);
    const { selfAttendeeIndex, selfAddress } = selfAddressData || {};
    const titleString = summary?.value ?? '';
    const locationString = location?.value ?? '';
    const descriptionString = description?.value ?? '';

    return {
        uid: uid ? uid.value : undefined,
        frequencyModel: propertiesToFrequencyModel(rrule, start, !isOrganizer),
        title: truncate(titleString.trim(), MAX_LENGTHS.TITLE),
        location: truncate(locationString.trim(), MAX_LENGTHS.LOCATION),
        description: truncate(descriptionString.trim(), MAX_LENGTHS.EVENT_DESCRIPTION),
        attendees: propertiesToAttendeeModel(attendee),
        organizer: propertiesToOrganizerModel(organizer),
        isOrganizer,
        status: getEventStatus(veventComponent),
        verificationStatus,
        selfAttendeeIndex,
        selfAddress,
        start,
        end,
        rest,
    };
};

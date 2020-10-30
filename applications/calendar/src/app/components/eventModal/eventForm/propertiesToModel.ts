import { MAX_LENGTHS } from 'proton-shared/lib/calendar/constants';
import { EVENT_VERIFICATION_STATUS } from 'proton-shared/lib/calendar/interface';
import { getDtendProperty } from 'proton-shared/lib/calendar/vcalConverter';
import { getEventStatus } from 'proton-shared/lib/calendar/vcalHelper';
import { truncate } from 'proton-shared/lib/helpers/string';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { EventModelView } from '../../../interfaces/EventModel';
import { propertiesToAttendeeModel } from './propertiesToAttendeeModel';
import propertiesToDateTimeModel from './propertiesToDateTimeModel';

import { propertiesToFrequencyModel } from './propertiesToFrequencyModel';
import { propertiesToOrganizerModel } from './propertiesToOrganizerModel';

const DEFAULT_TIME = {
    value: { year: 1970, month: 1, day: 1, hours: 0, minutes: 0, seconds: 0, isUTC: true },
    parameters: { tzid: 'UTC' },
};

export const propertiesToModel = (
    component: VcalVeventComponent,
    isAllDay: boolean,
    isOrganizer: boolean,
    tzid: string,
    verificationStatus = EVENT_VERIFICATION_STATUS.NOT_VERIFIED
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
    } = component;

    const { start, end } = propertiesToDateTimeModel(dtstart, getDtendProperty(component), isAllDay, tzid);
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
        status: getEventStatus(component),
        verificationStatus,
        start,
        end,
        rest,
    };
};

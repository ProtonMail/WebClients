import { FREQUENCY } from '@proton/shared/lib/calendar/constants';

import type { CalendarViewEventTemporaryEvent } from '../containers/calendar/interface';

export const getNESTData = (temporaryEvent: CalendarViewEventTemporaryEvent) => {
    return {
        isRecurring: temporaryEvent.tmpData.frequencyModel.frequency !== FREQUENCY.ONCE,
        hasInvitees: temporaryEvent.tmpData.attendees.length > 0,
        hasConferenceData: !!temporaryEvent.tmpData.conferenceId && !!temporaryEvent.tmpData.conferenceUrl,
    };
};

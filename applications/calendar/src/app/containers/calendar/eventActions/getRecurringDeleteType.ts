import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES } from '../../../constants';
import { getHasAnsweredSingleEdits } from '../../../helpers/attendees';
import { InviteActions } from './inviteActions';
import { getHasFutureOption, getRecurrenceEvents } from './recurringHelper';
import { EventOldData } from '../../../interfaces/EventData';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { OnDeleteConfirmationCb } from '../interface';

interface Arguments {
    originalEditEventData: EventOldData;
    recurrences: CalendarEvent[];
    recurrence: CalendarEventRecurring;
    inviteActions: InviteActions;
    veventComponent?: VcalVeventComponent;
    canOnlyDeleteAll: boolean;
    canOnlyDeleteThis: boolean;
    hasSingleModifications: boolean;
    hasOnlyCancelledSingleModifications: boolean;
    isInvitation: boolean;
    onDeleteConfirmation: OnDeleteConfirmationCb;
    selfAttendeeToken?: string;
}
const getRecurringDeleteType = ({
    originalEditEventData,
    recurrences,
    recurrence,
    canOnlyDeleteAll,
    canOnlyDeleteThis,
    hasSingleModifications,
    hasOnlyCancelledSingleModifications,
    isInvitation,
    onDeleteConfirmation,
    inviteActions,
    veventComponent,
    selfAttendeeToken,
}: Arguments) => {
    let deleteTypes;
    if (canOnlyDeleteAll || !originalEditEventData.veventComponent) {
        deleteTypes = [RECURRING_TYPES.ALL];
    } else if (canOnlyDeleteThis) {
        deleteTypes = [RECURRING_TYPES.SINGLE];
    } else if (getHasFutureOption(originalEditEventData.veventComponent, recurrence)) {
        deleteTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.FUTURE, RECURRING_TYPES.ALL];
    } else {
        deleteTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
    }
    const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEditEventData.eventData);
    const singleEditRecurrencesWithoutSelf = singleEditRecurrences.filter((event) => {
        return event.ID !== originalEditEventData.eventData.ID;
    });
    const hasAnsweredSingleEdits = getHasAnsweredSingleEdits(singleEditRecurrencesWithoutSelf, selfAttendeeToken);
    const updatedInviteActions = {
        ...inviteActions,
        resetSingleEditsPartstat:
            deleteTypes.length === 1 && deleteTypes[0] === RECURRING_TYPES.ALL && hasAnsweredSingleEdits,
    };
    return onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.RECURRING,
        data: { types: deleteTypes, hasSingleModifications, hasOnlyCancelledSingleModifications },
        inviteActions: updatedInviteActions,
        isInvitation,
        veventComponent,
    });
};

export default getRecurringDeleteType;

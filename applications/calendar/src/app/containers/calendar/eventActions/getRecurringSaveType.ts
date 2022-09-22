import { RECURRING_TYPES, SAVE_CONFIRMATION_TYPES } from '@proton/shared/lib/calendar/constants';
import { getMustResetPartstat } from '@proton/shared/lib/calendar/integration/invite';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import { INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';
import { OnSaveConfirmationCb } from '../interface';
import { getExdatesAfter, getHasFutureOption, getRecurrenceEvents, getRecurrenceEventsAfter } from './recurringHelper';

interface Arguments {
    originalEditEventData: EventOldData;
    oldEditEventData: EventOldData;
    canOnlySaveAll: boolean;
    canOnlySaveThis: boolean;
    onSaveConfirmation: OnSaveConfirmationCb;
    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    hasModifiedRrule: boolean;
    hasModifiedCalendar: boolean;
    isAttendee: boolean;
    inviteActions: InviteActions;
    selfAttendeeToken?: string;
}

const getRecurringSaveType = async ({
    originalEditEventData,
    oldEditEventData,
    canOnlySaveAll,
    canOnlySaveThis,
    onSaveConfirmation,
    recurrences,
    recurrence,
    hasModifiedRrule,
    hasModifiedCalendar,
    isAttendee,
    inviteActions,
    selfAttendeeToken,
}: Arguments) => {
    const isFutureAllowed = getHasFutureOption(originalEditEventData.mainVeventComponent, recurrence);
    let saveTypes;

    if (canOnlySaveAll) {
        saveTypes = [RECURRING_TYPES.ALL];
    } else if (canOnlySaveThis) {
        saveTypes = [RECURRING_TYPES.SINGLE];
    } else if (isFutureAllowed) {
        saveTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.FUTURE, RECURRING_TYPES.ALL];
    } else {
        saveTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
    }

    const singleEditRecurrences = getRecurrenceEvents(recurrences, originalEditEventData.eventData);
    const singleEditRecurrencesWithoutSelf = singleEditRecurrences.filter((event) => {
        return event.ID !== oldEditEventData.eventData.ID;
    });
    // Since this is inclusive, ignore this single edit instance event since that would always become the new start
    const singleEditRecurrencesAfter = getRecurrenceEventsAfter(
        singleEditRecurrencesWithoutSelf,
        recurrence.localStart
    );
    const exdates = originalEditEventData.mainVeventComponent.exdate || [];
    const exdatesAfter = getExdatesAfter(exdates, recurrence.localStart);

    const hasSingleModifications = singleEditRecurrencesWithoutSelf.length >= 1 || exdates.length >= 1;
    const hasSingleModificationsAfter = singleEditRecurrencesAfter.length >= 1 || exdatesAfter.length >= 1;

    const mustResetPartstat = getMustResetPartstat(
        singleEditRecurrencesWithoutSelf,
        selfAttendeeToken,
        inviteActions.partstat
    );
    const updatedInviteActions = {
        ...inviteActions,
        resetSingleEditsPartstat:
            saveTypes.length === 1 &&
            saveTypes[0] === RECURRING_TYPES.ALL &&
            inviteActions.type === INVITE_ACTION_TYPES.CHANGE_PARTSTAT &&
            mustResetPartstat,
    };

    return onSaveConfirmation({
        type: SAVE_CONFIRMATION_TYPES.RECURRING,
        data: {
            types: saveTypes,
            hasSingleModifications,
            hasSingleModificationsAfter,
            hasRruleModification: hasModifiedRrule,
            hasCalendarModification: hasModifiedCalendar,
        },
        inviteActions: updatedInviteActions,
        isAttendee,
    });
};

export default getRecurringSaveType;

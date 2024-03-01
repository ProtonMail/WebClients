import { RECURRING_TYPES, SAVE_CONFIRMATION_TYPES } from '@proton/shared/lib/calendar/constants';
import { getMustResetPartstat } from '@proton/shared/lib/calendar/mailIntegration/invite';
import { CalendarEvent, VcalDateOrDateTimeProperty } from '@proton/shared/lib/interfaces/calendar';

import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { EventOldData } from '../../../interfaces/EventData';
import { INVITE_ACTION_TYPES, InviteActions } from '../../../interfaces/Invite';
import { OnSaveConfirmationCb } from '../interface';
import { getExdatesAfter, getHasFutureOption, getRecurrenceEventsAfter } from './recurringHelper';

interface Arguments {
    originalEditEventData: EventOldData;
    canOnlySaveAll: boolean;
    canOnlySaveThis: boolean;
    cannotDeleteThisAndFuture: boolean;
    onSaveConfirmation: OnSaveConfirmationCb;
    recurrence: CalendarEventRecurring;
    singleEdits: CalendarEvent[];
    exdates: VcalDateOrDateTimeProperty[];
    hasModifiedRrule: boolean;
    hasModifiedCalendar: boolean;
    isBreakingChange: boolean;
    isOrganizer: boolean;
    isAttendee: boolean;
    canEditOnlyPersonalPart: boolean;
    inviteActions: InviteActions;
    selfAttendeeToken?: string;
}

const getRecurringSaveType = async ({
    originalEditEventData,
    canOnlySaveAll,
    canOnlySaveThis,
    cannotDeleteThisAndFuture,
    onSaveConfirmation,
    recurrence,
    singleEdits,
    exdates,
    hasModifiedRrule,
    hasModifiedCalendar,
    isBreakingChange,
    isOrganizer,
    isAttendee,
    canEditOnlyPersonalPart,
    inviteActions,
    selfAttendeeToken,
}: Arguments) => {
    const isFutureAllowed =
        getHasFutureOption(originalEditEventData.mainVeventComponent, recurrence) && !cannotDeleteThisAndFuture;
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

    const singleEditsAfter = getRecurrenceEventsAfter(singleEdits, recurrence.localStart);
    const exdatesAfter = getExdatesAfter(exdates, recurrence.localStart);

    const hasSingleEdits = singleEdits.length >= 1;
    const hasSingleDeletes = exdates.length >= 1;
    const hasSingleEditsAfter = singleEditsAfter.length >= 1;
    const hasSingleDeletesAfter = exdatesAfter.length >= 1;

    const mustResetPartstat = getMustResetPartstat(singleEdits, selfAttendeeToken, inviteActions.partstat);
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
            hasSingleEdits,
            hasSingleDeletes,
            hasSingleEditsAfter,
            hasSingleDeletesAfter,
            hasRruleModification: hasModifiedRrule,
            hasCalendarModification: hasModifiedCalendar,
            isBreakingChange,
        },
        inviteActions: updatedInviteActions,
        isOrganizer,
        isAttendee,
        canEditOnlyPersonalPart,
    });
};

export default getRecurringSaveType;

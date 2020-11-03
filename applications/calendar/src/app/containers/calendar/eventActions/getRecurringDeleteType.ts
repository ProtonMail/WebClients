import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES } from '../../../constants';
import { InviteActions } from './inviteActions';
import { getHasFutureOption } from './recurringHelper';
import { EventOldData } from '../../../interfaces/EventData';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { OnDeleteConfirmationCb } from '../interface';

interface Arguments {
    originalEditEventData: EventOldData;
    recurrence: CalendarEventRecurring;
    inviteActions: InviteActions;
    veventComponent?: VcalVeventComponent;
    canOnlyDeleteAll: boolean;
    canOnlyDeleteThis: boolean;
    onDeleteConfirmation: OnDeleteConfirmationCb;
}
const getRecurringDeleteType = ({
    originalEditEventData,
    recurrence,
    canOnlyDeleteAll,
    canOnlyDeleteThis,
    onDeleteConfirmation,
    inviteActions,
    veventComponent,
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
    return onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.RECURRING,
        data: deleteTypes,
        inviteActions,
        veventComponent,
    });
};

export default getRecurringDeleteType;

import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES } from '../../../constants';
import { getHasFutureOption } from './recurringHelper';
import { EventOldData } from '../../../interfaces/EventData';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { OnDeleteConfirmationCb } from '../interface';

interface Arguments {
    originalEditEventData: EventOldData;
    recurrence: CalendarEventRecurring;
    canOnlyDeleteAll: boolean;
    onDeleteConfirmation: OnDeleteConfirmationCb;
}
const getRecurringDeleteType = ({
    originalEditEventData,
    recurrence,
    canOnlyDeleteAll,
    onDeleteConfirmation,
}: Arguments) => {
    let deleteTypes;
    if (canOnlyDeleteAll || !originalEditEventData.veventComponent) {
        deleteTypes = [RECURRING_TYPES.ALL];
    } else if (getHasFutureOption(originalEditEventData.veventComponent, recurrence)) {
        deleteTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.FUTURE, RECURRING_TYPES.ALL];
    } else {
        deleteTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
    }
    return onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.RECURRING,
        data: deleteTypes,
    });
};

export default getRecurringDeleteType;

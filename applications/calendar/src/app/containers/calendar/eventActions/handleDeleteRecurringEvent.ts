import { useGetAddressKeys } from 'react-components';
import { Api } from 'proton-shared/lib/interfaces';
import { CalendarEvent } from 'proton-shared/lib/interfaces/calendar/Event';
import { DELETE_CONFIRMATION_TYPES, RECURRING_TYPES } from '../../../constants';
import { CalendarEventRecurring } from '../../../interfaces/CalendarEvents';
import { getDeleteRecurringEventActions } from './getDeleteRecurringEventActions';
import getSyncMultipleEventsPayload from '../getSyncMultipleEventsPayload';
import { getRecurringEventDeletedText } from '../../../components/eventModal/eventForm/i18n';
import { getHasFutureOption } from './recurringHelper';
import { EventOldData } from '../../../interfaces/EventData';
import { OnDeleteConfirmationCb } from '../interface';

interface Arguments {
    originalEventData: EventOldData;
    oldEventData: EventOldData;

    recurrence: CalendarEventRecurring;
    recurrences: CalendarEvent[];
    canOnlyDeleteAll: boolean;

    onDeleteConfirmation: OnDeleteConfirmationCb;
    api: Api;
    call: () => Promise<void>;
    createNotification: (data: any) => void;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
}
const handleDeleteRecurringEvent = async ({
    originalEventData,
    oldEventData,

    recurrence,
    recurrences,
    canOnlyDeleteAll,

    onDeleteConfirmation,
    api,
    call,
    createNotification,
    getAddressKeys,
    getCalendarKeys,
}: Arguments) => {
    let deleteTypes;
    if (canOnlyDeleteAll || !originalEventData.veventComponent) {
        deleteTypes = [RECURRING_TYPES.ALL];
    } else if (getHasFutureOption(originalEventData.veventComponent, recurrence)) {
        deleteTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.FUTURE, RECURRING_TYPES.ALL];
    } else {
        deleteTypes = [RECURRING_TYPES.SINGLE, RECURRING_TYPES.ALL];
    }

    const deleteType = await onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.RECURRING,
        data: deleteTypes,
    });

    const sync = getDeleteRecurringEventActions({
        type: deleteType,
        recurrence,
        recurrences,
        originalEventData,
        oldEventData,
    });

    const payload = await getSyncMultipleEventsPayload({
        getAddressKeys,
        getCalendarKeys,
        sync,
    });
    await api(payload);
    await call();

    createNotification({ text: getRecurringEventDeletedText(deleteType) });
};

export default handleDeleteRecurringEvent;

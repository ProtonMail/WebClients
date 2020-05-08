import { useGetAddressKeys } from 'react-components';
import { Api } from 'proton-shared/lib/interfaces';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';
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
    getCalendarKeys
}: Arguments) => {
    const deleteTypes =
        canOnlyDeleteAll || !originalEventData.veventComponent
            ? [RECURRING_TYPES.ALL]
            : [
                  RECURRING_TYPES.SINGLE,
                  getHasFutureOption(originalEventData.veventComponent, recurrence)
                      ? RECURRING_TYPES.FUTURE
                      : undefined,
                  RECURRING_TYPES.ALL
              ].filter(isTruthy);

    const deleteType = await onDeleteConfirmation({
        type: DELETE_CONFIRMATION_TYPES.RECURRING,
        data: deleteTypes
    });

    const sync = getDeleteRecurringEventActions({
        type: deleteType,
        recurrence,
        recurrences,
        originalEventData,
        oldEventData
    });

    const payload = await getSyncMultipleEventsPayload({
        getAddressKeys,
        getCalendarKeys,
        sync
    });
    await api(payload);
    await call();

    createNotification({ text: getRecurringEventDeletedText(deleteType) });
};

export default handleDeleteRecurringEvent;

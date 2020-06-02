import { c } from 'ttag';
import { useGetAddressKeys } from 'react-components';
import { omit } from 'proton-shared/lib/helpers/object';
import { noop } from 'proton-shared/lib/helpers/function';
import { Calendar, CalendarBootstrap } from 'proton-shared/lib/interfaces/calendar';
import { Address, Api } from 'proton-shared/lib/interfaces';
import { VcalVeventComponent } from 'proton-shared/lib/interfaces/calendar/VcalModel';
import { modelToVeventComponent } from '../../../components/eventModal/eventForm/modelToProperties';
import getMemberAndAddress from '../../../helpers/getMemberAndAddress';
import getEditEventData from '../event/getEditEventData';
import getAllEventsByUID from '../getAllEventsByUID';
import { getOriginalEvent } from './recurringHelper';
import getSingleEditRecurringData from '../event/getSingleEditRecurringData';
import handleSaveSingleEvent from './handleSaveSingleEvent';
import handleSaveRecurringEvent from './handleSaveRecurringEvent';
import withVeventRruleWkst, { withRruleWkst } from './rruleWkst';
import { withRruleUntil } from './rruleUntil';
import { GetDecryptedEventCb } from '../eventStore/interface';
import { CalendarViewEventTemporaryEvent, OnSaveConfirmationCb, WeekStartsOn } from '../interface';
import { getIsCalendarEvent } from '../eventStore/cache/helper';

interface Arguments {
    temporaryEvent: CalendarViewEventTemporaryEvent;
    weekStartsOn: WeekStartsOn;

    addresses: Address[];
    calendars: Calendar[];

    onSaveConfirmation: OnSaveConfirmationCb;

    api: Api;
    call: () => Promise<void>;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarKeys: ReturnType<typeof useGetAddressKeys>;
    getCalendarBootstrap: (CalendarID: string) => CalendarBootstrap;
    getEventDecrypted: GetDecryptedEventCb;
    createNotification: (data: any) => void;
}

const handleSaveEvent = async ({
    temporaryEvent,
    weekStartsOn,

    addresses,
    calendars,

    onSaveConfirmation,

    api,
    call,
    getAddressKeys,
    getCalendarKeys,
    getEventDecrypted,
    getCalendarBootstrap,
    createNotification,
}: Arguments) => {
    const {
        tmpOriginalTarget: { data: { eventData: oldEventData, eventRecurrence, eventReadResult } } = { data: {} },
        tmpData,
        tmpData: {
            calendar: { id: newCalendarID },
            member: { memberID: newMemberID, addressID: newAddressID },
        },
    } = temporaryEvent;

    // All updates will remove any existing exdates since they would be more complicated to normalize
    const modelVeventComponent = modelToVeventComponent(tmpData) as VcalVeventComponent;
    const newVeventComponent = withVeventRruleWkst(omit(modelVeventComponent, ['exdate']), weekStartsOn);

    const newEditEventData = {
        veventComponent: newVeventComponent,
        calendarID: newCalendarID,
        memberID: newMemberID,
        addressID: newAddressID,
    };

    // Creation
    if (!oldEventData) {
        return handleSaveSingleEvent({
            newEditEventData,

            calendars,
            api,
            call,
            getAddressKeys,
            getCalendarKeys,
            createNotification,
        });
    }

    const calendarBootstrap = getCalendarBootstrap(oldEventData.CalendarID);
    if (!calendarBootstrap) {
        throw new Error('Trying to update event without a calendar');
    }
    if (!getIsCalendarEvent(oldEventData) || !eventReadResult?.result) {
        throw new Error('Trying to edit event without event information');
    }

    const oldEditEventData = getEditEventData({
        eventData: oldEventData,
        eventResult: eventReadResult.result,
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, oldEventData.Author),
    });

    // If it's not an occurrence of a recurring event, or a single edit of a recurring event
    if (!eventRecurrence && !oldEditEventData.recurrenceID) {
        return handleSaveSingleEvent({
            oldEditEventData,
            newEditEventData,

            calendars,
            api,
            call,
            getAddressKeys,
            getCalendarKeys,
            createNotification,
        });
    }

    const recurrences = await getAllEventsByUID(api, oldEditEventData.uid, oldEditEventData.calendarID);

    const originalEventData = getOriginalEvent(recurrences);
    const originalEventResult = originalEventData ? await getEventDecrypted(originalEventData).catch(noop) : undefined;
    if (!originalEventData || !originalEventResult?.[0]) {
        createNotification({
            text: c('Recurring update').t`Cannot save a recurring event without the original event`,
            type: 'error',
        });
        throw new Error('Original event not found');
    }

    const originalEditEventData = getEditEventData({
        eventData: originalEventData,
        eventResult: originalEventResult,
        memberResult: getMemberAndAddress(addresses, calendarBootstrap.Members, originalEventData.Author),
    });

    const actualEventRecurrence =
        eventRecurrence ||
        getSingleEditRecurringData(originalEditEventData.mainVeventComponent, oldEditEventData.mainVeventComponent);

    if (newVeventComponent['recurrence-id'] && originalEditEventData.mainVeventComponent.rrule) {
        // Since single edits are not allowed to edit the RRULE, append the old one here. Take into account when
        // a part day is changed into full day with the until rule.
        const singleEditWithRrule: VcalVeventComponent = {
            ...newVeventComponent,
            rrule: withRruleUntil(
                withRruleWkst(originalEditEventData.mainVeventComponent.rrule, weekStartsOn),
                newVeventComponent.dtstart
            ),
        };
        newEditEventData.veventComponent = singleEditWithRrule;
    }

    return handleSaveRecurringEvent({
        originalEditEventData,
        oldEditEventData,
        newEditEventData,

        canOnlySaveAll: actualEventRecurrence.isSingleOccurrence,
        onSaveConfirmation,

        recurrence: actualEventRecurrence,
        recurrences,
        api,
        call,
        createNotification,
        getAddressKeys,
        getCalendarKeys,
        calendars,
    });
};

export default handleSaveEvent;

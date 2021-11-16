import { readSessionKeys } from '@proton/shared/lib/calendar/deserialize';
import { toUTCDate } from '@proton/shared/lib/date/timezone';
import { uint8ArrayToBase64String } from '@proton/shared/lib/helpers/encoding';
import { CalendarEvent } from '@proton/shared/lib/interfaces/calendar';
import { VcalVeventComponent } from '@proton/shared/lib/interfaces/calendar/VcalModel';
import { getRecurrenceId } from '@proton/shared/lib/calendar/vcalHelper';
import { splitKeys } from '@proton/shared/lib/keys';
import { useGetCalendarKeys } from '@proton/components/hooks/useGetDecryptedPassphraseAndCalendarKeys';

export const getRecurrenceIdDate = (component: VcalVeventComponent) => {
    const rawRecurrenceId = getRecurrenceId(component);
    if (!rawRecurrenceId || !rawRecurrenceId.value) {
        return;
    }
    return toUTCDate(rawRecurrenceId.value);
};

export const getUidValue = (component: VcalVeventComponent) => {
    return component.uid.value;
};

export const getSharedEventIDAndSessionKey = async ({
    calendarEvent,
    getCalendarKeys,
}: {
    calendarEvent?: CalendarEvent;
    getCalendarKeys: ReturnType<typeof useGetCalendarKeys>;
}) => {
    if (!calendarEvent) {
        return {};
    }
    try {
        const { CalendarID, SharedEventID } = calendarEvent;
        // we need to decrypt the sharedKeyPacket in Event to obtain the decrypted session key
        const { privateKeys } = splitKeys(await getCalendarKeys(CalendarID));
        const [sessionKey] = await readSessionKeys({ calendarEvent, privateKeys });

        return {
            sharedEventID: SharedEventID,
            sharedSessionKey: sessionKey ? uint8ArrayToBase64String(sessionKey.data) : undefined,
        };
    } catch (e: any) {
        return {};
    }
};

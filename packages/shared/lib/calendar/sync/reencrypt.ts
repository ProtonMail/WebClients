import type { SessionKey } from '@proton/crypto';

import { upgradeP2PInvite } from '../../api/calendars';
import type { Api } from '../../interfaces';
import type { CalendarEvent, DecryptedCalendarKey } from '../../interfaces/calendar';
import { getEncryptedSessionKey } from '../crypto/encrypt';
import { getPrimaryCalendarKey } from '../crypto/keys/helpers';

export const reencryptCalendarSharedEvent = async ({
    calendarEvent,
    sharedSessionKey,
    calendarKeys,
    api,
}: {
    calendarEvent: CalendarEvent;
    sharedSessionKey: SessionKey;
    calendarKeys: DecryptedCalendarKey[];
    api: Api;
}): Promise<CalendarEvent> => {
    const { publicKey } = getPrimaryCalendarKey(calendarKeys);

    const SharedKeyPacket = (await getEncryptedSessionKey(sharedSessionKey, publicKey)).toBase64();

    const { Event } = await api<{ Event: CalendarEvent }>(
        upgradeP2PInvite(calendarEvent.CalendarID, calendarEvent.ID, { SharedKeyPacket })
    );

    return Event;
};

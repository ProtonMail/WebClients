import { c } from 'ttag';

import { hasBit } from '../../helpers/bitset';
import { KEY_FLAGS } from '../../keys/calendarKeys';
import { readSessionKeys } from '../deserialize';
import { splitKeys } from '../../keys/keys';
import { createCalendarEvent } from '../serialize';
import { createEvent, updateEvent } from '../../api/calendars';

export default async ({ Event, veventComponent, calendarID, memberID, addressKeys = [], calendarKeys = [], api }) => {
    const [{ privateKey: primaryAddressKey } = {}] = addressKeys;

    if (!primaryAddressKey || !primaryAddressKey.isDecrypted()) {
        throw new Error(c('Error').t`Primary address key not found`);
    }

    const { privateKey: primaryCalendarKey, publicKey: publicCalendarKey } =
        calendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, KEY_FLAGS.PRIMARY)) || {};

    if (!primaryCalendarKey || !primaryCalendarKey.isDecrypted()) {
        throw new Error(c('Error').t`Primary calendar key is not decrypted`);
    }

    // If there is an event (update) and the calendar was not changed.
    const [sharedSessionKey, calendarSessionKey] =
        Event && calendarID === Event.CalendarID
            ? await readSessionKeys(Event, splitKeys(calendarKeys).privateKeys)
            : [];

    const data = await createCalendarEvent({
        eventComponent: veventComponent,
        privateKey: primaryCalendarKey,
        publicKey: publicCalendarKey,
        signingKey: primaryAddressKey,
        sharedSessionKey,
        calendarSessionKey
    });

    if (Event && calendarID === Event.CalendarID) {
        await api(
            updateEvent(Event.CalendarID, Event.ID, {
                ...data,
                MemberID: memberID,
                Permissions: 3 // TODO what?
            })
        );
    } else {
        await api(
            createEvent(calendarID, {
                ...data,
                MemberID: memberID,
                Permissions: 3 // TODO what?
            })
        );
    }
};

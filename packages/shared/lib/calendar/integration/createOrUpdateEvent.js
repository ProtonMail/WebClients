import { c } from 'ttag';

import { hasBit } from '../../helpers/bitset';
import { KeyFlags } from '../../keys/calendarKeys';
import getPrimaryKey from '../../keys/getPrimaryKey';
import { readSessionKeys } from '../deserialize';
import { splitKeys } from '../../keys/keys';
import { createCalendarEvent } from '../serialize';
import { addSharedEvent, createEvent, updateEvent } from '../../api/calendars';

export default async ({
    Event,
    veventComponent,
    calendarID,
    memberID,
    addressKeys = [],
    oldCalendarKeys = [],
    calendarKeys = [],
    api
}) => {
    const primaryAddressKey = getPrimaryKey(addressKeys);
    const primaryPrivateAddressKey = primaryAddressKey ? primaryAddressKey.privateKey : undefined;

    if (!primaryPrivateAddressKey) {
        throw new Error(c('Error').t`Primary private address key not found`);
    }

    const { privateKey: primaryPrivateCalendarKey, publicKey: publicCalendarKey } =
        calendarKeys.find(({ Key: { Flags } }) => hasBit(Flags, KeyFlags.PRIMARY)) || {};

    if (!primaryPrivateCalendarKey) {
        throw new Error(c('Error').t`Primary private calendar key is not decrypted`);
    }

    // If there is no event
    const [sharedSessionKey, calendarSessionKey] = Event
        ? await readSessionKeys(Event, splitKeys(oldCalendarKeys).privateKeys)
        : [];
    const switchCalendar = !!Event && Event.CalendarID !== calendarID;

    const data = await createCalendarEvent({
        eventComponent: veventComponent,
        privateKey: primaryPrivateCalendarKey,
        publicKey: publicCalendarKey,
        signingKey: primaryPrivateAddressKey,
        sharedSessionKey,
        calendarSessionKey,
        switchCalendar
    });

    if (Event) {
        if (switchCalendar) {
            await api(
                addSharedEvent(calendarID, {
                    ...data,
                    UID: veventComponent.uid.value,
                    Overwrite: 1,
                    MemberID: memberID,
                    Permissions: 3 // TODO what?
                })
            );
        } else {
            await api(
                updateEvent(Event.CalendarID, Event.ID, {
                    ...data,
                    MemberID: memberID,
                    Permissions: 3 // TODO what?
                })
            );
        }
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

import { c } from 'ttag';
import { useGetAddressKeys } from '@proton/components/hooks';
import { Address, Api } from '../../interfaces';
import { Calendar, Member } from '../../interfaces/calendar';
import { queryMembers, setupCalendar } from '../../api/calendars';
import { getPrimaryKey } from '../../keys';
import { generateCalendarKeyPayload, getKeysMemberMap } from '../../keys/calendarKeys';
import { getMemberAddressWithAdminPermissions } from '../getMemberWithAdmin';

interface SetupCalendarKeysArgumentsShared {
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    addresses: Address[];
}

interface SetupCalendarKeyArguments extends SetupCalendarKeysArgumentsShared {
    calendarID: string;
}

interface SetupCalendarKeysArguments extends SetupCalendarKeysArgumentsShared {
    calendars: Calendar[];
}

export const setupCalendarKey = async ({ calendarID, api, addresses, getAddressKeys }: SetupCalendarKeyArguments) => {
    const { Members = [] } = await api<{ Members: Member[] }>(queryMembers(calendarID));

    const { Member: selfMember, Address: selfAddress } = getMemberAddressWithAdminPermissions(Members, addresses);
    const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
        getPrimaryKey(await getAddressKeys(selfAddress.ID)) || {};

    if (!primaryAddressKey || !primaryAddressPublicKey) {
        throw new Error(c('Error').t`Primary address key is not decrypted`);
    }

    const calendarKeyPayload = await generateCalendarKeyPayload({
        addressID: selfAddress.ID,
        privateKey: primaryAddressKey,
        memberPublicKeys: getKeysMemberMap(Members, {
            [selfMember.Email]: primaryAddressPublicKey,
        }),
    });

    return api(setupCalendar(calendarID, calendarKeyPayload));
};

export const setupCalendarKeys = async ({ api, calendars, getAddressKeys, addresses }: SetupCalendarKeysArguments) => {
    return Promise.all(
        calendars.map(async ({ ID: calendarID }) => {
            return setupCalendarKey({ calendarID, api, getAddressKeys, addresses });
        })
    );
};

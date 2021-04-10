import { Address, Api } from 'proton-shared/lib/interfaces';
import { Calendar, Member } from 'proton-shared/lib/interfaces/calendar';
import { useGetAddressKeys } from 'react-components';
import { getCalendarGroupReset, queryMembers, resetCalendarGroup } from 'proton-shared/lib/api/calendars';
import { getPrimaryKey } from 'proton-shared/lib/keys';
import { c } from 'ttag';
import { generateCalendarKeyPayload } from 'proton-shared/lib/keys/calendarKeys';
import { getKeys } from 'pmcrypto';
import { getMemberAddressWithAdminPermissions } from 'proton-shared/lib/calendar/getMemberWithAdmin';

interface ResetCalendarKeysArguments {
    api: Api;
    calendars: Calendar[];
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    addresses: Address[];
}

interface ResetCalendar extends Calendar {
    Members: { [memberID: string]: string };
}

export const resetCalendarKeys = async ({ api, calendars, getAddressKeys, addresses }: ResetCalendarKeysArguments) => {
    const { Calendars: ResetCalendars = [] } = await api<{ Calendars: ResetCalendar[] }>(getCalendarGroupReset());

    /*
    if (
        !shallowEqual(
            ResetCalendars.map(({ ID }) => ID).sort(),
            calendars.map(({ ID }) => ID).sort()
        )
    ) {
        throw new Error('Calendars to reset do not match');
    }
    */

    const calendarsResult = await Promise.all(
        ResetCalendars.map(async ({ ID: calendarID }) => {
            const { Members = [] } = await api<{ Members: Member[] }>(queryMembers(calendarID));
            const { Member: selfMember, Address: selfAddress } = getMemberAddressWithAdminPermissions(
                Members,
                addresses
            );
            const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
                getPrimaryKey(await getAddressKeys(selfAddress.ID)) || {};

            if (!primaryAddressKey) {
                throw new Error(c('Error').t`Primary address key is not decrypted`);
            }

            const resetCalendar = ResetCalendars.find(({ ID }) => ID === calendarID);

            if (!resetCalendar) {
                throw new Error('Reset calendar not found');
            }
            const { Members: MemberPublicKeys } = resetCalendar;

            const memberPublicKeyIDs = Object.keys(MemberPublicKeys);
            const parsedMemberPublicKeys = await Promise.all(
                memberPublicKeyIDs.map((memberID) => getKeys(MemberPublicKeys[memberID]).then(([key]) => key))
            );
            const memberPublicKeys = parsedMemberPublicKeys.reduce((acc, publicKey, i) => {
                return {
                    ...acc,
                    [memberPublicKeyIDs[i]]: publicKey,
                };
            }, {});

            return generateCalendarKeyPayload({
                addressID: selfAddress.ID,
                privateKey: primaryAddressKey,
                memberPublicKeys: {
                    ...memberPublicKeys,
                    [selfMember.ID]: primaryAddressPublicKey,
                },
            });
        })
    );

    const resetPayload = calendars.reduce((acc, { ID: calendarID }, i) => {
        return {
            ...acc,
            [calendarID]: calendarsResult[i],
        };
    }, {});

    return api(
        resetCalendarGroup({
            CalendarKeys: resetPayload,
        })
    );
};

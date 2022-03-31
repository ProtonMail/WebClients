import { c } from 'ttag';
import { CryptoProxy } from '@proton/crypto';
import { useGetAddressKeys } from '@proton/components';
import { Address, Api } from '../../interfaces';
import { getCalendarGroupReset, queryMembers, resetCalendarGroup } from '../../api/calendars';
import { getPrimaryKey } from '../../keys';
import { generateCalendarKeyPayload } from '../../keys/calendarKeys';
import { getMemberAddressWithAdminPermissions } from '../getMemberWithAdmin';
import { Calendar, CalendarMember } from '../../interfaces/calendar';

interface ResetCalendarKeysArguments {
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    addresses: Address[];
}

interface ResetCalendar extends Calendar {
    Members: { [memberID: string]: string };
}

export const resetCalendarKeys = async ({ api, getAddressKeys, addresses }: ResetCalendarKeysArguments) => {
    // We're re-fetching the list of reset calendars because through the getCalendarGroupReset route
    // we get extra info that will be useful for shared calendars
    const { Calendars: ResetCalendars = [] } = await api<{ Calendars: ResetCalendar[] }>(getCalendarGroupReset());

    const calendarsResult = await Promise.all(
        ResetCalendars.map(async ({ ID: calendarID }) => {
            const { Members = [] } = await api<{ Members: CalendarMember[] }>(queryMembers(calendarID));
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
                memberPublicKeyIDs.map((memberID) =>
                    CryptoProxy.importPublicKey({ armoredKey: MemberPublicKeys[memberID] })
                )
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

    const resetPayload = ResetCalendars.reduce((acc, { ID: calendarID }, i) => {
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

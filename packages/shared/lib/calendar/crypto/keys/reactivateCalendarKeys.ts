import type { useGetAddressKeys } from '@proton/account/addressKeys/hooks';
import { CryptoProxy } from '@proton/crypto';

import { getAllCalendarKeys, getPassphrases, queryMembers, reactivateCalendarKey } from '../../../api/calendars';
import type { Address, Api } from '../../../interfaces';
import type {
    Calendar,
    CalendarKey,
    CalendarMember,
    Passphrase,
    ReenableKeyResponse,
} from '../../../interfaces/calendar';
import { splitKeys } from '../../../keys';
import { getMemberAddressWithAdminPermissions } from '../../getMemberWithAdmin';
import { decryptPassphrase } from './calendarKeys';

interface ReactivateCalendarsKeysArgumentsShared {
    api: Api;
    getAddressKeys: ReturnType<typeof useGetAddressKeys>;
    addresses: Address[];
}

interface ReactivateCalendarsKeysArguments extends ReactivateCalendarsKeysArgumentsShared {
    calendars: Calendar[];
}

interface ReactivateCalendarKeysArguments extends ReactivateCalendarsKeysArgumentsShared {
    ID: string;
}

const reactivateCalendarKeys = async ({
    api,
    ID: CalendarID,
    getAddressKeys,
    addresses,
}: ReactivateCalendarKeysArguments) => {
    const [{ Keys = [] }, { Passphrases = [] }, { Members = [] }] = await Promise.all([
        api<{ Keys: CalendarKey[] }>(getAllCalendarKeys(CalendarID)),
        api<{ Passphrases: Passphrase[] }>(getPassphrases(CalendarID)),
        api<{ Members: CalendarMember[] }>(queryMembers(CalendarID)),
    ]);

    const { Member: selfMember, Address: selfAddress } = getMemberAddressWithAdminPermissions(Members, addresses);
    const addressKeys = await getAddressKeys(selfAddress.ID);
    const { privateKeys, publicKeys } = splitKeys(addressKeys);

    const decryptedPrimaryPassphrase = await (() => {
        const targetPassphrase = Passphrases.find(({ Flags }) => Flags === 1);
        if (!targetPassphrase) {
            throw new Error('Passphrase not found');
        }
        const { MemberPassphrases = [] } = targetPassphrase;
        const memberPassphrase = MemberPassphrases.find(({ MemberID }) => MemberID === selfMember.ID);
        if (!memberPassphrase) {
            throw new Error('Member passphrase not found');
        }
        const { Passphrase, Signature } = memberPassphrase;
        return decryptPassphrase({
            armoredPassphrase: Passphrase,
            armoredSignature: Signature,
            privateKeys,
            publicKeys,
        });
    })();

    return Promise.all(
        Keys.filter(({ Flags }) => Flags === 0).map(async ({ PassphraseID, PrivateKey, ID: KeyID }) => {
            try {
                const targetPassphrase = Passphrases.find(
                    ({ ID: otherPassphraseID }) => otherPassphraseID === PassphraseID
                );
                if (!targetPassphrase) {
                    throw new Error('Passphrase not found');
                }
                const { MemberPassphrases = [] } = targetPassphrase;
                const memberPassphrase = MemberPassphrases.find(({ MemberID }) => MemberID === selfMember.ID);
                if (!memberPassphrase) {
                    throw new Error('Member passphrase not found');
                }
                const { Passphrase, Signature } = memberPassphrase;
                const decryptedPassphrase = await decryptPassphrase({
                    armoredPassphrase: Passphrase,
                    armoredSignature: Signature,
                    privateKeys,
                    publicKeys,
                });
                const privateKey = await CryptoProxy.importPrivateKey({
                    armoredKey: PrivateKey,
                    passphrase: decryptedPassphrase,
                });
                const armoredEncryptedKey = await CryptoProxy.exportPrivateKey({
                    privateKey: privateKey,
                    passphrase: decryptedPrimaryPassphrase,
                });
                return await api<ReenableKeyResponse>(
                    reactivateCalendarKey(CalendarID, KeyID, { PrivateKey: armoredEncryptedKey })
                );
            } catch (e: any) {
                console.error(e);
            }
        })
    );
};

export const reactivateCalendarsKeys = async ({
    api,
    calendars,
    getAddressKeys,
    addresses,
}: ReactivateCalendarsKeysArguments) => {
    return Promise.all(
        calendars.map(async (calendar) => {
            return reactivateCalendarKeys({
                api,
                ID: calendar.ID,
                getAddressKeys,
                addresses,
            });
        })
    );
};

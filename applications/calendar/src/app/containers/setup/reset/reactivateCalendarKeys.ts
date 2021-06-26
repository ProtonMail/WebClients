import { Address, Api } from '@proton/shared/lib/interfaces';
import { useGetAddressKeys } from '@proton/components';
import {
    getAllCalendarKeys,
    getPassphrases,
    queryMembers,
    reactivateCalendarKey,
} from '@proton/shared/lib/api/calendars';
import { splitKeys } from '@proton/shared/lib/keys/keys';
import { decryptPassphrase } from '@proton/shared/lib/keys/calendarKeys';
import { Calendar, CalendarKey, Member, Passphrase } from '@proton/shared/lib/interfaces/calendar';
import { decryptPrivateKey, encryptPrivateKey } from 'pmcrypto';
import { getMemberAddressWithAdminPermissions } from '@proton/shared/lib/calendar/getMemberWithAdmin';

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
        api<{ Members: Member[] }>(queryMembers(CalendarID)),
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
                const privateKey = await decryptPrivateKey(PrivateKey, decryptedPassphrase);
                const armoredEncryptedKey = await encryptPrivateKey(privateKey, decryptedPrimaryPassphrase);
                await api(reactivateCalendarKey(CalendarID, KeyID, { PrivateKey: armoredEncryptedKey }));
            } catch (e) {
                console.log(e);
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
        calendars.map(({ ID }) => {
            return reactivateCalendarKeys({
                api,
                ID,
                getAddressKeys,
                addresses,
            });
        })
    );
};

import { getPrimaryKey, splitKeys } from 'proton-shared/lib/keys/keys';
import { c } from 'ttag';
import { encryptPrivateKey, getKeys } from 'pmcrypto';
import {
    getCalendarGroupReset,
    resetCalendarGroup,
    queryMembers,
    setupCalendar,
    reactivateCalendarKey,
    getAllCalendarKeys,
    getPassphrases
} from 'proton-shared/lib/api/calendars';
import { decryptPassphrase, generateCalendarKeyPayload, getKeysMemberMap } from 'proton-shared/lib/keys/calendarKeys';
import { findMemberAddressWithAdminPermissions } from 'proton-shared/lib/calendar/member';
import { getActiveAddresses } from 'proton-shared/lib/helpers/address';

export const setupCalendarKeys = async ({ api, calendars, addressID, addressEmail, privateKey, publicKey }) => {
    return Promise.all(
        calendars.map(async ({ ID: calendarID }) => {
            const { Members = [] } = await api(queryMembers(calendarID));

            const calendarKeyPayload = await generateCalendarKeyPayload({
                addressID,
                privateKey,
                memberPublicKeys: getKeysMemberMap(Members, {
                    [addressEmail]: publicKey
                })
            });

            return api(setupCalendar(calendarID, calendarKeyPayload));
        })
    );
};

const reactivateCalendarKeys = async ({ api, ID: CalendarID, getAddressKeys, addresses }) => {
    const [{ Keys = [] }, { Passphrases = [] }, { Members = [] }] = await Promise.all([
        api(getAllCalendarKeys(CalendarID)),
        api(getPassphrases(CalendarID)),
        api(queryMembers(CalendarID))
    ]);

    const { Member: selfMember, Address: selfAddress } = findMemberAddressWithAdminPermissions(Members, addresses);
    const addressKeys = await getAddressKeys(selfAddress.ID);
    const { privateKeys, publicKeys } = splitKeys(addressKeys);

    const decryptedPrimaryPassphrase = await (() => {
        const { MemberPassphrases = [] } = Passphrases.find(({ Flags }) => Flags === 1);
        const { Passphrase, Signature } = MemberPassphrases.find(({ MemberID }) => MemberID === selfMember.ID);
        return decryptPassphrase({
            armoredPassphrase: Passphrase,
            armoredSignature: Signature,
            privateKeys,
            publicKeys
        });
    })();

    return Promise.all(
        Keys.filter(({ Flags }) => Flags === 0).map(async ({ PassphraseID, PrivateKey, ID: KeyID }) => {
            try {
                const { MemberPassphrases = [] } = Passphrases.find(
                    ({ ID: otherPassphraseID }) => otherPassphraseID === PassphraseID
                );
                const { Passphrase, Signature } = MemberPassphrases.find(({ MemberID }) => MemberID === selfMember.ID);
                const decryptedPassphrase = await decryptPassphrase({
                    armoredPassphrase: Passphrase,
                    armoredSignature: Signature,
                    privateKeys,
                    publicKeys
                });
                const [privateKey] = await getKeys(PrivateKey);
                await privateKey.decrypt(decryptedPassphrase);
                const armoredEncryptedKey = await encryptPrivateKey(privateKey, decryptedPrimaryPassphrase);
                await api(reactivateCalendarKey(CalendarID, KeyID, { PrivateKey: armoredEncryptedKey }));
            } catch (e) {
                console.log(e);
            }
        })
    );
};

const reactivateCalendarsKeys = async ({ api, calendars, getAddressKeys, addresses }) => {
    return Promise.all(
        calendars.map(({ ID }) => {
            return reactivateCalendarKeys({
                api,
                ID,
                getAddressKeys,
                addresses
            });
        })
    );
};

const resetCalendarKeys = async ({ api, calendars, getAddressKeys, addresses }) => {
    const { Calendars: ResetCalendars = [] } = await api(getCalendarGroupReset());

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
            const { Members = [] } = await api(queryMembers(calendarID));
            const { Member: selfMember, Address: selfAddress } = findMemberAddressWithAdminPermissions(
                Members,
                addresses
            );
            const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
                getPrimaryKey(await getAddressKeys(selfAddress.ID)) || {};
            const { Members: MemberPublicKeys } = ResetCalendars.find(({ ID }) => ID === calendarID);

            const memberPublicKeyIDs = Object.keys(MemberPublicKeys);
            const parsedMemberPublicKeys = await Promise.all(
                memberPublicKeyIDs.map((memberID) => getKeys(MemberPublicKeys[memberID]).then(([key]) => key))
            );
            const memberPublicKeys = parsedMemberPublicKeys.reduce((acc, publicKey, i) => {
                return {
                    ...acc,
                    [memberPublicKeyIDs[i]]: publicKey
                };
            }, {});

            return generateCalendarKeyPayload({
                addressID: selfAddress.ID,
                privateKey: primaryAddressKey,
                memberPublicKeys: {
                    ...memberPublicKeys,
                    [selfMember.ID]: primaryAddressPublicKey
                }
            });
        })
    );

    const resetPayload = calendars.reduce((acc, { ID: calendarID }, i) => {
        return {
            ...acc,
            [calendarID]: calendarsResult[i]
        };
    }, {});

    return api(
        resetCalendarGroup({
            CalendarKeys: resetPayload
        })
    );
};

export const process = async ({
    api,
    call,
    getAddresses,
    getAddressKeys,
    calendarsToReset,
    calendarsToReactivate,
    calendarsToSetup
}) => {
    const addresses = await getAddresses();
    if (!addresses.length) {
        throw new Error(c('Error').t`Please create an address first.`);
    }

    if (calendarsToSetup.length > 0) {
        const [{ ID: primaryAddressID, Email: primaryAddressEmail = '' } = {}] = getActiveAddresses(addresses);
        const { privateKey: primaryAddressKey, publicKey: primaryAddressPublicKey } =
            getPrimaryKey(await getAddressKeys(primaryAddressID)) || {};

        if (!primaryAddressKey || !primaryAddressKey.isDecrypted()) {
            throw new Error(c('Error').t`Primary address key is not decrypted.`);
        }

        await setupCalendarKeys({
            api,
            calendars: calendarsToSetup,
            privateKey: primaryAddressKey,
            publicKey: primaryAddressPublicKey,
            addressEmail: primaryAddressEmail,
            addressID: primaryAddressID
        });
    }

    if (calendarsToReset.length > 0) {
        await resetCalendarKeys({
            api,
            calendars: calendarsToReset,
            getAddressKeys,
            addresses
        });
    }

    if (calendarsToReactivate.length > 0) {
        await reactivateCalendarsKeys({
            api,
            calendars: calendarsToReactivate,
            getAddressKeys,
            addresses
        });
    }

    await call();
};

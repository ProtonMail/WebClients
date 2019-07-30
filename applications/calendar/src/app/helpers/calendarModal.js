import { ENCRYPTION_TYPES, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { getPrimaryKey } from 'proton-shared/lib/keys/keys';
import { setupCalendar, queryMembers } from 'proton-shared/lib/api/calendars';
import { normalize } from 'proton-shared/lib/helpers/string';

import { generatePassphrase, generateCalendarKey, encryptPassphrase } from './calendarKeys';

/**
 * Setup calendar key
 * @param {String} email
 * @param {Object} privateKey
 * @param {String} addressID
 * @param {Object} memberPublicKeys
 * @returns {Object} data to send to the API
 */
export const setupKey = async ({ email, privateKey, addressID: AddressID, memberPublicKeys = {} }) => {
    const passphrase = generatePassphrase();
    const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519];
    const [
        { privateKeyArmored: PrivateKey },
        { dataPacket: DataPacket, keyPackets: KeyPackets, signature: Signature }
    ] = await Promise.all([
        generateCalendarKey({ passphrase, email, encryptionConfig }),
        encryptPassphrase({ passphrase, privateKey, memberPublicKeys })
    ]);

    return {
        AddressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
            KeyPackets
        }
    };
};

export const setupCalendarKey = async ({ api, addressID, addressKeys, calendarID, email }) => {
    const { Members = [] } = await api(queryMembers(calendarID));
    const { ID: memberID } = Members.find(({ Email }) => normalize(Email) === normalize(email));
    const { privateKey } = getPrimaryKey(addressKeys) || {};
    const memberPublicKeys = { [memberID]: privateKey.toPublic() };
    const data = await setupKey({ memberPublicKeys, email, addressID, privateKey });
    await api(setupCalendar(calendarID, data));
};

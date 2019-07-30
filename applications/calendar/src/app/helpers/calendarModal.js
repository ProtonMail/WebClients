import { ENCRYPTION_TYPES, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';

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

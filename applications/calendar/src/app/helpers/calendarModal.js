import { ENCRYPTION_TYPES, ENCRYPTION_CONFIGS } from 'proton-shared/lib/constants';
import { getPrimaryKey } from 'proton-shared/lib/keys/keys';
import { setupCalendar, queryMembers } from 'proton-shared/lib/api/calendars';
import { normalize } from 'proton-shared/lib/helpers/string';
import { generatePassphrase, generateCalendarKey, encryptPassphrase } from 'proton-shared/lib/keys/calendarKeys';

export const setupCalendarKey = async ({ api, addressID, addressKeys, calendarID, email }) => {
    const { Members = [] } = await api(queryMembers(calendarID));

    const { ID: memberID } = Members.find(({ Email }) => normalize(Email) === normalize(email));
    const { privateKey } = getPrimaryKey(addressKeys) || {};
    // BETA: Just one member for beta.
    const memberPublicKeys = { [memberID]: privateKey.toPublic() };

    const passphrase = generatePassphrase();
    const encryptionConfig = ENCRYPTION_CONFIGS[ENCRYPTION_TYPES.X25519];
    const [
        { privateKeyArmored: PrivateKey },
        { dataPacket: DataPacket, keyPackets: KeyPackets, signature: Signature }
    ] = await Promise.all([
        generateCalendarKey({ passphrase, encryptionConfig }),
        encryptPassphrase({ passphrase, privateKey, memberPublicKeys })
    ]);

    const data = {
        AddressID: addressID,
        Signature,
        PrivateKey,
        Passphrase: {
            DataPacket,
            KeyPackets
        }
    };

    await api(setupCalendar(calendarID, data));
};

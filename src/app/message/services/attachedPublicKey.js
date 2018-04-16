import _ from 'lodash';
import { CONSTANTS, VERIFICATION_STATUS, EMAIL_FORMATING } from '../../constants';
import { toList } from '../../../helpers/arrayHelper';
import { getGroup } from '../../../helpers/vcard';

/* @ngInject */
function attachedPublicKey(
    contactDetailsModel,
    keyCache,
    authentication,
    autoPinPrimaryKeys,
    pmcw,
    sendPreferences,
    publicKeyStore,
    AttachmentLoader,
    contactEmails,
    Contact,
    networkActivityTracker
) {
    const { OPEN_TAG_AUTOCOMPLETE_RAW, CLOSE_TAG_AUTOCOMPLETE_RAW } = EMAIL_FORMATING;
    const { SIGNED_AND_INVALID } = VERIFICATION_STATUS;
    const MAX_KEY_SIZE = 50 * 1024;
    const MAX_KEY_COUNTS = 5;
    const normalizeEmail = (email) => email.toLowerCase();
    const asDataUri = (publicKey) => {
        const data = pmcw.stripArmor(publicKey);
        return 'data:application/pgp-keys;base64,' + pmcw.encode_base64(pmcw.arrayToBinaryString(data));
    };

    /**
     * Extact and clean the new email
     * Format:
     *     - XXXX <xxx@xxxx.xxx>
     *     - xxx@xxxx.xxx
     * @param  {String} target
     * @return {Object}        { name: String, adr:String }
     */
    const extractAddress = (email) => {
        const [name = '', adr = ''] = email.replace(CLOSE_TAG_AUTOCOMPLETE_RAW, '').split(OPEN_TAG_AUTOCOMPLETE_RAW);
        return { name: name.trim(), adr: adr.trim() };
    };

    const populateAddresses = (keyInfo, addresses, isInternal) => {
        const sendInfo = sendPreferences.get(_.map(addresses, 'adr'));
        const trustedKeys = publicKeyStore.get(_.map(addresses, 'adr'));

        return Promise.all([sendInfo, trustedKeys]).then(([sendPref, publicKeys]) =>
            addresses
                .filter(({ adr }) => publicKeys[adr].every((key) => key.primaryKey.fingerprint !== keyInfo.fingerprint))
                .map((address) => {
                    if (keyInfo.expires !== null && keyInfo.expires < Date.now()) {
                        return _.extend({}, address, { encrypt: false, expired: true });
                    }
                    if (isInternal) {
                        return _.extend({}, address, { encrypt: false });
                    }
                    if (sendPref[address.adr].publickeys.length === 0) {
                        return _.extend({}, address, { encrypt: true });
                    }
                    if (sendPref[address.adr].publickeys[0].primaryKey.created > keyInfo.created) {
                        return _.extend({}, address, { encrypt: false });
                    }
                    return _.extend({}, address, { encrypt: sendPref[address.adr].encrypt });
                })
        );
    };

    const extractAddresses = (message, keyInfo) => {
        const userids = keyInfo.userIds.map(extractAddress);
        if (!userids.length) {
            return [];
        }
        return populateAddresses(keyInfo, userids, message.IsEncrypted === CONSTANTS.SEND_TYPES.SEND_PM);
    };

    const getPublicKeyFromSig = async (message) => {
        const privateKeys = authentication.getPrivateKeys(message.AddressID);

        const { [message.SenderAddress]: { Keys: keys } } = await keyCache.get([message.SenderAddress]);
        const publicKeys = _.flatten(_.map(keys, 'PublicKey').map(pmcw.getKeys));
        const { signatures: [signature = false] } = await pmcw.decryptMessageLegacy({
            message: message.Body,
            privateKeys,
            date: new Date(message.Time * 1000),
            publicKeys
        });

        if (!signature) {
            return false;
        }

        const packetKeyId = signature.packets[0].issuerKeyId.bytes;
        const publicKey = publicKeys.find(({ primaryKey: { keyid: { bytes } } }) => bytes === packetKeyId);
        return publicKey.armor();
    };

    const extractPublicKeysFromAutocrypt = (message) => {
        if (!_.has(message.ParsedHeaders, 'Autocrypt')) {
            return [];
        }
        const autocrypt = toList(message.ParsedHeaders.Autocrypt);
        return _.filter(
            autocrypt.map((header) => {
                const match = header.match(
                    /^(\s*(_[^;\s]*|addr|prefer-encrypt)\s*=\s*[^;\s]*\s*;)*\s*keydata\s*=([^;]*)$/
                );
                if (!match) {
                    return null;
                }
                const preferEncryptMutual = header.match(
                    /^(\s*(_[^;\s]*|addr)\s*=\s*[^;\s]*\s*;)*\s*prefer-encrypt\s*=\s*mutual\s*;/
                );
                if (!preferEncryptMutual) {
                    return null;
                }
                const keydata = header.match(/^(?:\s*(?:[^;\s]*)\s*=\s*[^;\s]*\s*;)*\s*keydata\s*=([^;]*)$/);
                try {
                    return pmcw.binaryStringToArray(pmcw.decode_base64(keydata[1]));
                } catch (e) {
                    // not encoded correctly
                    return null;
                }
            })
        );
    };

    const keySignsMessage = (message, keyInfos) => {
        const privateKeys = authentication.getPrivateKeys(message.AddressID);
        return pmcw
            .decryptMessageLegacy({
                message: message.Body,
                privateKeys,
                date: new Date(message.Time * 1000)
            })
            .then(({ signatures }) => {
                const signaturePackets = _.flatten(
                    signatures.map(({ packets }) => Object.values(packets).filter((a) => typeof a === 'object'))
                );
                const signingKeyIds = signaturePackets.map(({ issuerKeyId: { bytes } }) => bytes);
                return keyInfos.filter(({ publicKeyArmored }) => {
                    const keyList = pmcw.getKeys(publicKeyArmored);
                    const keyIds = _.flatten(keyList.map((key) => key.getKeyIds().map(({ bytes }) => bytes)));
                    return _.intersection(keyIds, signingKeyIds).length !== 0;
                });
            })
            .catch(() => {
                return [];
            });
    };

    const getMatchingKeyInfo = async (keyInfos, message) => {
        const uniqKeyInfos = _.uniqBy(keyInfos, 'publicKeyArmored');
        if (uniqKeyInfos.length === 1) {
            return uniqKeyInfos[0];
        }
        // only return keys that match with the current message;
        const senderKeyInfos = uniqKeyInfos.filter(({ userIds }) =>
            userIds.some((id) => id.search(`<${message.Sender.Address}>`) !== -1)
        );
        if (senderKeyInfos.length === 1) {
            return senderKeyInfos[0];
        }
        if (senderKeyInfos.length === 0) {
            return false;
        }

        const matchingKeyInfos = await keySignsMessage(message, senderKeyInfos);
        if (matchingKeyInfos.length === 1) {
            return matchingKeyInfos[0];
        }
        return false;
    };

    const extractFromEmail = async (message) => {
        if (message.IsEncrypted === CONSTANTS.SEND_TYPES.SEND_PM) {
            return message.Verified === SIGNED_AND_INVALID ? getPublicKeyFromSig(message) : false;
        }

        const candidates = message.Attachments.filter(
            ({ Name, Size }) => Name.toLowerCase().substring(Name.length - 4) === '.asc' && Size < MAX_KEY_SIZE
        );

        if (candidates.length > MAX_KEY_COUNTS) {
            return false;
        }

        const isKey = (key) =>
            pmcw.keyInfo(key).catch(() => {
                return false;
            });

        const buffers = await Promise.all(candidates.map((c) => AttachmentLoader.get(c, message)));
        const armoredFiles = buffers.map(pmcw.arrayToBinaryString);
        const keyInfo = _.filter(await Promise.all(armoredFiles.map(isKey)));

        if (keyInfo.length === 0) {
            // try to get them from the autocrypt headers
            const autocryptdata = extractPublicKeysFromAutocrypt(message);
            keyInfo.push(..._.filter(await Promise.all(autocryptdata.map(isKey))));
        }

        const keyInfoObject = await getMatchingKeyInfo(keyInfo, message);

        if (!keyInfoObject) {
            return false;
        }
        const addresses = await extractAddresses(message, keyInfoObject);

        const { publicKeyArmored } = keyInfoObject;

        return addresses.length ? publicKeyArmored : false;
    };

    const createContactWithKey = (publicKey, address) => {
        const group = 'item1';
        /* eslint new-cap: "off" */
        const card = new vCard();
        card.set('fn', address.name || address.adr);
        card.set('email', address.adr, { group });
        card.set('key', asDataUri(publicKey), { group });
        if (address.encrypt) {
            card.set('x-pm-encrypt', 'true', { group });
            card.set('x-pm-sign', 'true', { group });
        }

        return Contact.add([{ vCard: card }]);
    };

    const attachPublicKeyToAddress = async (publicKey, address) => {
        const normalizedEmail = normalizeEmail(address.adr);

        const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);

        if (!contactEmail) {
            return createContactWithKey(publicKey, address);
        }

        const contact = await Contact.get(contactEmail.ContactID);
        const emailList = toList(contact.vCard.get('email'));
        const group = getGroup(emailList, normalizedEmail);

        const keyList = toList(contact.vCard.data.key || []);
        if (address.encrypt) {
            contact.vCard.set('x-pm-encrypt', 'true', { group });
            contact.vCard.set('x-pm-sign', 'true', { group });
        }

        _.reduce(
            keyList,
            (count, keyProperty) => {
                keyProperty.pref = count;
                return count + 1;
            },
            2
        );

        contact.vCard.add('key', contactDetailsModel.escapeValue(asDataUri(publicKey)), {
            group,
            pref: address.encrypt ? 1 : keyList.length + 1
        });

        return Contact.updateUnencrypted(contact);
    };

    const attachPublicKeyToAddresses = (publicKey, addresses) => {
        const promise = Promise.all(addresses.map((address) => attachPublicKeyToAddress(publicKey, address))).then(
            () => true
        );
        networkActivityTracker.track(promise);
        return promise;
    };

    const getTransList = (addresses) => {
        const promise = sendPreferences.get(_.map(addresses, 'adr'));
        networkActivityTracker.track(promise);
        return promise;
    };

    const attachPublicKey = async (publicKey, addresses) => {
        const transList = await getTransList(addresses);
        if (_.every(_.map(transList, 'isVerified'))) {
            return attachPublicKeyToAddresses(publicKey, addresses);
        }

        const pairs = _.toPairs(transList);
        const invalidSigs = pairs.filter(([, { isVerified }]) => !isVerified);
        const resigned = await autoPinPrimaryKeys.resign(invalidSigs.map(([adr]) => adr));

        if (!resigned) {
            return false;
        }
        return attachPublicKeyToAddresses(publicKey, addresses);
    };
    return {
        extractAddresses,
        extractFromEmail,
        attachPublicKey
    };
}
export default attachedPublicKey;

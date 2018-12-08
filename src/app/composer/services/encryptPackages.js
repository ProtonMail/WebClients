import _ from 'lodash';
import { SEND_TYPES, AES256 } from '../../constants';

/* @ngInject */
function encryptPackages(pmcw, keysModel, AttachmentLoader) {
    const arrayToBase64 = _.flowRight(
        pmcw.encode_base64,
        pmcw.arrayToBinaryString
    );
    const packToBase64 = ({ data, algorithm: Algorithm = AES256 }) => {
        return { Key: arrayToBase64(data), Algorithm };
    };
    const encryptKeyPacket = ({ sessionKeys = [], publicKeys = [], passwords = [] }) => {
        const promises = _.map(sessionKeys, (sessionKey) =>
            pmcw
                .encryptSessionKey({
                    data: sessionKey.data,
                    algorithm: sessionKey.algorithm,
                    publicKeys: publicKeys.length > 0 ? publicKeys : undefined,
                    passwords
                })
                .then(({ message }) => {
                    return message.packets.write();
                })
                .then(arrayToBase64)
        );
        return Promise.all(promises);
    };

    /**
     * Encrypt the attachment session keys and add them to the package
     * @param pack
     * @param message
     * @param attachmentKeys
     * @returns {*}
     */
    const encryptAttachmentKeys = (pack, message, attachmentKeys) => {
        // multipart/mixed bodies already include the attachments so we don't add them here
        if (pack.MIMEType !== 'multipart/mixed') {
            const promises = _.map(pack.Addresses, (address) => {
                if (!(address.Type & SEND_TYPES.SEND_EO || address.PublicKey)) {
                    return Promise.resolve();
                }

                address.AttachmentKeyPackets = [];

                return encryptKeyPacket({
                    sessionKeys: _.map(attachmentKeys, ({ sessionKey }) => sessionKey),
                    passwords: address.Type & SEND_TYPES.SEND_EO ? [message.Password] : undefined,
                    publicKeys: address.Type & SEND_TYPES.SEND_EO ? undefined : [address.PublicKey]
                })
                    .then((keys) =>
                        _.zipObject(_.map(attachmentKeys, ({ AttachmentID, ID }) => AttachmentID || ID), keys)
                    )
                    .then((AttachmentKeyPackets) => {
                        address.AttachmentKeyPackets = AttachmentKeyPackets;
                    });
            });

            if (pack.Type & SEND_TYPES.SEND_CLEAR) {
                pack.AttachmentKeys = _.extend(
                    ..._.map(attachmentKeys, ({ sessionKey = {}, AttachmentID, ID } = {}) => ({
                        [AttachmentID || ID]: packToBase64(sessionKey)
                    }))
                );
            }

            return Promise.all(promises);
        }
        return Promise.resolve();
    };

    /**
     * Generate random session key in the format openpgp creates them
     * @returns {{algorithm: string, data: (*|Uint8Array)}}
     */
    const generateSessionKey = async () => {
        return {
            algorithm: AES256,
            data: await pmcw.generateSessionKey(AES256)
        };
    };

    /**
     * Encrypt the body in the given package. Should only be used if the package body differs from message body
     * (i.e. the draft body)
     * @param pack
     * @param privateKeys
     * @param publicKeysList
     * @returns {Promise.<{keys: *, encrypted: *, sessionKey: *}>}
     */
    const encryptBodyPackage = async (pack, privateKeys, publicKeysList) => {
        const publicKeys = _.filter(publicKeysList);
        const { data, sessionKey } = await pmcw.encryptMessage({
            data: pack.Body,
            publicKeys,
            sessionKey: publicKeys.length ? undefined : await generateSessionKey(),
            privateKeys,
            returnSessionKey: true,
            compression: true
        });

        const { asymmetric: keys, encrypted } = await pmcw.splitMessage(data);
        return { keys, encrypted, sessionKey };
    };

    /**
     * Encrypts the draft body. This is done separately from the other bodies so we can make sure that the send body
     * (the encrypted body in the message object) is the same as the other emails so we can use 1 blob for them in the api
     * (i.e. deduplication)
     * @param pack
     * @param privateKeys
     * @param publicKeysList
     * @param message
     * @returns {Promise.<{keys, encrypted: *, sessionKey: *}>}
     */
    const encryptDraftBodyPackage = async (pack, privateKeys, publicKeysList, message) => {
        const ownPublicKeys = await pmcw.getKeys(message.From.Keys[0].PublicKey);
        const publicKeys = ownPublicKeys.concat(_.filter(publicKeysList));

        const { data, sessionKey } = await pmcw.encryptMessage({
            data: pack.Body,
            publicKeys,
            privateKeys,
            returnSessionKey: true,
            compression: true
        });

        const packets = await pmcw.splitMessage(data);

        const { asymmetric, encrypted } = packets;

        // rebuild the data without the send keypackets
        packets.asymmetric = packets.asymmetric.slice(0, ownPublicKeys.length);
        // combine message
        const value = _.flowRight(
            pmcw.concatArrays,
            _.flatten,
            _.values
        )(packets);

        message.Body = await pmcw.armorBytes(value);

        return { keys: asymmetric.slice(ownPublicKeys.length), encrypted, sessionKey };
    };

    /**
     * Encrypts the body of the package and then overwrites the body in the package and adds the encrypted session keys
     * to the subpackages. If we send clear message the unencrypted session key is added to the (top-level) package too.
     * @param pack
     * @param privateKeys
     * @param message
     * @returns {Promise.<void>}
     */
    const encryptBody = async (pack, privateKeys, message) => {
        const addressKeys = _.keys(pack.Addresses);
        const publicKeysList = _.map(pack.Addresses, ({ PublicKey }) => PublicKey);
        /*
         * Special case: reuse the encryption packet from the draft, this allows us to do deduplication on the back-end.
         * In fact, this will be the most common case.
         */
        const encryptPack = message.MIMEType === pack.MIMEType ? encryptDraftBodyPackage : encryptBodyPackage;

        const { keys, encrypted, sessionKey } = await encryptPack(pack, privateKeys, publicKeysList, message);

        let counter = 0;
        _.each(publicKeysList, (publicKey, index) => {
            if (!publicKey) {
                return;
            }

            const key = keys[counter++];
            pack.Addresses[addressKeys[index]].BodyKeyPacket = arrayToBase64(key);
        });

        const promises = _.map(pack.Addresses, (subPack) => {
            if (subPack.Type !== SEND_TYPES.SEND_EO) {
                return Promise.resolve();
            }
            return encryptKeyPacket({ sessionKeys: [sessionKey], passwords: [message.Password] }).then(
                ([BodyKeyPacket]) => {
                    subPack.BodyKeyPacket = BodyKeyPacket;
                }
            );
        });

        await Promise.all(promises);

        if (pack.Type & (SEND_TYPES.SEND_CLEAR | SEND_TYPES.SEND_MIME)) {
            pack.BodyKey = packToBase64(sessionKey);
        }
        pack.Body = arrayToBase64(encrypted[0]);
    };

    const encryptPackage = (pack, message, privateKeys, attachmentKeys) => {
        return Promise.all([
            encryptBody(pack, privateKeys, message),
            encryptAttachmentKeys(pack, message, attachmentKeys)
        ])
            .then(() => _.each(pack.Addresses, (address) => delete address.PublicKey))
            .then(() => pack);
    };

    const getAttachmentKeys = (message) => {
        const promises = message.Attachments.map((attachment) => AttachmentLoader.getSessionKey(message, attachment));

        return Promise.all(promises);
    };

    /**
     * Encrypts the packages and removes all temporary values that should not be send to the API
     * @param pack
     * @param message
     * @param privateKeys
     * @param attachmentKeys
     * @returns {Promise.<TResult>}
     */
    const encryptPackages = async (message, packages) => {
        const attachmentKeys = await getAttachmentKeys(message);
        const privateKeys = keysModel.getPrivateKeys(message.From.ID)[0];
        const promises = _.map(packages, (p) => encryptPackage(p, message, [privateKeys], attachmentKeys));

        await Promise.all(promises);
        return _.values(packages);
    };

    return encryptPackages;
}
export default encryptPackages;

import _ from 'lodash';
import { flow, filter, find } from 'lodash/fp';
import { createMessage, getSignature, verifyMessage } from 'pmcrypto';

import { VERIFICATION_STATUS } from '../../constants';

/* @ngInject */
function SignatureVerifier(dispatchers, addressesModel, publicKeyStore) {
    const { NOT_VERIFIED, NOT_SIGNED, SIGNED_AND_INVALID, SIGNED_NO_PUB_KEY, SIGNED_AND_VALID } = VERIFICATION_STATUS;
    const { dispatcher } = dispatchers(['attachmentVerified']);

    const CACHE = {};

    /**
     * Needed to push the verified status from PGP/MIME to the CACHE.
     * @param {string} ID
     * @param {number} verified
     */
    const put = (ID, verified) => (CACHE[ID] = verified);

    /**
     * Converts a protonmail addressID to the actual email address
     * @param addressID
     * @returns {*}
     */
    const addressIDtoEmail = (addressID) => {
        const { Email } = flow(
            filter({ Status: 1, Receive: 1 }),
            find({ ID: addressID })
        )(addressesModel.get());

        return Email;
    };

    /**
     * Retrieves the available public keys to verify attachments from the given message with
     * @param message
     */
    const getPublicKeys = (message) => {
        // The Sender object is empty for drafts
        const email = message.Sender.Address || addressIDtoEmail(message.AddressID);

        return publicKeyStore.get([email], true).then(({ [email]: list }) => list);
    };

    /**
     * Retrieve the verification status from the cache.
     * @param {String} Attachment.ID
     * @returns {*}
     */
    const getVerificationStatus = ({ ID = '' }) => {
        // Instead of || because VERIFICATION_STATUS can be 0.
        return _.has(CACHE, ID) ? CACHE[ID] : NOT_VERIFIED;
    };

    /**
     * Returns the signature status for each of the signatures when after verifying them with the decryptedAttachment
     * @param {Uint8Array} decryptedAttachment
     * @param {Array} signatures
     * @param {Array} publicKeys
     * @returns {Promise.<*[]>}
     */
    const verifyAllSignatures = (decryptedAttachment, signatures, publicKeys) => {
        const attMessage = createMessage(decryptedAttachment);

        const asyncSigVerifiers = signatures.map((signature) => {
            return verifyMessage({
                message: attMessage,
                publicKeys,
                signature
            }).then(({ verified }) => verified);
        });

        return Promise.all(asyncSigVerifiers);
    };

    /**
     * Verify the signature of an attachment given the decrypted attachment and the message it is attached to.
     * Always tries to reverify the signatures, you can check if the attachment was already verified using
     * getVerificationStatus
     * @param {Object} attachment
     * @param {UInt8Array} decryptedAttachment
     * @param {Message} message
     * @param {embeddedSigs} A list of signature packets found by decrypting the attachment (PGP/Inline case)
     * @returns {Promise.<*>}
     */
    const verify = async (attachment, decryptedAttachment, message, embeddedSigs = []) => {
        const { ID, Signature } = attachment;
        const signatures = Signature ? [await getSignature(Signature)] : embeddedSigs;

        // shortcut to prevent unnecessary public key fetching
        if (!signatures.length) {
            put(ID, NOT_SIGNED);
            return CACHE[ID];
        }

        const keyObjects = await getPublicKeys(message);
        const publicKeys = keyObjects.reduce((acc, { key, compromised }) => {
            !compromised && acc.push(key);
            return acc;
        }, []);
        const statusPerSig = await verifyAllSignatures(decryptedAttachment, signatures, publicKeys);
        const pmcryptoVerified = _.reduce(
            statusPerSig,
            (acc, status) => (acc === SIGNED_AND_VALID ? SIGNED_AND_VALID : status),
            NOT_SIGNED
        );
        const verified =
            (!keyObjects || !keyObjects.length) && pmcryptoVerified === SIGNED_AND_INVALID
                ? SIGNED_NO_PUB_KEY
                : pmcryptoVerified;
        put(ID, verified);
        dispatcher.attachmentVerified('verified', { message, attachment, status: verified });
        return verified;
    };

    return { verify, getVerificationStatus, put };
}
export default SignatureVerifier;

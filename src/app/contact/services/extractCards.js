import { decryptMessage, createCleartextMessage, getMessage, getSignature, verifyMessage } from 'pmcrypto';
import vCard from 'vcf';

import { CONTACT_ERROR } from '../../errors';
import { CONTACT_CARD_TYPE, VCARD_VERSION } from '../../constants';

const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = CONTACT_CARD_TYPE;
const {
    TYPE3_CONTACT_VERIFICATION,
    TYPE3_CONTACT_DECRYPTION,
    TYPE2_CONTACT_VERIFICATION,
    TYPE1_CONTACT
} = CONTACT_ERROR;

/* @ngInject */
function extractCards() {
    /**
     * Parse the content of a vCard to decrypt it if we need to
     * and return a standard vCard string output
     * @param  {Array}  options.cards       List of raw cards
     * @param  {Array}  options.privateKeys
     * @param  {Array}  options.publicKeys
     * @return {Promise}                     List of cards but decrypted
     */
    function main({ cards = [], privateKeys = [], publicKeys = [] }) {
        const armor = true;

        const decryptSigned = (toValue) => async ({ Data = '', Signature = '' }) => {
            try {
                const [message, signature] = await Promise.all([getMessage(Data), getSignature(Signature)]);
                const { data, verified } = await decryptMessage({
                    message,
                    privateKeys,
                    publicKeys,
                    armor,
                    signature
                });

                // Compat mode with first implementation of vCard on mobile cf #8137
                const output = data.replace(/TEL;TYPE=:/, 'TEL:');

                if (verified !== 1) {
                    return toValue(output, TYPE3_CONTACT_VERIFICATION);
                }
                return toValue(output);
            } catch (e) {
                return toValue(new vCard().toString(VCARD_VERSION), TYPE3_CONTACT_DECRYPTION);
            }
        };

        const signed = (toValue) => async ({ Data = '', Signature = '' }) => {
            try {
                const signature = await getSignature(Signature);
                const { verified } = await verifyMessage({
                    message: createCleartextMessage(Data),
                    publicKeys,
                    signature
                });

                if (verified !== 1) {
                    return toValue(Data, TYPE2_CONTACT_VERIFICATION);
                }
                return toValue(Data);
            } catch (e) {
                return toValue(new vCard().toString(VCARD_VERSION), TYPE2_CONTACT_VERIFICATION);
            }
        };

        const decrypt = (toValue) => async ({ Data = '' }) => {
            try {
                const message = await getMessage(Data);
                const data = await decryptMessage({ message, privateKeys, armor });
                return toValue(data);
            } catch (e) {
                return toValue(new vCard().toString(VCARD_VERSION), TYPE1_CONTACT);
            }
        };

        const clearText = (toValue) => ({ Data = '' }) => toValue(Data);

        const toValueFactory = (type) => (data, error) => ({ type, data, error });

        const ACTIONS = {
            [ENCRYPTED_AND_SIGNED]: decryptSigned(toValueFactory(ENCRYPTED_AND_SIGNED)),
            [SIGNED]: signed(toValueFactory(SIGNED)),
            [ENCRYPTED]: decrypt(toValueFactory(ENCRYPTED)),
            [CLEAR_TEXT]: clearText(toValueFactory(CLEAR_TEXT))
        };

        const promises = cards.map((card) => {
            return ACTIONS[card.Type](card);
        });
        return Promise.all(promises);
    }

    return main;
}
export default extractCards;

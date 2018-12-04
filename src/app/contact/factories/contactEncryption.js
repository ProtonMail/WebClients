import _ from 'lodash';

import { CONTACT_ERROR } from '../../errors';
import { KEY_MODE, CONTACTS_LIMIT_ENCRYPTION, MAIN_KEY, VCARD_VERSION } from '../../constants';
import { orderByPref } from '../../../helpers/vcard';
import vCardPropertyMaker from '../../../helpers/vCardPropertyMaker';
import { createCancellationToken } from '../../../helpers/promiseHelper';
import { generateUID } from '../../../helpers/string';

const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = KEY_MODE;
const {
    TYPE3_CONTACT_VERIFICATION,
    TYPE3_CONTACT_DECRYPTION,
    TYPE2_CONTACT_VERIFICATION,
    TYPE1_CONTACT
} = CONTACT_ERROR;

/* @ngInject */
function contactEncryption(chunk, gettextCatalog, pmcw, vcard, keysModel, contactKeyAssigner, contactProgressReporter) {
    const getErrors = (data = []) => _.map(data, 'error').filter(Boolean);

    const buildContact = (ID, data = [], cards) => {
        const contact = {
            ID,
            vCard: mergeContactData(data),
            errors: getErrors(data),
            types: cards.map(({ Type }) => Type)
        };
        Object.keys(contact.vCard.data).forEach((key) => {
            if (Array.isArray(contact.vCard.data[key])) {
                contact.vCard.data[key] = orderByPref(contact.vCard.data[key]);
            }
        });
        return contact;
    };

    function mergeContactData(data = []) {
        const vcfString = _.reduce(data, (acc, { data }) => `${acc}${data}\r\n`, '');
        const vcards = vcard.from(vcfString);

        return vcard.merge(vcards);
    }

    const assignKeyToGroup = contactKeyAssigner.reassign;

    async function prepareCards({ data, publicKeys, privateKeys }) {
        const armor = true;
        const detached = true;
        const promises = [];
        await assignKeyToGroup(data);

        const defaultUID = generateUID();

        const { toEncryptAndSign = [], toSign = [], clearText = [] } = vCardPropertyMaker([data], {
            type: 'encryption'
        });

        if (toEncryptAndSign.length > 0) {
            const encSignedFields = toEncryptAndSign.map((prop) => prop.getField());

            if (encSignedFields.indexOf('uid') === -1) {
                toEncryptAndSign.push(new vCard.Property('uid', defaultUID));
            }
            const data = vcard.build(toEncryptAndSign).toString(VCARD_VERSION);

            promises.push(
                pmcw.encryptMessage({ data, publicKeys, privateKeys, armor, detached }).then(({ data, signature }) => ({
                    Type: ENCRYPTED_AND_SIGNED,
                    Data: data,
                    Signature: signature
                }))
            );
        }

        if (toSign.length > 0) {
            const signedFields = toSign.map((prop) => prop.getField());

            if (signedFields.indexOf('uid') === -1) {
                toSign.push(new vCard.Property('uid', defaultUID));
            }

            if (signedFields.indexOf('fn') === -1) {
                let fn = gettextCatalog.getString('Unknown', null, 'Default display name vcard');
                const nameProperty = _.find(toEncryptAndSign, { _field: 'n' });

                if (nameProperty) {
                    fn = nameProperty
                        .valueOf()
                        .split(';')
                        .join(' ');
                } else {
                    const firstEmail = _.find(toSign, { _field: 'email' });

                    if (firstEmail) {
                        fn = firstEmail.valueOf();
                    }
                }

                toSign.push(new vCard.Property('fn', fn));
            }

            const data = vcard.build(toSign).toString(VCARD_VERSION);

            promises.push(
                pmcw.signMessage({ data, privateKeys, armor, detached }).then(({ signature }) => ({
                    Type: SIGNED,
                    Data: data,
                    Signature: signature
                }))
            );
        }

        if (clearText.length > 0) {
            const Data = vcard.build(clearText).toString(VCARD_VERSION);

            promises.push({
                Type: CLEAR_TEXT,
                Data,
                Signature: null
            });
        }

        return Promise.all(promises);
    }

    function extractCards({ cards = [], privateKeys = [], publicKeys = [] }) {
        const armor = true;
        const promises = _.map(cards, ({ Type, Data = '', Signature = '' }) => {
            switch (Type) {
                case ENCRYPTED_AND_SIGNED:
                    return Promise.all([pmcw.getMessage(Data), pmcw.getSignature(Signature)])
                        .then(([message, signature]) =>
                            pmcw.decryptMessage({
                                message,
                                privateKeys,
                                publicKeys,
                                armor,
                                signature
                            })
                        )
                        .then(({ data, verified }) => {
                            if (verified !== 1) {
                                return { error: TYPE3_CONTACT_VERIFICATION, data };
                            }
                            return { data };
                        })
                        .catch(() => {
                            return { error: TYPE3_CONTACT_DECRYPTION, data: new vCard().toString(VCARD_VERSION) };
                        });
                case SIGNED:
                    return pmcw
                        .getSignature(Signature)
                        .then((signature) =>
                            pmcw.verifyMessage({
                                message: pmcw.getCleartextMessage(Data),
                                publicKeys,
                                signature
                            })
                        )
                        .then(({ verified }) => {
                            if (verified !== 1) {
                                return { error: TYPE2_CONTACT_VERIFICATION, data: Data };
                            }
                            return { data: Data };
                        });
                case ENCRYPTED:
                    return pmcw
                        .getMessage(Data)
                        .then((message) => pmcw.decryptMessage({ message, privateKeys, armor }))
                        .catch(() => {
                            return { error: TYPE1_CONTACT, data: new vCard().toString(VCARD_VERSION) };
                        });
                case CLEAR_TEXT:
                    return { data: Data };
            }
        });

        return Promise.all(promises);
    }

    /**
     * Creates a chunkhandler by applying transform to each element in each chunk concurrently and mapping them back into
     * a chunked list.
     * @param {Callback} handler
     * @returns {function(*)}
     */
    const chunkHandler = (handler) => (chunkedContacts) => {
        /**
         * Processes all elements in chunk by calling the hander on them.
         * The result (an array of return values of handler) is concatenated to the list of previous chunked result:
         * creating a chunked list.
         * @param chunk
         * @returns {function(*): Promise<>}
         */
        const processChunk = (chunk) => (previousContacts) => {
            return Promise.all(chunk.map(handler)).then((newContacts) => previousContacts.concat(newContacts));
        };
        /**
         * Call process chunk on each set of chunked contact sequentially
         */
        return chunkedContacts.reduce((promise, chunk) => {
            return promise.then(processChunk(chunk));
        }, Promise.resolve([]));
    };

    /**
     * Transform each contact by applying transform to each of the contacts passed in. This works similar to map,
     * but instead it is optimized to enhance the speed for multiple cores.
     * @param {Array} contacts
     * @param {Callback} transform
     * @param {Integer} progressSpeed
     * @param {Object} cancellationToken
     * @param {Boolean} progressBar
     * @returns {*}
     */
    function transformContactsConcurrent({
        contacts,
        transform,
        progressSpeed = 100,
        cancellationToken = createCancellationToken(),
        progressBar = false
    }) {
        const privateKeys = keysModel.getPrivateKeys(MAIN_KEY);
        const publicKeys = keysModel.getPublicKeys(MAIN_KEY);
        const total = contacts.length;
        const reporter = progressBar ? contactProgressReporter(0, progressSpeed, total) : () => {};

        /**
         * Call the given transform function on one of the contacts that is passed in,
         * trigger the progressBar updates for our modal and check if we cancelled the request in the modal already
         * @param data The contact data
         * @returns {*}
         */
        const handler = (data) => {
            return transform(data, publicKeys, privateKeys).then((data) => {
                cancellationToken.check();
                reporter();

                return data;
            });
        };

        const concurrency = pmcw.getMaxConcurrency();
        const chunkedContacts = chunk(contacts, Math.ceil(CONTACTS_LIMIT_ENCRYPTION / concurrency));

        const doubleChunkedContacts = chunk(chunkedContacts, Math.ceil(chunkedContacts.length / concurrency));
        const handleChunkedContacts = chunkHandler(handler);

        return Promise.all(doubleChunkedContacts.map(handleChunkedContacts)).then((chunks) =>
            chunks.reduce((acc, val) => acc.concat(val), [])
        );
    }

    /**
     * Decrypt the custom datas
     * NOTE It's very important to chain the promises for the encryption to not overcharge pmcw
     * @param {Array} contacts
     * @param {Object} cancellationToken
     * @param {Boolean} progressBar
     * @return {Promise}
     */
    function decrypt(contacts = [], cancellationToken = createCancellationToken(), progressBar = false) {
        const transform = async ({ ID, Cards }, publicKeys, privateKeys) => {
            const data = await extractCards({ cards: Cards, privateKeys, publicKeys });
            return buildContact(ID, data, Cards);
        };
        return transformContactsConcurrent({ contacts, transform, progressSpeed: 100, cancellationToken, progressBar });
    }

    /**
     * Encrypt the custom datas
     * NOTE It's very important to chain the promises for the encryption to not overcharge pmcw
     * @param {Array} contacts
     * @param {Object} cancellationToken
     * @param {Boolean} progressBar
     * @return {Promise}
     */
    function encrypt(contacts = [], cancellationToken = createCancellationToken(), progressBar = false) {
        const transform = async ({ vCard }, [publicKey], [privateKey]) => {
            const Cards = await prepareCards({
                data: vCard,
                publicKeys: [publicKey],
                privateKeys: [privateKey]
            });
            return { Cards };
        };

        return transformContactsConcurrent({
            cancellationToken,
            progressBar,
            contacts,
            transform,
            progressSpeed: 50
        });
    }

    return { decrypt, encrypt };
}
export default contactEncryption;

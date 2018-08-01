import _ from 'lodash';

import { orderByPref, uniqGroups } from '../../../helpers/vcard';
import {
    CONTACT_MODE,
    CONTACTS_LIMIT_ENCRYPTION,
    MAIN_KEY,
    VCARD_VERSION,
    CONTACT_ERROR,
    VCARD_KEY_FIELDS
} from '../../constants';

const CLEAR_FIELDS = ['version', 'prodid', 'x-pm-label', 'x-pm-group'];
const SIGNED_FIELDS = ['version', 'prodid', 'fn', 'uid', 'email'].concat(VCARD_KEY_FIELDS);

// Fields that are forced to be included in the encrypted data
const ENCRYPTED_FIELDS = ['uid'];
const GROUP_FIELDS = ['email'].concat(VCARD_KEY_FIELDS);
const { CLEAR_TEXT, ENCRYPTED_AND_SIGNED, ENCRYPTED, SIGNED } = CONTACT_MODE;
const {
    TYPE3_CONTACT_VERIFICATION,
    TYPE3_CONTACT_DECRYPTION,
    TYPE2_CONTACT_VERIFICATION,
    TYPE1_CONTACT
} = CONTACT_ERROR;

/* @ngInject */
function contactEncryption($injector, $rootScope, chunk, gettextCatalog, pmcw, vcard, contactKeyAssigner) {
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

    /**
     * Generates a contact UID of the form 'proton-web-uuid'
     * @return {String}
     */
    function generateUID() {
        const s4 = () =>
            Math.floor((1 + Math.random()) * 0x10000)
                .toString(16)
                .substring(1);

        return `proton-web-${s4()}${s4()}-${s4()}-${s4()}-${s4()}-${s4()}${s4()}${s4()}`;
    }

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
        let itemCounter = 0;
        const properties = vcard.extractProperties(data);
        const groups = uniqGroups(properties);
        const defaultUID = generateUID();

        function getGroupName() {
            itemCounter++;

            const groupName = `item${itemCounter}`;

            if (groups.includes(groupName)) {
                return getGroupName();
            }

            return groupName;
        }

        const { toEncryptAndSign, toSign, clearText } = _.reduce(
            vcard.extractProperties(data),
            (acc, property) => {
                const key = property.getField();
                const isClear = CLEAR_FIELDS.includes(key);
                const isSigned = SIGNED_FIELDS.includes(key);
                const isEncrypted = ENCRYPTED_FIELDS.includes(key);

                if (GROUP_FIELDS.includes(key) && !property.group) {
                    property.group = getGroupName();
                }

                isClear && acc.clearText.push(property);
                isSigned && acc.toSign.push(property);

                if ((!isClear && !isSigned) || isEncrypted) {
                    acc.toEncryptAndSign.push(property);
                }

                return acc;
            },
            { toEncryptAndSign: [], toSign: [], clearText: [] }
        );

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
            const data = vcard.build(clearText).toString(VCARD_VERSION);

            promises.push(
                Promise.resolve({
                    Type: CLEAR_TEXT,
                    Data: data,
                    Signature: null
                })
            );
        }

        return Promise.all(promises);
    }

    function extractCards({ cards = [], privateKeys = [], publicKeys = [] }) {
        const armor = true;
        const promises = _.map(cards, ({ Type, Data = '', Signature = '' }) => {
            switch (Type) {
                case ENCRYPTED_AND_SIGNED:
                    return pmcw
                        .decryptMessage({
                            message: pmcw.getMessage(Data),
                            privateKeys,
                            publicKeys,
                            armor,
                            signature: pmcw.getSignature(Signature)
                        })
                        .then(({ data, verified }) => {
                            if (verified !== 1) {
                                return { error: TYPE3_CONTACT_VERIFICATION, data };
                            }
                            return { data };
                        })
                        .catch(() => {
                            /* eslint new-cap: "off" */
                            return { error: TYPE3_CONTACT_DECRYPTION, data: new vCard().toString(VCARD_VERSION) };
                        });
                case SIGNED:
                    return pmcw
                        .verifyMessage({
                            message: pmcw.getCleartextMessage(Data),
                            publicKeys,
                            signature: pmcw.getSignature(Signature)
                        })
                        .then(({ verified }) => {
                            if (verified !== 1) {
                                return { error: TYPE2_CONTACT_VERIFICATION, data: Data };
                            }
                            return { data: Data };
                        });
                case ENCRYPTED:
                    return pmcw.decryptMessage({ message: pmcw.getMessage(Data), privateKeys, armor }).catch(() => {
                        /* eslint new-cap: "off" */
                        return { error: TYPE1_CONTACT, data: new vCard().toString(VCARD_VERSION) };
                    });
                case CLEAR_TEXT:
                    return Promise.resolve({ data: Data });
            }
        });

        return Promise.all(promises);
    }

    /**
     * Decrypt the custom datas
     * NOTE It's very important to chain the promises for the encryption to not overcharge pmcw
     * @param {Array} contacts
     * @return {Promise}
     */
    function decrypt(contacts = []) {
        const authentication = $injector.get('authentication');
        const privateKeys = authentication.getPrivateKeys(MAIN_KEY);
        const publicKeys = authentication.getPublicKeys(MAIN_KEY);
        const total = contacts.length;
        let count = 0;

        return _.reduce(
            chunk(contacts, CONTACTS_LIMIT_ENCRYPTION),
            (promise, chunkedContacts) => {
                return promise.then((previousContacts = []) => {
                    return Promise.all(
                        chunkedContacts.map(({ ID, Cards = [] }) => {
                            return extractCards({ cards: Cards, privateKeys, publicKeys }).then((data) => {
                                count++;
                                const progress = Math.floor((count * 100) / total);
                                $rootScope.$emit('progressBar', { type: 'contactsProgressBar', data: { progress } });

                                return buildContact(ID, data, Cards);
                            });
                        })
                    ).then((newContacts) => previousContacts.concat(newContacts));
                }, []);
            },
            Promise.resolve()
        );
    }

    /**
     * Encrypt the custom datas
     * NOTE It's very important to chain the promises for the encryption to not overcharge pmcw
     * @param {Array} contacts
     * @return {Promise}
     */
    function encrypt(contacts = []) {
        const authentication = $injector.get('authentication');
        const privateKeys = [authentication.getPrivateKeys(MAIN_KEY)[0]];
        const publicKeys = [authentication.getPublicKeys(MAIN_KEY)[0]];
        const total = contacts.length;
        let count = 0;

        return _.reduce(
            chunk(contacts, CONTACTS_LIMIT_ENCRYPTION),
            (promise, chunkedContacts) => {
                return promise.then((previousContacts = []) => {
                    return Promise.all(
                        chunkedContacts.map((contact) => {
                            return prepareCards({ data: contact.vCard, publicKeys, privateKeys }).then((Cards) => {
                                count++;
                                const progress = Math.floor((count * 50) / total);

                                $rootScope.$emit('progressBar', { type: 'contactsProgressBar', data: { progress } });

                                return { Cards };
                            });
                        })
                    ).then((newContacts) => previousContacts.concat(newContacts));
                });
            },
            Promise.resolve()
        );
    }

    return { decrypt, encrypt };
}
export default contactEncryption;

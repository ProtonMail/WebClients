import _ from 'lodash';
import { toList } from '../../../helpers/arrayHelper';
import { getGroup } from '../../../helpers/vcard';
import { normalizeEmail } from '../../../helpers/string';

const DEFAULT_CONTACT_GROUP = 'item1';

/* @ngInject */
function autoPinPrimaryKeys(Contact, keyCache, pmcw, contactEmails, confirmModal, gettextCatalog) {
    const LEARN_MORE = `<a target='_blank' href='https://protonmail.com/support/knowledge-base/address-verification/'>
            ${gettextCatalog.getString('Learn more', null, 'Link')}
            </a>`;
    const I18N = {
        PROMPT_TITLE: gettextCatalog.getString('Do you want to trust the primary key?'),
        promptMessage: (emails) =>
            gettextCatalog.getString(
                `You have enabled Address Verification with Trusted Keys for {{ emails }}, but no active encryption keys have been Trusted.
                 You must Trust the primary key in order to send a message to this address.`,
                { emails: '<b>' + emails.join(', ') + '</b>' },
                'Error'
            ) + LEARN_MORE,
        PROMPT_TITLE_RESIGN: gettextCatalog.getString('Do you want to re-sign the contact?'),
        promptResignMessage: (emails) =>
            gettextCatalog.getString(
                `The verification of {{ emails }} has failed: the contact is not signed correctly.
                    You must re-sign the contact in order to send a message to this address or edit the contact. This can also happen when
                    you have recovered your password and reset your keys.`,
                { emails: '<b>' + emails.join(', ') + '</b>' },
                'Warning'
            ) + LEARN_MORE
    };

    /**
     * Attach a given key to an email address in a vcard
     * @param {vCard} card
     * @param {String} email
     * @param {Object} keys
     */
    const addKeyToVCard = (card, email, keys) => {
        const normalizedEmail = normalizeEmail(email);
        const emailList = toList(card.get('email'));
        const group = getGroup(emailList, normalizedEmail);
        const data = pmcw.stripArmor(keys[email].Keys[0].PublicKey);
        const base64 = `data:application/pgp-keys;base64,${pmcw.encode_base64(pmcw.arrayToBinaryString(data))}`;

        card.add('key', base64, { group });
    };

    /**
     * Create default contact if contactEmail doesn't exist
     * @param {Array} emails
     * @return {Promise}
     */
    const createDefaultContacts = (emails, keys) => {
        return Promise.all(
            emails.map((email) => {
                const normalizedEmail = normalizeEmail(email);
                const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);

                if (!contactEmail) {
                    /* eslint new-cap: "off" */
                    const card = new vCard();

                    card.set('fn', normalizedEmail);
                    card.set('email', normalizedEmail, { group: DEFAULT_CONTACT_GROUP });

                    addKeyToVCard(card, email, keys);

                    return Contact.add([{ vCard: card }]).then(() => false);
                }

                return Promise.resolve(email);
            })
        ).then((list) => list.filter((i) => i));
    };

    const pinPrimaryKeys = async (emails, keys) => {
        const existingEmails = await createDefaultContacts(emails, keys);
        const contactIds = existingEmails.reduce((acc, email) => {
            const normalizedEmail = normalizeEmail(email);
            const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);

            if (!_.has(acc, contactEmail.ContactID)) {
                acc[contactEmail.ContactID] = [];
            }
            acc[contactEmail.ContactID].push(email);
            return acc;
        }, {});
        return Promise.all(
            Object.keys(contactIds).map((contactID) => {
                return Contact.get(contactID).then((contact) => {
                    contactIds[contactID].forEach((email) => {
                        addKeyToVCard(contact.vCard, email, keys);
                    });
                    return Contact.update(contact);
                });
            })
        );
    };

    const resignVcards = (emails) =>
        Promise.all(
            emails.map((email) => {
                const normalizedEmail = normalizeEmail(email);
                const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);
                return Contact.get(contactEmail.ContactID).then((contact) => Contact.updateUnencrypted(contact));
            })
        );

    const promptUser = (emails, resign) => {
        return new Promise((resolve) =>
            confirmModal.activate({
                params: {
                    title: resign ? I18N.PROMPT_TITLE_RESIGN : I18N.PROMPT_TITLE,
                    message: resign ? I18N.promptResignMessage(emails) : I18N.promptMessage(emails),
                    cancel: () => resolve(false),
                    confirm() {
                        confirmModal.deactivate().then(() => resolve(true));
                    }
                }
            })
        );
    };

    const confirm = (emails) =>
        promptUser(emails, false).then((pin) => {
            if (!pin) {
                confirmModal.deactivate();
                return false;
            }

            return keyCache
                .get(emails.map(normalizeEmail))
                .then((keys) => pinPrimaryKeys(emails, keys))
                .then(confirmModal.deactivate)
                .then(() => true);
        });

    const resign = (emails) =>
        promptUser(emails, true).then((resigned) => {
            if (!resigned) {
                confirmModal.deactivate();
                return false;
            }

            return resignVcards(emails)
                .then(confirmModal.deactivate)
                .then(() => true);
        });

    return { confirm, resign };
}
export default autoPinPrimaryKeys;

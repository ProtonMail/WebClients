import _ from 'lodash';
import vCard from 'vcf';

import { KNOWLEDGE_BASE } from '../../constants';
import { toList } from '../../../helpers/arrayHelper';
import { getGroup } from '../../../helpers/vcard';
import dedentTpl from '../../../helpers/dedent';
import { normalizeEmail } from '../../../helpers/string';
import { getKeyAsUri } from '../../../helpers/key';

const DEFAULT_CONTACT_GROUP = 'item1';

/* @ngInject */
function autoPinPrimaryKeys(Contact, keyCache, contactEmails, confirmModal, gettextCatalog, translator) {

    const learnMoreLink = (title) => dedentTpl`<a
        target="_blank"
        href="${KNOWLEDGE_BASE.ADDRESS_VERIFICATION}">${title}</a>`;

    const I18N = translator(() => ({
        LEARN_MORE: gettextCatalog.getString('Learn more', null, 'Link'),
        PROMPT_TITLE: gettextCatalog.getString('Do you want to trust the primary key?', null, 'Title'),
        promptMessage(emails) {
            return (
                gettextCatalog.getString(
                    `You have enabled Address Verification with Trusted Keys for {{ emails }}, but no active encryption keys have been Trusted.
                 You must Trust the primary key in order to send a message to this address.`,
                    { emails: `<b>${emails.join(', ')}</b>` },
                    'Error'
                ) + learnMoreLink(this.LEARN_MORE)
            );
        },
        PROMPT_TITLE_RESIGN: gettextCatalog.getString('Do you want to re-sign the contact?', null, 'Title'),
        promptResignMessage(emails) {
            return (
                gettextCatalog.getString(
                    `The verification of {{ emails }} has failed: the contact is not signed correctly.
                    You must re-sign the contact in order to send a message to this address or edit the contact. This can also happen when
                    you have recovered your password and reset your keys.`,
                    { emails: `<b>${emails.join(', ')}</b>` },
                    'Warning'
                ) + learnMoreLink(this.LEARN_MORE)
            );
        }
    }));

    /**
     * Attach a given key to an email address in a vcard
     * @param {vCard} card
     * @param {String} email
     * @param {Object} keys
     * @return {Promise}
     */
    const addKeyToVCard = async (card, email, keys) => {
        const normalizedEmail = normalizeEmail(email);
        const emailList = toList(card.get('email'));
        const group = getGroup(emailList, normalizedEmail);
        const base64 = await getKeyAsUri(keys[email].Keys[0].PublicKey);

        card.add('key', base64, { group });
    };

    /**
     * Create default contact if contactEmail doesn't exist
     * @param {Array} emails
     * @return {Promise}
     */
    const createDefaultContacts = (emails, keys) => {
        return Promise.all(
            emails.map(async (email) => {
                const normalizedEmail = normalizeEmail(email);
                const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);

                if (!contactEmail) {
                    const card = new vCard();

                    card.set('fn', normalizedEmail);
                    card.set('email', normalizedEmail, { group: DEFAULT_CONTACT_GROUP });

                    await addKeyToVCard(card, email, keys);

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
            Object.keys(contactIds).map(async (contactID) => {
                const contact = await Contact.get(contactID);

                await Promise.all(contactIds[contactID].map((email) => addKeyToVCard(contact.vCard, email, keys)));

                return Contact.update(contact);
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

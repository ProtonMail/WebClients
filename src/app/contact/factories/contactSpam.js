import _ from 'lodash';

import { normalizeEmail } from '../../../helpers/string';
import { wait } from '../../../helpers/promiseHelper';
import vCardRemoveEmails from '../../../helpers/vCardRemoveEmails';

/* @ngInject */
function contactSpam(
    Contact,
    contactEmails,
    eventManager,
    gettextCatalog,
    removeContactListModal,
    notification,
    contactCache,
    contactEditor,
    addressesModel,
    networkActivityTracker,
    translator
) {
    const I18N = translator(() => ({
        successRemove(total) {
            return gettextCatalog.getPlural(
                total,
                '{{total}} email removed from your contacts',
                '{{total}} emails removed from your contacts',
                { total },
                'Success'
            );
        }
    }));

    /**
     * List all contacts from the list of Emails
     * @param  {Array}  emails
     * @return {Object}        { list: Array<contact>, map:<Object:contact>}
     */
    const getContacts = (emails = []) => {
        const MAP = _.groupBy(addressesModel.get(), 'Email');

        return emails.reduce(
            (acc, email) => {
                const normalizedEmail = normalizeEmail(email);

                // It's one of ours. Ex: a conv with a response from you -> move to spam, you're a sender
                if (MAP[normalizedEmail]) {
                    return acc;
                }

                // Email can be in more than 1 contact
                const contacts = contactEmails.findAllByEmail(normalizedEmail, normalizeEmail);

                if (contacts.length) {
                    contacts.forEach((contact) => {
                        acc.list.push(contact);
                        !acc.map[contact.ContactID] && (acc.map[contact.ContactID] = []);
                        acc.map[contact.ContactID].push(contact);
                    });
                }
                return acc;
            },
            { list: [], map: Object.create(null) }
        );
    };

    /**
     * Check if we should remove a contact based on what's inside the vCard.
     * If there is any relevant informations, which is not:
     *     - fn
     *     - uid
     *     - version
     *     - protonmail custom config
     * we won't delete the contact.
     * @param  {vCard} vCard
     * @return {Boolean}
     */
    function shouldRemoveContact(vCard) {
        const hasOtherProps = Object.keys(vCard.data).some((key) => {
            return !/^x-pm|^(fn|uid|version)$/.test(key);
        });
        return !hasOtherProps;
    }

    /**
     * List which contactEmail we need to remove from a contact
     * @param  {String} ContactID
     * @param  {Object} MAP_CONTACT_EMAILS Map <ContactID>: Array<contactEmailIDs...>
     * @param  {Object} mapEmailsRemovable Map <contactEmailID>: true
     * @return {Array}                    List of contact Emails
     */
    const listRemovableEmails = (ContactID, MAP_CONTACT_EMAILS, mapEmailsRemovable) => {
        const emails = MAP_CONTACT_EMAILS[ContactID] || [];
        return emails.filter(({ ID }) => mapEmailsRemovable[ID]);
    };

    /**
     * Process a list a contact and create a flow of request to update
     * them, to remove some emails from them or delete them if we need to
     * @param  {Object} options.MAP_CONTACT_EMAILS Map of emails by contacts -> { <ContactID>: { <Email>: <contact> } }
     * @param {Object}options.mapEmails <IDEmail: true>
     * @param  {Array} options.contactCards       <Array:{ID, vCard}>
     * @return {Promise}
     */
    const processCards = ({ MAP_CONTACT_EMAILS, mapEmails, contactCards }) => {
        const { IDs, promises } = contactCards.reduce(
            (acc, { ID, vCard: currentvCard }) => {
                const removable = listRemovableEmails(ID, MAP_CONTACT_EMAILS, mapEmails);
                const vCard = vCardRemoveEmails(currentvCard, removable);

                if (shouldRemoveContact(vCard)) {
                    acc.IDs.push(ID);
                    return acc;
                }
                acc.promises.push(contactEditor.updateContact({ ID, vCard }));
                return acc;
            },
            { promises: [], IDs: [] }
        );

        IDs.length && promises.push(Contact.remove({ IDs }));
        return Promise.all(promises);
    };

    /**
     * Process contacts
     *  - With emails
     *  - Uniq
     *  First we will load the contact.
     *  Then we will parse the vCard to remove what we need
     *  Then we update the contact or delete it if there is nothing intersting
     *
     * @param  {Array}  options.withEmails Contact containing more than 1 email
     * @param  {Array}  options.uniq       Contact containing only one 1 email
     * @param  {Object} MAP_CONTACT_EMAILS Map of emails by contacts -> { <ContactID>: { <Email>: <contact> } }
     * @param {Object} mapEmails <IDEmail: true>
     * @return {Promise}
     */
    async function process({ withEmails = [], uniq = [] }, MAP_CONTACT_EMAILS, mapEmails) {
        const list = withEmails.concat(uniq);
        const contactCards = await Promise.all(list.map((id) => Contact.get(id)));
        await processCards({
            contactCards,
            MAP_CONTACT_EMAILS,
            mapEmails
        });
    }

    /**
     * When a conversation / messages goes to SPAM, we check if the Sender is in the contact list
     * In that case, we ask the user to remove or not this contact
     * @param  {Array}  emails
     * @return {Promise}
     */
    const check = async (emails = []) => {
        const { list, map: MAP_CONTACT_EMAILS } = getContacts(emails);

        if (!list.length) {
            return;
        }

        // Defer the modal to prevent the modal to be closed because the route state can change since we are moving a message cf #8513
        await wait(1000);
        const selection = await new Promise((resolve) => {
            removeContactListModal.activate({
                params: {
                    list,
                    submit(list) {
                        resolve(list);
                        removeContactListModal.deactivate();
                    },
                    hookClose() {
                        resolve([]);
                    }
                }
            });
        });

        const { contacts, mapEmails } = selection.reduce(
            (acc, { ContactID, ID }) => {
                acc.mapEmails[ID] = true;
                if (!acc.map[ContactID]) {
                    const contact = contactCache.getItem(ContactID);
                    const hasEmails = contact.Emails.length > 1;
                    !hasEmails && acc.contacts.uniq.push(ContactID);
                    hasEmails && acc.contacts.withEmails.push(ContactID);
                    acc.map[ContactID] = true;
                }
                return acc;
            },
            {
                contacts: {
                    uniq: [],
                    withEmails: []
                },
                map: Object.create(null),
                mapEmails: Object.create(null)
            }
        );

        await networkActivityTracker.track(process(contacts, MAP_CONTACT_EMAILS, mapEmails));

        const total = selection.length;
        total && notification.success(I18N.successRemove(total));

        return eventManager.call();
    };

    return check;
}
export default contactSpam;

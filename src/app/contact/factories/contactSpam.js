import _ from 'lodash';

import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactSpam(Contact, contactEmails, eventManager, gettextCatalog, removeContactListModal, notification) {
    const I18N = {
        successRemove(total) {
            return gettextCatalog.getPlural(
                total,
                '{{total}} email removed from your contacts',
                '{{total}} emails removed from your contacts',
                { total },
                'Success'
            );
        }
    };

    /**
     * List contacts from their emails
     * @param  {Array}  emails
     * @return {Array}        <contacts>
     */
    const getContacts = (emails = []) => {
        return emails.reduce((acc, email) => {
            const normalizedEmail = normalizeEmail(email);
            const contact = contactEmails.findEmail(normalizedEmail, normalizeEmail);
            contact && acc.push(contact);
            return acc;
        }, []);
    };

    /**
     * When a conversation / messages goes to SPAM, we check if the Sender is in the contact list
     * In that case, we ask the user to remove or not this contact
     * @param  {Array}  emails
     * @return {Promise}
     */
    const check = async (emails = []) => {
        const list = getContacts(emails);

        if (!list.length) {
            return;
        }

        const contacts = await new Promise((resolve) => {
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

        const IDs = _.uniq(contacts.map(({ ContactID }) => ContactID));
        await Contact.remove({ IDs });
        contacts.length && notification.success(I18N.successRemove(contacts.length));
        return eventManager.call();
    };

    return check;
}
export default contactSpam;

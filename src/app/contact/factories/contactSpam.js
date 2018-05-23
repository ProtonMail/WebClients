import { normalizeEmail } from '../../../helpers/string';

/* @ngInject */
function contactSpam(confirmModal, Contact, contactEmails, eventManager, gettextCatalog) {
    const I18N = {
        TITLE: gettextCatalog.getString('Confirm', null, 'Title'),
        buildMessage(name = '', email = '') {
            return gettextCatalog.getString(
                '{{ name }} is also in your contacts. Remove them from your contacts?',
                { name: [name, `<${email}>`].join(' ') },
                'Info'
            );
        },
        YES: gettextCatalog.getString('Yes', null, 'Action'),
        NO: gettextCatalog.getString('No', null, 'Action')
    };

    const remove = async (contactID) => {
        await Contact.remove({ IDs: [contactID] });
        await eventManager.call();
    };

    /**
     * Confirm contact deletion
     * @param  {String} ContactID
     * @param  {String} Name
     * @param  {String} Email
     * @return {Promise}
     */
    const ask = ({ ContactID = '', Name = '', Email = '' }) => {
        return new Promise((resolve) => {
            confirmModal.activate({
                params: {
                    title: I18N.TITLE,
                    message: I18N.buildMessage(Name, Email),
                    confirmText: I18N.YES,
                    cancelText: I18N.NO,
                    confirm() {
                        resolve(remove(ContactID));
                        confirmModal.deactivate();
                    },
                    cancel() {
                        resolve();
                        confirmModal.deactivate();
                    }
                }
            });
        });
    };

    /**
     * When a conversation / messages goes to SPAM, we check if the Sender is in the contact list
     * In that case, we ask the user to remove or not this contact
     * @param  {Array}  emails
     * @return {Promise}
     */
    const check = (emails = []) => {
        const promises = emails.reduce((acc, email) => {
            const normalizedEmail = normalizeEmail(email);
            const contactEmail = contactEmails.findEmail(normalizedEmail, normalizeEmail);

            if (contactEmail) {
                acc.push(ask(contactEmail));
            }

            return acc;
        }, []);

        return Promise.all(promises);
    };

    return check;
}
export default contactSpam;

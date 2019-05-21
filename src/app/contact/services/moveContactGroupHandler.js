import { info as infoError } from '../../../helpers/errors';

const toError = infoError('moveContactGroupHandler');

/* @ngInject */
function moveContactGroupHandler(
    attachGroupContactEmailsModal,
    manageContactGroup,
    contactEmails,
    contactCache,
    gettextCatalog,
    notification
) {
    const I18N = {
        noEmailsToAdd(total) {
            return gettextCatalog.getPlural(
                total,
                'No emails for this contact',
                'No emails for these contacts',
                { total },
                'Info'
            );
        },
        NO_CONTACT_SELECTED: gettextCatalog.getString('No contact selected', null, 'Error'),
        NO_GROUP_SELECTED: gettextCatalog.getString('No contact group selected', null, 'Error')
    };

    const mapGroups = (list = []) => {
        return list.reduce((acc, { LabelIDs = [] }) => {
            LabelIDs.forEach((id) => (!acc[id] ? (acc[id] = 1) : acc[id]++));
            return acc;
        }, Object.create(null));
    };

    const getSelected = (type, { email = {}, contact = {} } = {}) => {
        if (type === 'email') {
            // Can be undefined
            return [contactEmails.findByEmailVcard(email, contact.ID)].filter(Boolean);
        }
        return contactCache.get('selected');
    };

    /**
     * Get your current env, selected contactEmails
     * @param  {String} type                 Type of data we want
     * @param  {Array} options.selection     Set an array to create a custom list
     * @param  {String} options.email Custom contactEmail model we want to work with
     * @param  {String} options.contact Custom contact for the email
     * @return {Object}                      { selected: <Array>, map:<Object> }
     */
    const getEnv = (type, { selection, ...config } = {}) => {
        const selected = getSelected(type, config);
        return {
            selected: selection || selected,
            map: mapGroups(selection || selected)
        };
    };

    /**
     * Attach or detach a selection of labels to a selection of contacts.
     * @param  {String} mode          Mode of action, to have a custom behavior
     * @param  {String} type          Type of data we deal with (contact/emails)
     * @param  {Object} contactEmail  Current model of email selected ({ email:String, contact:Object })
     * @return {Function}
     */
    const manage = (mode, type, contactEmail) => {
        if (!['contact', 'email'].includes(type)) {
            throw new Error(toError(`Wrong type: ${type}`, 'Expected value: contact or email'));
        }

        /**
         * Process a list of labels and a selection if we want to work on a custom selection
         * @param  {Array}  labels
         * @param  {Array} selection ex: array of selected contactEmails
         * @return {Promise}           { mode: <submit/close>, isContactAdd:<Boolean> }
         */
        async function main(labels = [], selection) {
            const isContactAdd = mode === 'addToContact';
            const { map, selected } = getEnv(type, { selection, ...contactEmail });

            const { label, unlabel } = labels.reduce(
                (acc, { Selected, ID }) => {
                    // Null means it's attached to at least one contact but not all
                    map[ID] && !Selected && Selected !== null && acc.unlabel.push(ID);
                    Selected && acc.label.push(ID);
                    return acc;
                },
                { unlabel: [], label: [] }
            );

            if (!selected.length || !labels.length) {
                !selected.length && notification.error(I18N.NO_CONTACT_SELECTED);
                isContactAdd && !labels.length && notification.error(I18N.NO_GROUP_SELECTED);
                return {};
            }

            // Specific use case only for contacts
            if (isContactAdd && !label.length) {
                notification.error(I18N.NO_GROUP_SELECTED);
                return {};
            }

            // When we want to attach them to a list of contacts
            if (isContactAdd) {
                // If you try to add contacts to groups but all are empty
                if (selected.every(({ Emails }) => !Emails.length)) {
                    notification.error(I18N.noEmailsToAdd(selected.length));
                    return {};
                }

                // No need for the modal for only 1 email.
                if (selected.length === 1 && selected[0].Emails.length === 1) {
                    manageContactGroup.email.attach(label, selected[0].Emails);
                    return { mode: 'submit' };
                }

                return new Promise((resolve) => {
                    attachGroupContactEmailsModal.activate({
                        params: {
                            label,
                            unlabel,
                            contacts: selected,
                            hookClose: (mode) => mode && resolve({ isContactAdd, mode }),
                            submit({ attach }) {
                                manageContactGroup.email.attach(attach.label, attach.emails);
                                attachGroupContactEmailsModal.deactivate();
                                resolve({ isContactAdd, mode: 'submit' });
                            }
                        }
                    });
                });
            }

            const manageGroup = manageContactGroup[type || 'contact'];

            manageGroup.attach(label, selected);
            manageGroup.detach(unlabel, selected);

            return { mode: 'submit' };
        }

        return main;
    };

    return {
        getEnv,
        manage
    };
}
export default moveContactGroupHandler;

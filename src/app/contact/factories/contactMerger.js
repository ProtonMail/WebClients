import _ from 'lodash';

import { flow, filter, uniq, reduce } from 'lodash/fp';

/* @ngInject */
function contactMerger(
    $rootScope,
    contactMergerModal,
    contactEditor,
    contactSchema,
    Contact,
    gettextCatalog,
    networkActivityTracker,
    notification,
    vcard
) {
    const I18N = {
        mergeContacts: gettextCatalog.getString('Merge contacts', null, 'Title'),
        noDuplicate: gettextCatalog.getString('You have no duplicate contacts', null, 'Info')
    };

    /**
     * Extract emails from vCard contact
     * From GET /api/contacts Emails is defined
     * From GET /api/contacts/export Emails is defined inside the vCard Object
     * @param  {Object} contact
     * @return {Array}
     */
    function getEmails({ Emails, vCard }) {
        if (Array.isArray(Emails)) {
            return _.map(Emails, ({ Email = '' }) => Email);
        }

        return _.reduce(
            vcard.extractProperties(vCard),
            (acc, property) => {
                if (property.getField() === 'email') {
                    acc.push(property.valueOf());
                }
                return acc;
            },
            []
        );
    }

    /**
     * Extract duplicate contacts per email
     * @param  {Array}  contacts
     * @return {Object} (key: email, value: contacts)
     */
    function extractDuplicates(contacts = []) {
        const { map = {}, duplicate = [] } = _.reduce(
            contacts,
            (acc, contact, index) => {
                const emails = getEmails(contact);

                _.each(emails, (email = '') => {
                    acc.map[email] = acc.map[email] || [];
                    acc.map[email].push(index);

                    if (acc.map[email].length > 1) {
                        acc.duplicate.push(email);
                    }
                });

                return acc;
            },
            { map: {}, duplicate: [] }
        );

        return flow(
            uniq,
            reduce((acc, email) => {
                acc[email] = [];

                _.each(map[email], (index) => {
                    const contact = contacts[index];
                    contact.selected = true; // Select the contact per default
                    acc[email].push(contact);
                });

                return acc;
            }, {})
        )(duplicate);
    }

    /**
     * Open the confirm merge contacts modal
     * Let the user pick contacts to merge
     * And then call the merge function
     * @param  {Object} emails
     */
    function confirm(emails) {
        contactMergerModal.activate({
            params: {
                emails,
                merge(emails = {}) {
                    merge(emails);
                    contactMergerModal.deactivate();
                },
                close() {
                    contactMergerModal.deactivate();
                }
            }
        });
    }

    /**
     * Delete existing contacts and merge properties per email address
     * @param  {Object} emails
     */
    function merge(emails = {}) {
        const { toDelete, toCreate } = flow(
            reduce(
                (acc, key) => {
                    const contacts = emails[key];

                    const properties = flow(
                        filter(({ selected }) => selected),
                        reduce((acc2, contact) => {
                            if (contact.selected) {
                                acc.toDelete.push(contact.ID);
                                acc2.push(vcard.extractProperties(contact.vCard));
                            }

                            return acc2;
                        }, [])
                    )(contacts);

                    if (properties.length) {
                        /* eslint new-cap: "off" */
                        const newCard = new vCard();

                        _.each(properties, (property) => newCard.addProperty(property));
                        acc.toCreate.push(newCard);
                    }

                    return acc;
                },
                { toDelete: [], toCreate: [] }
            )
        )(Object.keys(emails));

        contactEditor.remove({ contactIDs: toDelete, confirm: false });
        contactEditor.create({ contacts: contactSchema.prepare(toCreate) });
    }

    /**
     * First function called to initialize this process
     * @return {Promise}
     */
    function mergeContacts() {
        const promise = Contact.exportAll().then((contacts) => {
            const emails = extractDuplicates(contacts);

            if (Object.keys(emails).length) {
                confirm(emails);
            } else {
                notification.info(I18N.noDuplicate);
            }
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    $rootScope.$on('contacts', (event, { type }) => {
        type === 'mergeContacts' && mergeContacts();
    });

    return { init: angular.noop, extractDuplicates };
}

export default contactMerger;

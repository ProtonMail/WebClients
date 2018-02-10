import _ from 'lodash';
import duplicateExtractor from '../../../helpers/duplicateExtractor';

/* @ngInject */
function contactMerger(
    $rootScope,
    contactMergerModal,
    contactDisplayModal,
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
     * Clean a name for use in the duplication check
     * @param {string} name
     * @returns {string}
     */
    const cleanName = (name = '') => name.trim().toLowerCase();

    /**
     * Extract name from contact.
     * From GET /api/contacts Name is defined
     * From GET /api/contacts/export Name is defined inside the vCard Object
     * @param Name
     * @param vCard
     * @returns {*}
     */
    function getName({ Name, vCard }) {
        if (Name) {
            return Name;
        }
        const name = vCard.get('fn');
        return (Array.isArray(name) ? name[0] : name).valueOf();
    }

    /**
     * Extract duplicates from an array of contacts.
     * @param {Array} contacts
     * @returns {{}}
     */
    function extractDuplicates(contacts = []) {
        // Flatten all emails and names from a contact into the format that duplicateExtractor expects.
        const items = contacts.reduce((acc, contact, i) => {
            const emails = getEmails(contact)
                .map((email) => ({ duplicate: email, unique: i, contact }));
            const names = [{ duplicate: cleanName(getName(contact)), unique: i, contact }];
            return acc.concat(emails).concat(names);
        }, []);
        // Extract the duplicates.
        return duplicateExtractor({
            items,
            duplicateKey: 'duplicate',
            uniqueKey: 'unique',
            objectKey: 'contact'
        });
    }

    /**
     * Convert multiple contacts into one.
     * @param {array} contacts
     * @return {vCard} the new vCard instance
     */
    function getMergedContact(contacts = []) {
        return vcard.merge(
            contacts.map(({ vCard }) => vCard)
        );
    }

    /**
     * Get the contacts to delete and to create from the grouping in the way that the API expects.
     * @param emails
     * @returns {object}
     */
    function prepareMerge(emails = {}) {
        return Object.keys(emails).reduce((acc, key) => {
            const { selected = [], deleted = [] } = emails[key];

            // Merge the vCards together, and create the update contact in the way the API expects.
            const update = contactSchema.prepareContact(
                getMergedContact(selected)
            );

            // The first contact is the one that will be updated.
            const updateId = selected[0].id;

            // Set the ID on the "new" contact (the one to update).
            update.ID = updateId;

            acc[key] = {
                update,
                remove: selected
                    .concat(deleted) // Add the ids that were requested to be deleted.
                    .map(({ id }) => id)
                    .filter((id) => id !== updateId)
            };
            return acc;
        }, {});
    }

    /**
     * Mangle the groups of contacts into selected and delected.
     * @param {Object} groups Coming from the contact-merge directive.
     * @returns {{}}
     */
    function prepareGroups(groups) {
        return Object.keys(groups)
            .reduce((acc, key) => {
                // Include contacts that were selected, or deleted.
                const selected = groups[key].filter(({ selected }) => selected);
                const deleted = groups[key].filter(({ deleted }) => deleted);

                // If less than 2 contacts were selected, then ignore this group.
                if (selected.length <= 1) {
                    return acc;
                }
                acc[key] = { selected, deleted };
                return acc;
            }, {});
    }

    /**
     * Open the preview contact modal.
     * @param vcard of the contact
     */
    function showContactPreviewModal(vcard) {
        contactDisplayModal.activate({
            params: {
                vcard,
                close() {
                    contactDisplayModal.deactivate();
                }
            }
        });
    }

    /**
     * Open the confirm merge contacts modal
     * Let the user pick contacts to merge
     * And then call the merge function
     * @param {Object} duplicates
     */
    function showMergeModal(duplicates) {
        contactMergerModal.activate({
            params: {
                title: I18N.mergeContacts,
                duplicates,
                merge(groups = {}) {
                    const duplicateGroups = prepareGroups(groups);
                    if (Object.keys(duplicateGroups).length === 0) {
                        return;
                    }
                    contactEditor.merge(prepareMerge(duplicateGroups));
                    contactMergerModal.deactivate();
                },
                preview(contacts = []) {
                    if (!contacts.length) {
                        return;
                    }
                    showContactPreviewModal(getMergedContact(contacts));
                },
                close() {
                    contactMergerModal.deactivate();
                }
            }
        });
    }

    /**
     * First function called to initialize this process
     * @return {Promise}
     */
    function mergeContacts(ids = []) {
        const promise = ids.length >= 2 ?
            Contact.getMultiple(ids).then((data) => ({ group: data })) :
            Contact.exportAll().then(extractDuplicates);

        promise.then((duplicates) => {
            if (Object.keys(duplicates).length) {
                return showMergeModal(duplicates);
            }
            notification.info(I18N.noDuplicate);
        });

        networkActivityTracker.track(promise);

        return promise;
    }

    $rootScope.$on('contacts', (event, { type, data = {} }) => {
        type === 'mergeContacts' && mergeContacts(data.contactIDs);
    });

    return { init: angular.noop, extractDuplicates };
}

export default contactMerger;

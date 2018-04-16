import _ from 'lodash';
import duplicateExtractor from '../../../helpers/duplicateExtractor';

/* @ngInject */
function contactMerger(
    contactMergerModal,
    contactDisplayModal,
    contactEditor,
    contactSchema,
    Contact,
    dispatchers,
    gettextCatalog,
    networkActivityTracker,
    notification,
    vcard
) {
    const I18N = {
        mergeContacts: gettextCatalog.getString('Merge contacts', null, 'Title'),
        noDuplicate: gettextCatalog.getString('You have no duplicate contacts', null, 'Info')
    };

    const { on } = dispatchers();

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
     * Get the contacts to update and delete from the grouping in the way that the API expects.
     * @param emails
     * @returns {object}
     */
    function prepareMerge(emails = {}) {
        const getContactToUpdate = (selected = []) => {
            // When there are less than 2 selected contacts, don't update or merge any contact.
            if (selected.length <= 1) {
                return;
            }
            // Merge the vCards together, and create the update contact in the way the API expects.
            const update = contactSchema.prepareContact(
                getMergedContact(selected)
            );
            // The first selected contact is the one that will be updated.
            // Set the ID on the "new" contact (the one to update).
            update.ID = selected[0].id;
            return update;
        };

        // Contacts to remove are the selected contacts (except the first one, because it is the target for the merge)
        // + the contacts selected for deletion.
        const getContactsToRemove = (selected = [], deleted = []) => selected.slice(1).concat(deleted).map(({ id }) => id);

        return Object.keys(emails).reduce((acc, key) => {
            const { selected, deleted } = emails[key];
            acc[key] = {
                update: getContactToUpdate(selected),
                remove: getContactsToRemove(selected, deleted)
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

                // If less than 2 contacts were selected, and there is nothing to delete, ignore this group.
                if (selected.length <= 1 && deleted.length === 0) {
                    return acc;
                }
                acc[key] = { selected, deleted };
                return acc;
            }, {});
    }

    /**
     * Open the display contact modal.
     * @param {vCard} vcard of the contact
     */
    function showContactDisplayModal(vcard) {
        contactDisplayModal.activate({
            params: {
                vcard,
                onClickClose() {
                    contactDisplayModal.deactivate();
                }
            }
        });
    }

    /**
     * Open the preview contact modal, which has the possibility to merge the contact directly.
     * @param {vCard} vcard of the contact
     * @param {Function} merge
     */
    function showContactPreviewModal(vcard, merge) {
        contactDisplayModal.activate({
            params: {
                vcard,
                onClickMerge() {
                    merge();
                    contactDisplayModal.deactivate();
                },
                onClickClose() {
                    contactDisplayModal.deactivate();
                }
            }
        });
    }

    /**
     * Perform the merge of a group of contacts.
     * @param {Object} groups
     * @returns {Promise} promise for when the merge has completed
     */
    async function doMerge(groups) {
        const duplicateGroups = prepareGroups(groups);
        if (Object.keys(duplicateGroups).length === 0) {
            throw new Error('Not enough contacts selected');
        }
        return contactEditor.merge(prepareMerge(duplicateGroups));
    }

    /**
     * Get the callback for when the merge button is pressed inside the preview contact modal.
     * It performs the merge with a single group, and if this group was the only group left in the merge
     * modal, close it.
     * @param {Array} group
     * @param {string} groupName
     * @param {function} callback
     * @returns {function()}
     */
    function getPreviewMergeCallback(group, groupName, callback) {
        return async () => {
            await doMerge({ [groupName]: group });
            const remainingGroups = callback(groupName);
            if (Object.keys(remainingGroups).length === 0) {
                contactMergerModal.deactivate();
            }
        };
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
                onClickMerge(groups = {}) {
                    doMerge(groups).catch(() => {});
                    contactMergerModal.deactivate();
                },
                onClickDetails(selection) {
                    showContactDisplayModal(selection.vCard);
                },
                onClickPreview(group = [], groupName = '', mergeGroupSuccess) {
                    const selectedContacts = group.filter(({ selected }) => selected);
                    if (selectedContacts.length <= 1) {
                        return;
                    }
                    showContactPreviewModal(
                        getMergedContact(selectedContacts),
                        getPreviewMergeCallback(group, groupName, mergeGroupSuccess)
                    );
                },
                onClickClose() {
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

    on('contacts', (event, { type, data = {} }) => {
        type === 'mergeContacts' && mergeContacts(data.contactIDs);
    });

    return { init: angular.noop, extractDuplicates };
}

export default contactMerger;

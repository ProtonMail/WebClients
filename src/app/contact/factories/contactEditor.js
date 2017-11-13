angular.module('proton.contact')
    .factory('contactEditor', ($log, $rootScope, $state, eventManager, chunk, Contact, CONSTANTS, contactModal, contactLoaderModal, contactSchema, confirmModal, gettextCatalog, networkActivityTracker, notification) => {
        /*
        * Add contacts
        * @param {Array} contacts
        * @return {Promise}
        */
        function create({ contacts = [], mode }) {
            let promiseCompleted = false;
            const promise = Contact.add(contacts)
                .then(({ created, total, errors }) => {
                    return eventManager.call()
                        .then(() => {
                            promiseCompleted = true;
                            $rootScope.$emit('contacts', { type: 'contactCreated', data: { created, total, errors, mode } });
                        });
                });

            // If the promise take too much time, we display a modal to inform the user
            setTimeout(() => {
                if (!promiseCompleted) {
                    contactLoaderModal.activate({ params: { mode: 'import', close() { contactLoaderModal.deactivate(); } } });
                }
            }, CONSTANTS.CONTACT_LOADER_DELAY);

            return promise;
        }
        /*
        * Edit a contact
        * @param {Object} contact
        * @return {Promise}
        */
        function update({ contact = {} }) {
            const promise = Contact.update(contact)
                .then(({ Contact, cards }) => {
                    $rootScope.$emit('contacts', { type: 'contactUpdated', data: { contact: Contact, cards } });
                    notification.success(gettextCatalog.getString('Contact edited', null, 'Success message'));
                    return eventManager.call();
                });

            networkActivityTracker.track(promise);

            return promise;
        }
        /*
        * Delete contact(s)
        * @param {Array} selectContacts
        * @return {Promise}
        */
        function remove({ contactIDs = [], confirm = true }) {
            const success = (contactIDs === 'all') ? gettextCatalog.getString('All contacts deleted', null, 'Success') : gettextCatalog.getPlural(contactIDs.length, 'Contact deleted', 'Contacts deleted', null, 'Success');
            const process = () => {
                const promise = requestDeletion(contactIDs)
                    .then(() => {
                        notification.success(success);
                        $state.go('secured.contacts');
                    });

                networkActivityTracker.track(promise);
            };

            if (confirm) {
                confirmDeletion(contactIDs, () => process());
            } else {
                process();
            }
        }

        function requestDeletion(contactIDs = []) {
            const promise = (contactIDs === 'all') ? Contact.clear() : Contact.remove({ IDs: contactIDs });

            promise.then(({ data = {} } = {}) => {
                if (data.Error) {
                    throw new Error(data.Error);
                }
                return eventManager.call();
            });

            return promise;
        }

        function confirmDeletion(contactIDs = [], callback) {
            const message = (contactIDs === 'all') ? gettextCatalog.getString('Are you sure you want to delete all your contacts?', null, 'Info') : gettextCatalog.getPlural(contactIDs.length, 'Are you sure you want to delete this contact?', 'Are you sure you want to delete the selected contacts?', null, 'Info');
            const title = (contactIDs === 'all') ? gettextCatalog.getString('Delete all', null, 'Title') : gettextCatalog.getString('Delete', null, 'Title');

            confirmModal.activate({
                params: {
                    title,
                    message,
                    confirm() {
                        callback();
                        confirmModal.deactivate();
                    },
                    cancel() {
                        confirmModal.deactivate();
                    }
                }
            });
        }

        function add({ email, name }) {
            const contact = angular.copy(contactSchema.contactAPI);

            email && contact.vCard.add('email', email);
            name && contact.vCard.add('fn', name);

            contactModal.activate({
                params: {
                    contact,
                    close() {
                        contactModal.deactivate();
                    }
                }
            });
        }

        $rootScope.$on('contacts', (event, { type, data = {} }) => {
            (type === 'deleteContacts') && remove(data);
            (type === 'updateContact') && update(data);
            (type === 'createContact') && create(data);
            (type === 'addContact') && add(data);
        });

        return { init: angular.noop, create, update, remove };
    });

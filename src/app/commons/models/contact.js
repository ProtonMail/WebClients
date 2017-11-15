angular.module('proton.commons')
    .factory('Contact', ($http, $q, $rootScope, CONSTANTS, notify, url, chunk, contactEncryption, sanitize) => {
        const requestURL = url.build('contacts');
        const { CONTACTS_LIMIT_UPLOAD } = CONSTANTS;

        /**
         * Clean contact datas
         * @param  {String} data
         * @return {Object}
         */
        function clearContacts(contacts = []) {
            return contacts.map((contact) => {
                contact.Email = sanitize.input(contact.Email);
                contact.Name = sanitize.input(contact.Name);

                return contact;
            });
        }

        function request(route, params) {
            return $http.get(route, { params })
                .then(({ data = {} } = {}) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                });
        }

        function queryContacts(route = '', size = 100, key = '') {
            return request(route, { PageSize: size })
                .then((data) => {
                    const promises = [Promise.resolve(data[key])];
                    const n = Math.ceil(data.Total / size) - 1;

                    if (n > 0) {
                        _.times(n, (index) => {
                            promises.push(request(route, { PageSize: size, Page: index + 1 }).then((data) => data[key]));
                        });
                    }

                    return Promise.all(promises)
                        .then((results = []) => results.reduce((acc, result) => [...acc, ...result]));
                });
        }

        /**
         * Get a list of Contact Emails right after Login
         * @return {Promise}
         */
        function hydrate() {
            return queryContacts(requestURL('emails'), CONSTANTS.CONTACT_EMAILS_LIMIT, 'ContactEmails')
                .then((contacts) => clearContacts(contacts));
        }

        /**
         * Get a list of Contacts minus their Data
         * @return {Promise}
         */
        const all = () => queryContacts(requestURL(), CONSTANTS.CONTACTS_LIMIT, 'Contacts');

        /**
         * Get full Contact
         * @param {String} contactID
         * @return {Promise}
         */
        function get(contactID) {
            return $http.get(requestURL(contactID))
                .then(({ data = {} }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data.Contact;
                })
                .then((contact) => contactEncryption.decrypt([contact]))
                .then((contacts) => contacts[0]);
        }

        function handleUpload(result = []) {
            const { created = [], total = 0, errors = [] } = _.reduce(result, (acc, { data = {} } = {}) => {
                if (data.Error) {
                    acc.errors.push({
                        code: data.Code,
                        error: data.Error
                    });

                    return acc;
                }

                _.each(data.Responses, ({ Response = {} }) => {
                    acc.total++;

                    if (Response.Error) {
                        acc.errors.push({
                            code: Response.Code,
                            name: Response.Name,
                            emails: Response.Emails,
                            error: Response.Error
                        });
                    }

                    if (Response.Code === 1000) {
                        acc.created.push(Response.Contact);
                    }
                });

                return acc;
            }, { created: [], total: 0, errors: [] });

            return { created, total, errors };
        }

        function uploadContacts(cards = [], total) {
            let progress = 50; // NOTE We start at 50% because the first part (encryption) is already done
            const chunkCards = chunk(cards, CONTACTS_LIMIT_UPLOAD);
            const promises = _.map(chunkCards, (Contacts) => {
                const params = { Contacts, Groups: 1, Overwrite: 1, Labels: 1 };

                return $http.post(requestURL(), params)
                    .then((data) => {
                        progress += +((Contacts.length * 50) / total).toFixed();
                        $rootScope.$emit('progressBar', { type: 'contactsProgressBar', data: { progress } });

                        return data;
                    });
            });

            return Promise.all(promises).then(handleUpload);
        }

        /**
         * Create new contacts
         * @param {Array} contacts
         * @return {Promise}
         */
        function add(contacts = []) {
            return contactEncryption.encrypt(contacts)
                .then((result = []) => uploadContacts(result, contacts.length))
                .then((data) => {
                    $rootScope.$emit('contacts', { type: 'contactsUpdated' });
                    return data;
                });
        }

        /**
         * Update a contact
         * @param {Object} contact
         * @return {Promise}
         */
        function update(contact) {
            return contactEncryption.encrypt([contact])
                .then((contacts) => {
                    return $http.put(requestURL(contact.ID), contacts[0])
                        .then(({ data = {} } = {}) => {
                            if (data.Error) {
                                throw new Error(data.Error);
                            }
                            // NOTE We need to pass the cards to update the encrypted icon in the contact view
                            data.cards = contacts[0].Cards;
                            return data;
                        });
                });
        }

        /**
         * Delete array of contacts
         * @param {Array} contacts
         * @return {Promise}
         */
        const remove = (contacts) => $http.put(requestURL('delete'), contacts);

        /**
         * Delete all contacts
         * @return {Promise}
         */
        const clear = () => $http.delete(requestURL());

        /**
         * Get all ContactData's for export
         * @return {Promise}
         */
        function exportAll() {
            return queryContacts(requestURL('export'), CONSTANTS.EXPORT_CONTACTS_LIMIT, 'Contacts')
                .then((contacts) => contactEncryption.decrypt(contacts));
        }

        /**
         * Get groups and their emails
         * @return {Promise}
         */
        const groups = () => $http.get(requestURL('groups'));

        return { hydrate, all, get, add, update, remove, clear, exportAll, groups };
    });

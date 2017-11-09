angular.module('proton.contact')
    .factory('contactCache', (
        $filter,
        $rootScope,
        $state,
        $stateParams,
        networkActivityTracker,
        CONSTANTS,
        Contact,
        contactDownloader,
        contactEmails,
        contactImporter
    ) => {
        const CACHE = {
            hydrated: false,
            contacts: [],
            map: {
                all: {},
                selected: [],
                filtered: []
            }
        };

        const { CONTACTS_PER_PAGE } = CONSTANTS;
        const ACTIONS = {
            [CONSTANTS.STATUS.DELETE]: 'remove',
            [CONSTANTS.STATUS.CREATE]: 'create',
            [CONSTANTS.STATUS.UPDATE]: 'update'
        };
        const findID = (ID) => _.findIndex(CACHE.contacts, { ID });
        const emit = () => $rootScope.$emit('contacts', { type: 'contactsUpdated', data: { all: get() } });
        const orderBy = (contacts = []) => $filter('orderBy')(contacts, $stateParams.sort || 'Name');
        const lowerCase = (word = '') => word.toLowerCase();
        const filterEmails = (emails = [], value = '') => _.filter(emails, ({ Email = '' }) => lowerCase(Email).indexOf(value) > -1);
        const total = () => (($stateParams.keyword) ? CACHE.map.filtered.length : CACHE.contacts.length);
        const isHydrated = () => CACHE.hydrated;

        function selected() {
            const selected = _.chain(get()).filter(({ selected }) => selected).map(({ ID }) => ID).value();

            if (!selected.length && $stateParams.id) {
                return [$stateParams.id];
            }

            return selected;
        }

        function filter() {
            const keyword = $stateParams.keyword || '';
            return orderBy(search(keyword, get())).map(({ ID }) => ID);
        }

        function get(key = 'all') {
            if (key === 'all') {
                return angular.copy(CACHE.contacts);
            }
            return _.map(CACHE.map[key], (contactID) => CACHE.map.all[contactID]);
        }

        /**
         * Call the BE to get the contact list
         * @return {Array} contacts
         */
        function hydrate() {
            const promise = Contact.all()
                .then((contacts) => {
                    CACHE.hydrated = true;
                    CACHE.contacts = contacts;
                    sync();

                    return get();
                })
                .then(() => emit());

            networkActivityTracker.track(promise);

            return promise;
        }

        function sync() {
            const emails = contactEmails.fetch();

            // Synchronise emails
            CACHE.contacts = _.map(get(), (contact) => {
                contact.Emails = _.where(emails, { ContactID: contact.ID });
                contact.emails = contact.Emails.map(({ Email = '' }) => Email).join(', ');

                return contact;
            });

            // Create maps
            CACHE.map = {
                all: _.reduce(get(), (acc, contact) => (acc[contact.ID] = contact, acc), {}),
                selected: selected(),
                filtered: filter()
            };
        }

        /*
         * Clear the contacts array and reset Hydrated
         */
        function clear() {
            CACHE.contacts = [];
            CACHE.hydrated = false;
        }

        function create(contact) {
            CACHE.contacts.push(contact);
            CACHE.map.all[contact.ID] = contact;
        }

        function update(contact, index) {
            CACHE.contacts[index] = contact;
            CACHE.map.all[contact.ID] = contact;
        }

        function deleteContactEmail(EmailID) {
            const contact = _.filter(get(), (contact) => {
                return _.some(contact.Emails, { ID: EmailID });
            })[0];
            contact && updateContact({ ID: contact.ID, contact });
        }

        function updateContact({ ID, contact }) {
            const index = findID(ID);

            if (index !== -1) {
                update(contact, index);
            } else {
                create(contact);
            }

            emit();
        }

        function refreshContactEmails({ ID }) {
            const index = findID(ID);

            if (index !== -1) {
                const contact = CACHE.contacts[index];
                updateContact({ ID, contact });
            }
        }

        function paginate(contacts = []) {
            const currentPage = $stateParams.page || 1;
            const begin = (currentPage - 1) * CONTACTS_PER_PAGE;
            const end = begin + CONTACTS_PER_PAGE;

            return contacts.slice(begin, end);
        }

        function deletedContactEmail({ ID }) {
            if (CACHE.contacts.length > 0) {
                deleteContactEmail(ID);
            }
        }

        function resetContacts() {
            clear();
            hydrate();
        }

        function search(keyword = '', contacts = []) {
            const value = lowerCase(keyword);

            return _.filter(contacts, ({ Name = '', Emails = [] }) => {
                return lowerCase(Name).indexOf(value) > -1 || filterEmails(Emails, value).length;
            });
        }

        function selectContacts({ contactIDs = [], isChecked }) {
            CACHE.contacts = _.map(get(), (contact) => {
                if (contactIDs.indexOf(contact.ID) > -1) {
                    contact.selected = isChecked;
                }

                return contact;
            });

            sync();
            emit();
        }

        function stateChanged({ toParams = {}, fromParams = {} }) {
            // Uncheck all contacts when we change params state
            if (!_.isEqual(toParams, fromParams)) {
                CACHE.contacts = _.map(get(), (contact) => {
                    contact.selected = false;
                    return contact;
                });

                sync();
                emit();
            }
        }

        function contactEvents({ events = [] }) {
            const todo = events.reduce((acc, { ID, Contact = {}, Action }) => {
                const action = ACTIONS[Action];

                if (action === 'create') {
                    acc[action].push(Contact);
                    return acc;
                }
                // Contact does not exist for DELETE
                acc[action][ID] = Contact;
                return acc;
            }, { update: {}, create: [], remove: {} });

            CACHE.contacts = _.chain(get())
                .map((contact) => todo.update[contact.ID] || contact)
                .filter(({ ID }) => !todo.remove[ID])
                .value()
                .concat(todo.create);

            sync();
            emit();
        }

        $rootScope.$on('contacts', (event, { type, data = {} }) => {
            (type === 'contactEvents') && contactEvents(data);
            (type === 'refreshContactEmails') && refreshContactEmails(data);
            (type === 'deletedContactEmail') && deletedContactEmail(data);
            (type === 'resetContacts') && resetContacts();
            (type === 'importContacts') && contactImporter(data.contactID);
            (type === 'exportContacts') && contactDownloader(data.contactID);
            (type === 'selectContacts') && selectContacts(data);
        });

        $rootScope.$on('$stateChangeSuccess', (event, toState, toParams, fromState, fromParams) => {
            if ($state.includes('secured.contacts')) {
                stateChanged({ toState, toParams, fromState, fromParams });
            }
        });

        return { hydrate, isHydrated, clear, get, total, paginate };
    });

angular.module('proton.contact')
    .factory('contactEmails', ($rootScope, $state, Contact, networkActivityTracker) => {

        const emails = [];
        const set = (data) => emails.push(...data);
        const fetch = () => emails;
        const clear = () => (emails.length = 0);
        const findIndex = (ID) => _.findIndex(emails, { ID });

        const emit = (contact) => {
            $rootScope.$emit('contacts', {
                type: 'refreshContactEmails',
                data: { ID: contact.ContactID }
            });
        };

        /**
         * Load first 100 emails via the user auth process
         * @return {Promise}
         */
        const loadCache = async () => {
            const list = await Contact.hydrate();
            set(list);
            return fetch();
        };

        const load = () => {
            const promise = networkActivityTracker.track(loadCache());
            return promise;
        };

        $rootScope.$on('createContactEmail', (event, contactEmail) => {
            emails.push(contactEmail);
            emit(contactEmail);
        });

        $rootScope.$on('updateContactEmail', (event, ID, contactEmail) => {
            const index = findIndex(ID);

            if (index !== -1) {
                emails[index] = contactEmail;
            } else {
                emails.push(contactEmail);
            }

            emit(contactEmail);
        });

        $rootScope.$on('deleteContactEmail', (event, ID) => {
            const index = findIndex(ID);

            if (index !== -1) {
                emails.splice(index, 1);
                $rootScope.$emit('contacts', { type: 'deletedContactEmail', data: { ID } });
            }
        });

        return { set, fetch, clear, findIndex, load };
    });

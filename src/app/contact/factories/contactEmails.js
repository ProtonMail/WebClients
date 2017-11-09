angular.module('proton.contact')
    .factory('contactEmails', ($rootScope) => {
        const emails = [];
        const api = {
            set(data) {
                emails.push(...data);
            },
            fetch() {
                return emails;
            },
            clear() {
                emails.length = 0;
            },
            findIndex(ID) {
                return _.findIndex(emails, { ID });
            }
        };

        const emit = (contact) => $rootScope.$emit('contacts', { type: 'refreshContactEmails', data: { ID: contact.ContactID } });

        $rootScope.$on('createContactEmail', (event, contactEmail) => {
            emails.push(contactEmail);
            emit(contactEmail);
        });

        $rootScope.$on('updateContactEmail', (event, ID, contactEmail) => {
            const index = api.findIndex(ID);

            if (index !== -1) {
                emails[index] = contactEmail;
            } else {
                emails.push(contactEmail);
            }

            emit(contactEmail);
        });

        $rootScope.$on('deleteContactEmail', (event, ID) => {
            const index = api.findIndex(ID);

            if (index !== -1) {
                emails.splice(index, 1);
                $rootScope.$emit('contacts', { type: 'deletedContactEmail', data: { ID } });
            }
        });

        return api;
    });

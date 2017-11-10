angular.module('proton.contact')
    .factory('contactEmailsInitialize', (Contact, contactEmails) => {
        return () => {
            return Contact.hydrate()
                .then((contacts) => (contactEmails.set(contacts), contacts));
        };
    });

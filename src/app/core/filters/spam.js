angular.module('proton.core')
    .filter('spam', () => {
        return (contacts = [], input = '') => {
            return (input) ? _.filter(contacts, (contact) => contact.Email.indexOf(input) > -1) : contacts;
        };
    });

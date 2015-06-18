angular.module("proton.contacts", [])
    .service('contactManager', function($rootScope, Contact) {

        return {
            isItNew: function(email) {
                return typeof _.findWhere($rootScope.user.Contacts, {Email: email.Address}) === 'undefined';
            },
            add: function(email) {
                $rootScope.user.Contacts.push(email);
            },
            send: function(contactList) {
                return Contact.save({Contacts: contactList});
            },
            remove: function(email) {
                $rootScope.user.Contacts = _.without($rootScope.user.Contacts, email);
            }
        };
    });

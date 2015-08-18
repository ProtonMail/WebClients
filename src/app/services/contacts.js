angular.module("proton.contacts", [])
    .service('contactManager', function($rootScope, Contact) {

        return {
            save: function(message) {
                var list = message.ToList.concat(message.CCList).concat(message.BCCList);

                if(angular.isDefined(message.SenderAddress)) {
                    list.push({
                        Address: message.SenderAddress,
                        Name: message.SenderName || message.SenderAddress
                    });
                }

                var newContacts = _.filter(list, function(email) {
                    return this.isItNew(email);
                }.bind(this));

                _.each(newContacts, function(email) {
                    this.add(email);
                    email.Email = email.Address;
                    email.Name = email.Name || email.Address;
                }.bind(this));

                if (newContacts.length > 0) {
                    this.send(newContacts);
                }
            },
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

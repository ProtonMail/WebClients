angular.module("proton.controllers.Contacts", [
    "proton.modals"
])

.controller("ContactsController", function($rootScope, $scope, contacts, Contact, confirmModal) {
    $rootScope.pageName = "Contacts";

    $scope.contacts = contacts;
    $scope.search = {};
    $scope.editing = false;

    var props;

    $scope.deleteContacts = function() {
      confirmModal.activate({
        params: {
          message: 'Are you sure you want to delete contacts?',
          confirm: function() {
            _.forEach($scope.contactsSelected(), function(contact) {
                var idx = contacts.indexOf(contact);
                if (idx >= 0) {
                    contact.$delete();
                    contacts.splice(idx, 1);
                    Contact.index.updateWith($scope.contacts);
                }
            });
          },
          cancel: function() {
              confirmModal.deactivate();
          }
        }
      })
    };

    $scope.deleteContact = function(contact) {
        confirmModal.activate({
            params: {
                message: 'Are you sure you want to delete this contact?',
                confirm: function() {
                    var idx = contacts.indexOf(contact);
                    if (idx >= 0) {
                        contact.$delete();
                        contacts.splice(idx, 1);
                        Contact.index.updateWith($scope.contacts);
                    }
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.addContact = function() {
        $scope.contacts.unshift({
            ContactName: '',
            ContactEmail: '',
            edit: true
        });
    };

    $scope.setEditedContact = function(contact) {
        props = _.pick(contact, 'ContactName', 'ContactEmail');
        $scope.search = contact;
        $scope.editing = true;
    };

    $scope.cancelEditing = function() {
        _.extend($scope.search, props);
        props = null;
        $scope.search = {};
        $scope.editing = false;
    };

    $scope.allSelected = function() {
        var status = true;

        if ($scope.contacts.length > 0) {
            _.forEach($scope.contacts, function(contact) {
                if (!!!contact.selected) {
                    status = false;
                }
            });
        } else {
            status = false;
        }

        return status;
    };

    $scope.selectAllContacts = function() {
        var status = !!!$scope.allSelected();

        _.forEach($scope.contacts, function(contact) {
            contact.selected = status;
        }, this);
    };

    $scope.contactsSelected = function() {
        return _.filter($scope.contacts, function(contact) {
          return contact.selected === true;
        });
    };

    $scope.saveContact = function() {
        if ($scope.editing) {
            if (this.contactForm.$valid) {
                $scope.search.$update();
                $scope.search = {};
                $scope.editing = false;
                Contact.index.updateWith($scope.contacts);
            }
        } else {
            var existing = _.find(contacts, function(c) {
                return c.ContactEmail === $scope.search.ContactEmail;
            });

            if (this.contactForm.$valid && !existing) {
                var newContact = _.pick($scope.search, 'ContactName', 'ContactEmail');
                _.defaults(newContact, {
                    ContactName: newContact.ContactEmail
                });
                var contact = new Contact(newContact);

                contact.$save(null, function(obj) {
                    _.extend(contact, newContact, _.pick(obj, 'ContactID'));
                });

                contacts.unshift(contact);
                Contact.index.add([contact]);

                $scope.search = {};
                $scope.editing = false;
            }
        }
    };

    $scope.sendMessageTo = function() {

    };

    $scope.uploadContacts = function() {

    };

    $scope.downloadContacts = function() {

    };
});

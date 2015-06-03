angular.module("proton.controllers.Contacts", [
    "proton.modals"
])

.controller("ContactsController", function(
    $rootScope,
    $scope,
    $state,
    $log,
    $translate,
    contacts,
    Contact,
    confirmModal,
    contactModal,
    dropzoneModal,
    Message,
    networkActivityTracker,
    notify
) {
    $rootScope.pageName = "Contacts";

    $scope.contacts = contacts;
    $scope.search = '';
    $scope.editing = false;

    var props;

    function openContactModal(title, name, email, save) {
        contactModal.activate({
            params: {
                title: title,
                name: name,
                email: email,
                save: save,
                cancel: function() {
                    contactModal.deactivate();
                }
            }
        });
    }

    $scope.deleteContacts = function() {
        var contactsSelected = $scope.contactsSelected();
        var message, title;

        if (contactsSelected.length === 1) {
            title = $translate.instant('DELETE_CONTACT');
            message = 'Are you sure you want to delete this contact?';
        } else {
            title = $translate.instant('DELETE_CONTACTS');
            message = 'Are you sure you want to delete contacts?';
        }

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    _.forEach(contactsSelected, function(contact) {
                        var idx = contacts.indexOf(contact);
                        if (idx >= 0) {
                            contact.$delete();
                            contacts.splice(idx, 1);
                            Contact.index.updateWith($scope.contacts);
                        }
                    });
                    confirmModal.deactivate();
                    notify($translate.instant('CONTACTS_DELETED'));
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.deleteContact = function(contact) {
        var title = $translate.instant('DELETE_CONTACT');

        confirmModal.activate({
            params: {
                title: title,
                message: 'Are you sure you want to delete this contact?<br /><strong>' + contact.ContactEmail + '</strong>',
                confirm: function() {
                    var idx = contacts.indexOf(contact);
                    if (idx >= 0) {
                        contact.$delete();
                        contacts.splice(idx, 1);
                        Contact.index.updateWith($scope.contacts);
                        confirmModal.deactivate();
                        notify($translate.instant('CONTACT_DELETED'));
                    }
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.addContact = function() {
        openContactModal('Add New Contact', '', '', function(name, email) {
            var newContact = {
                ContactName: name,
                ContactEmail: email
            };
            var contact = new Contact(newContact);

            networkActivityTracker.track(contact.$save(null, function(obj) {
                _.extend(contact, newContact, _.pick(obj, 'ContactID'));
            }).then(function(response) {
                contacts.unshift(contact);
                Contact.index.add([contact]);
                contactModal.deactivate();
                notify($translate.instant('CONTACT_ADDED'));
            }, function(response) {
                notify(response.error);
                $log.error(response);
            }));
        });
    };

    $scope.editContact = function(contact) {
        openContactModal('Edit Contact', contact.ContactName, contact.ContactEmail, function(name, email) {
            contact.ContactName = name;
            contact.ContactEmail = email;
            networkActivityTracker.track(contact.$update().then(function(response) {
                contactModal.deactivate();
                notify($translate.instant('CONTACT_EDITED'));
            }, function(response) {
                notify({
                    message: response.error
                });
                $log.error(response);
            }));
        });
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

    $scope.onSelectContact = function(event, contact) {
        var contactsSelected = $scope.contactsSelected();

        if (event.shiftKey) {
            var start = $scope.contacts.indexOf(_.first(contactsSelected));
            var end = $scope.contacts.indexOf(_.last(contactsSelected));

            for (var i = start; i < end; i++) {
                $scope.contacts[i].selected = true;
            }
        }
    };

    $scope.contactsSelected = function() {
        return _.filter($scope.contacts, function(contact) {
            return contact.selected === true;
        });
    };

    $scope.sendMessageTo = function(contact) {
        var message = new Message();

        _.defaults(message, {
            RecipientList: contact.ContactEmail,
            CCList: '',
            BCCList: '',
            MessageTitle: '',
            PasswordHint: '',
            Attachments: []
        });

        $rootScope.$broadcast('loadMessage', message);
    };

    $scope.uploadContacts = function() {
        dropzoneModal.activate({
            params: {
                title: 'Upload Contacts',
                message: 'Allowed format(s): <code>.vcf, .csv</code><a class="pull-right" href="/blog/exporting-contacts" target="_blank">Need help?</a>',
                import: function(files) {
                    // TODO
                    console.log(files);
                    dropzoneModal.deactivate();
                    notify($translate.instant('CONTACTS_UPLOADED'));
                },
                cancel: function() {
                    dropzoneModal.deactivate();
                }
            }
        });
    };

    $scope.downloadContacts = function() {
        // TODO
    };
});

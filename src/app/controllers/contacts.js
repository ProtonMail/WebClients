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

    $scope.contacts = contacts.Contacts;
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

    $scope.deleteContacts = function(contact) {
        var contactsSelected = contact ? [contact] : $scope.contactsSelected();
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
                    deletedIDs = [];
                    deletedContacts = [];
                    _.forEach(contactsSelected, function(contact) {
                        deletedIDs.push(contact.ID.toString());
                        deletedContacts.push(contact);
                    });

                    $scope.contacts = _.difference($scope.contacts, deletedContacts);

                    networkActivityTracker.track(
                        Contact.delete({
                            "IDs" : deletedIDs
                        }).$promise.then(function(response) {
                            _.forEach(response, function(d, i) {
                                if (JSON.parse(d.Response).Code !== 1000) {
                                    notify(deletedContacts[i].Email +' Not Deleted');
                                    $scope.contacts.push(deletedContacts[i]);
                                }
                            });
                            notify($translate.instant('CONTACTS_DELETED'));
                        }, function(response) {
                            $log.error(response);
                        })
                    );
                    confirmModal.deactivate();
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.addContact = function() {
        openContactModal('Add New Contact', '', '', function(name, email) {
            var match = _.findWhere($scope.contacts, {Email: email});

            if (match) {
                notify("Contact exists for this email address");
                contactModal.deactivate();
            }
            else {
                var newContact = {
                    Name: name,
                    Email: email
                };
                var contactList = [];
                contactList.push(newContact);
                networkActivityTracker.track(
                    Contact.save({
                        Contacts : contactList
                    }).$promise.then(function(response) {
                        if (response[0].Response.Contact) {
                            $scope.contacts.push(response[0].Response.Contact);
                            notify('Saved');
                        }
                        else {
                            notify(response[0].Response.Error);
                        }
                        contactModal.deactivate();
                    }, function(response) {
                        $log.error(response);
                    })
                );
            }
        });
    };

    $scope.editContact = function(contact) {
        openContactModal('Edit Contact', contact.Name, contact.Email, function(name, email) {
            contact.Name = name;
            contact.Email = email;
            networkActivityTracker.track(
                Contact.edit({
                    "Name": name,
                    "Email": email,
                    "id": contact.ID
                }).$promise.then(function(response) {
                        contactModal.deactivate();
                        notify($translate.instant('CONTACT_EDITED'));
                    }, function(response) {
                        notify({
                            message: response.error
                        });
                        $log.error(response);
                    })
            );
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
            ToList: [{Address: contact.ContactEmail}],
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
                    var contactArray = [];
                    var extension = files[0].name.slice(-4);

                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var text = unescape(encodeURIComponent(reader.result));

                        if (extension === '.vcf') {

                              var vcardData = vCard.parse(text);

                              _.forEach(vcardData, function(d, i) {
                                  if (d.fn && d.email) {
                                      contactArray.push({'ContactName' : d.fn.value, 'ContactEmail' : d.email.value});
                                  }
                                  else if(d.email) {
                                      contactArray.push({'ContactName' : d.email.value, 'ContactEmail' : d.email.value});
                                  }
                              });

                              importContacts(contactArray);
                        }
                        else if(extension === '.csv') {
                            Papa.parse(text, {
                            	complete: function(results) {
                                    var csv = results.data;
                                    var nameKeys = ['Name', 'First Name'];
                                    var emailKeys = ['E-mail 1 - Value', 'E-mail Address', 'Email Address', 'E-mail', 'Email'];

                                    nameKey = _.find(nameKeys, function(d, i) {
                                        return csv[0].indexOf(d) > -1;
                                    });

                                    emailKey = _.find(emailKeys, function(d, i) {
                                        return csv[0].indexOf(d) > -1;
                                    });

                                    nameIndex = csv[0].indexOf(nameKey);
                                    emailIndex = csv[0].indexOf(emailKey);
                                    lastNameIndex = (nameKey === 'First Name' ? csv[0].indexOf('Last Name') : undefined);
                                    _.forEach(csv, function(d, i) {
                                      if (i > 0 && typeof(d[emailIndex]) !== 'undefined' && d[emailIndex] !== '') {
                                        if (d[nameIndex] !== '') {
                                          contactArray.push({'Name' : d[nameIndex], 'Email' : d[emailIndex]});
                                        }
                                        else {
                                          contactArray.push({'Name' : d[emailIndex], 'Email' : d[emailIndex]});
                                        }
                                      }
                                    });

                                    importContacts(contactArray);
                            	}
                            });
                        }
                        else {
                            notify('Invalid file type');
                        }
                    };

                    reader.readAsBinaryString(files[0]);

                    importContacts = function(contactArray) {
                        networkActivityTracker.track(
                            Contact.save({
                                "Contacts": contactArray
                            }).$promise.then(function(response) {
                                added = 0;
                                duplicates = 0;
                                _.forEach(response, function(d) {
                                    if (d.Response.Contact) {
                                        $scope.contacts.push(d.Response.Contact);
                                        added++;
                                    }
                                    else {
                                        duplicates++;
                                    }
                                });
                                added = added === 1 ? added + ' contact' : added + ' contacts';
                                duplicates = duplicates === 1 ? duplicates + ' contact was' : duplicates + ' contacts were';
                                notify(added + ' imported, ' + duplicates + ' already in your contact list');
                            }, function(response) {
                                $log.error(response);
                            })
                        );
                    };

                    dropzoneModal.deactivate();
                },
                cancel: function() {
                    dropzoneModal.deactivate();
                }
            }
        });
    };

    $scope.downloadContacts = function() {
        var contactsArray = [['Name', 'Email']];
        var csvRows = [];

        _.forEach($scope.contacts, function(contact) {
          contactsArray.push([contact.Name, contact.Email]);
        });

        for(var i=0, l=contactsArray.length; i<l; ++i){
            csvRows.push(contactsArray[i].join(','));
        }

        var csvString = csvRows.join("%0A");
        var a         = document.createElement('a');
        a.href        = 'data:attachment/csv,' + csvString;
        a.target      = '_blank';
        a.download    = 'contacts.csv';

        document.body.appendChild(a);
        a.click();
    };
});

angular.module("proton.controllers.Contacts", [
    "proton.modals"
])

.controller("ContactsController", function(
    $rootScope,
    $scope,
    $state,
    $log,
    $translate,
    $stateParams,
    $filter,
    tools,
    authentication,
    contacts,
    Contact,
    confirmModal,
    contactModal,
    dropzoneModal,
    Message,
    networkActivityTracker,
    notify
) {
    $scope.params = {
        searchContactInput: ''
    };

    $rootScope.pageName = "Contacts";
    authentication.user.Contacts = contacts.data.Contacts;
    $scope.editing = false;
    $scope.currentPage = 1;
    $scope.numPerPage = 40;
    $scope.sortBy = 'Name';

    $scope.contactsFiltered = function(searching) {
        var contacts = authentication.user.Contacts;

        function pagination(contacts) {
            var begin, end;

            begin = ($scope.currentPage - 1) * $scope.numPerPage;
            end = begin + $scope.numPerPage;

            return contacts.slice(begin, end);
        }

        function orderBy(contacts) {
            var result = $filter('orderBy')(contacts, $scope.sortBy);

            $scope.totalItems = result.length;

            return result;
        }

        function search(contacts) {
            var byName = $filter('filter')(contacts, {Name: $scope.params.searchContactInput});
            var byEmail = $filter('filter')(contacts, {Email: $scope.params.searchContactInput});

            return _.union(byName, byEmail);
        }

        if(searching === true) {
            $scope.currentPage = 1;
        }

        return pagination(orderBy(search(authentication.user.Contacts)));
    };

    $scope.contacts = $scope.contactsFiltered();

    $scope.$on('updateContacts', function() {$scope.updateContacts();});
    $scope.updateContacts = function (){
        $scope.contacts = $scope.contactsFiltered();
    };

    $scope.refreshContacts = function(searching) {
        $scope.contacts = $scope.contactsFiltered(searching);
    };

    $scope.setSortBy = function(sort) {
        $scope.sortBy = sort;
        $scope.refreshContacts();
    };

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

    $scope.deleteAllContacts = function() {
        var title = $translate.instant('DELETE_ALL_CONTACTS');
        var message = 'Are you sure you want to delete all the contacts?';

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    authentication.user.Contacts = [];
                    $scope.contacts = $scope.contactsFiltered();

                    networkActivityTracker.track(
                        Contact.clear().then(function(response) {
                            notify($translate.instant('CONTACTS_DELETED'));
                            Contact.index.updateWith($scope.contacts);
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

    $scope.deleteContacts = function(contact) {
        var contactsSelected = contact ? [contact] : $scope.contactsSelected();
        var message, title;

        if (contactsSelected.length === 1) {
            title = $translate.instant('DELETE_CONTACT');
            message = 'Are you sure you want to delete this contact?';
        } else {
            title = $translate.instant('DELETE_CONTACTS');
            message = 'Are you sure you want to delete contacts selected?';
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

                    authentication.user.Contacts = _.difference(authentication.user.Contacts, deletedContacts);
                    $scope.contacts = $scope.contactsFiltered();

                    networkActivityTracker.track(
                        Contact.delete({
                            "IDs" : deletedIDs
                        }).then(function(response) {
                            _.forEach(response.data.Responses, function(d, i) {
                                if(d.Response.Code !== 1000) {
                                    notify(deletedContacts[i].Email +' Not Deleted');
                                    authentication.user.Contacts.push(deletedContacts[i]);
                                }
                            });
                            notify($translate.instant('CONTACTS_DELETED'));
                            Contact.index.updateWith($scope.contacts);
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
            var match = _.findWhere(authentication.user.Contacts, {Email: email});

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
                    }).then(function(response) {
                        if(response.data.Code === 1001) {
                            authentication.user.Contacts.push(response.data.Responses[0].Response.Contact);
                            $scope.contacts = $scope.contactsFiltered();
                            notify($translate.instant('CONTACT_ADDED'));
                            contactModal.deactivate();
                            Contact.index.updateWith(authentication.user.Contacts);
                        } else {
                            notify(response.data.Responses[0].Error);
                        }
                    }, function(response) {
                        $log.error(response);
                    })
                );
            }
        });
    };

    $scope.editContact = function(contact) {
        openContactModal('Edit Contact', contact.Name, contact.Email, function(name, email) {
            var match = _.findWhere(authentication.user.Contacts, {Email: email});

            if (match && email !== contact.Email) {
                notify("Contact exists for this email address");
                contactModal.deactivate();
            }
            else {
                contact.Name = name;
                contact.Email = email;
                networkActivityTracker.track(
                    Contact.edit({
                        "Name": name,
                        "Email": email,
                        "id": contact.ID
                    }).then(function(response) {
                            if(response.data.Code === 1000) {
                                contactModal.deactivate();
                                notify($translate.instant('CONTACT_EDITED'));
                                Contact.index.updateWith(authentication.user.Contacts);
                            } else {
                                notify(response.data.Response[0].Error);
                            }
                        }, function(response) {
                            notify('Error');
                            $log.error(response);
                        })
                );
            }

        });
    };

    $scope.onSelectContact = function(event, contact) {
        var contactsSelected = $scope.contactsSelected();

        if (event.shiftKey) {
            var start = authentication.user.Contacts.indexOf(_.first(contactsSelected));
            var end = authentication.user.Contacts.indexOf(_.last(contactsSelected));

            for (var i = start; i < end; i++) {
                authentication.user.Contacts[i].selected = true;
            }
        }
    };

    $scope.contactsSelected = function() {
        return _.filter(authentication.user.Contacts, function(contact) {
            return contact.selected === true;
        });
    };

    $scope.sendMessageTo = function(contact) {
        var message = new Message();

        _.defaults(message, {
            ToList: [{Address: contact.Email, Name: contact.Name}],
            CCList: [],
            BCCList: [],
            Subject: '',
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
                                      contactArray.push({'Name' : d.fn.value, 'Email' : d.email.value});
                                  }
                                  else if(d.email) {
                                      contactArray.push({'Name' : d.email.value, 'Email' : d.email.value});
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
                            }).then(function(response) {
                                added = 0;
                                duplicates = 0;
                                _.forEach(response.data.Responses, function(d) {
                                    if (d.Response.Contact) {
                                        authentication.user.Contacts.push(d.Response.Contact);
                                        added++;
                                    }
                                    else {
                                        duplicates++;
                                    }
                                });
                                added = added === 1 ? added + ' contact' : added + ' contacts';
                                duplicates = duplicates === 1 ? duplicates + ' contact was' : duplicates + ' contacts were';
                                notify(added + ' imported, ' + duplicates + ' already in your contact list');
                                $scope.contacts = $scope.contactsFiltered();
                                Contact.index.updateWith(authentication.user.Contacts);
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

    $scope.openSafariWarning = function() {
        $('#safariContactsModal').modal('show');
    };

    $scope.downloadContacts = function() {
        if (tools.getBrowser==='Safari') {
            $scope.openSafariWarning();
        } else {
            var contactsArray = [['Name', 'Email']];
            var csvRows = [];
            var filename = 'contacts.csv';

            _.forEach(authentication.user.Contacts, function(contact) {
                contactsArray.push([contact.Name, contact.Email]);
            });

            for(var i=0, l=contactsArray.length; i<l; ++i){
                csvRows.push(contactsArray[i].join(','));
            }

            var csvString = csvRows.join("%0A");

            if (tools.getBrowser==='Safari') {
                $scope.openSafariWarning();
            }

            var blob = new Blob([csvString], { type: 'data:attachment/csv;' });

            saveAs(blob, filename);
        }

    };
});

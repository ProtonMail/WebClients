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
    alertModal,
    dropzoneModal,
    Message,
    networkActivityTracker,
    notify
) {
    // Variables
    $scope.params = { searchContactInput: '', currentPage: 1 };
    $rootScope.pageName = 'Contacts';
    authentication.user.Contacts = contacts.data.Contacts;
    $scope.editing = false;
    $scope.numPerPage = 40;
    $scope.sortBy = 'Name';

    // Listeners
    $scope.$on('updateContacts', $scope.updateContacts);

    // Methods
    $scope.initialization = function() {
        $scope.contacts = $scope.contactsFiltered();
    };

    $scope.contactsFiltered = function(searching) {
        var contacts = authentication.user.Contacts;

        function pagination(contacts) {
            var begin, end;

            begin = ($scope.params.currentPage - 1) * $scope.numPerPage;
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
            $scope.params.currentPage = 1;
        }

        return pagination(orderBy(search(authentication.user.Contacts)));
    };

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
        var message = 'Are you sure you want to delete all your contacts?'; // TODO translate

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    authentication.user.Contacts = [];
                    $scope.contacts = $scope.contactsFiltered();

                    networkActivityTracker.track(
                        Contact.clear().then(function(response) {
                            notify({message: $translate.instant('CONTACTS_DELETED'), classes: 'notification-success'});
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
            message = 'Are you sure you want to delete this contact?'; // TODO translate
        } else {
            title = $translate.instant('DELETE_CONTACTS');
            message = 'Are you sure you want to delete the selected contacts?'; // TODO translate
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
                                    notify({message: deletedContacts[i].Email + ' ' + $translate.instant('NOT_DELETED'), classes: 'notification-danger'});
                                    authentication.user.Contacts.push(deletedContacts[i]);
                                }
                            });
                            notify({message: $translate.instant('CONTACTS_DELETED'), classes: 'notification-success'});
                            confirmModal.deactivate();
                            Contact.index.updateWith($scope.contacts);
                        }, function(error) {
                            notify({message: error, classes: 'notification-danger'});
                            $log.error(error);
                        })
                    );
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.addContact = function() {
        openContactModal($translate.instant('ADD_NEW_CONTACT'), '', '', function(name, email) {
            var match = _.findWhere(authentication.user.Contacts, {Email: email});

            if (match) {
                notify("Contact exists for this email address"); // TODO translate
                contactModal.deactivate();
            } else {
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
                            notify({message: $translate.instant('CONTACT_ADDED'), classes: 'notification-success'});
                            Contact.index.updateWith(authentication.user.Contacts);
                            contactModal.deactivate();
                        } else {
                            notify({message: response.data.Responses[0].Error, classes: 'notification-danger'});
                            $log.error(response);
                        }
                    }, function(error) {
                        notify({message: error, classes: 'notification-danger'});
                        $log.error(error);
                    })
                );
            }
        });
    };

    $scope.editContact = function(contact) {
        openContactModal($translate.instant('EDIT_CONTACT'), contact.Name, contact.Email, function(name, email) {
            var match = _.findWhere(authentication.user.Contacts, {Email: email});

            if (match && email !== contact.Email) {
                notify({message: "Contact exists for this email address", classes: 'notification-danger'}); // TODO translate
                contactModal.deactivate();
            } else {
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
                            notify({message: $translate.instant('CONTACT_EDITED'), classes: 'notification-success'});
                            Contact.index.updateWith(authentication.user.Contacts);
                        } else {
                            notify({message: response.data.Error, classes: 'notification-danger'});
                        }
                    }, function(response) {
                        notify({message: response, classes: 'notification-danger'});
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

    $scope.composeContacts = function() {
        var contactsSelected = $scope.contactsSelected();
        var message = new Message();
        var ToList = [];

        _.each(contactsSelected, function(contact) {
            ToList.push({
                Address: contact.Email,
                Name: contact.Name
            });
        });

        _.defaults(message, {
            ToList: ToList,
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
                title: $translate.instant('UPLOAD_CONTACTS'),
                message: 'Allowed formats (UTF-8 encoding): <code>.vcf, .csv</code><a class="pull-right" href="/blog/exporting-contacts" target="_blank">Need help?</a>',
                import: function(files) {
                    var contactArray = [];
                    var extension = '';
                    var reader = new FileReader();

                    if( angular.isUndefined(files) || files.length === 0 ) {
                        notify({message: $translate.instant('NO_FILE'), classes: 'notification-danger'}); //TODO translate
                        return;
                    }

                    extension = files[0].name.slice(-4);

                    reader.onload = function(e) {
                        var text = reader.result;

                        if(extension === '.vcf') {
                            var vcardData = vCard.parse(text);

                            _.forEach(vcardData, function(d, i) {
                                if (d.fn && d.email) {
                                    contactArray.push({'Name' : String(d.fn.value), 'Email' : String(d.email.value)});
                                } else if(d.email) {
                                    contactArray.push({'Name' : String(d.email.value), 'Email' : String(d.email.value)});
                                }
                            });

                            importContacts(contactArray);
                        } else if(extension === '.csv') {
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
                                                var name = String(d[nameIndex]);
                                                if ( lastNameIndex !== undefined ) {
                                                    name = name + ' ' + String(d[lastNameIndex]);
                                                }
                                                contactArray.push({'Name' : name, 'Email' : String(d[emailIndex])});
                                            } else {
                                                contactArray.push({'Name' : String(d[emailIndex]), 'Email' : String(d[emailIndex])});
                                            }
                                        }
                                    });

                                    importContacts(contactArray);
                                }
                            });
                        } else {
                            notify({message: $translate.instant('INVALID_FILE_TYPE'), classes: 'notification-danger'});
                        }
                    };

                    reader.readAsText(files[0], 'utf-8');

                    importContacts = function(contactArray) {
                        networkActivityTracker.track(
                            Contact.save({
                                "Contacts": contactArray
                            }).then(function(response) {
                                var added = 0;
                                var errors = [];

                                _.forEach(response.data.Responses, function(d) {
                                    if (d.Response.Contact) {
                                        authentication.user.Contacts.push(d.Response.Contact);
                                        added++;
                                    } else if(angular.isDefined(d.Response.Error) && angular.isDefined(d.Response.Code)) {
                                        errors[d.Response.Code] = d.Response.Error;
                                    }
                                });

                                if(added === 1) {
                                    notify({message: added + ' ' + $translate.instant('CONTACT_IMPORTED'), classes: 'notification-success'});
                                } else if(added > 1) {
                                    notify({message: added + ' ' + $translate.instant('CONTACTS_IMPORTED'), classes: 'notification-success'});
                                }

                                _.each(Object.keys(errors), function(key) {
                                    notify({message: errors[key], classes: 'notification-danger'});
                                });

                                $scope.contacts = $scope.contactsFiltered();
                                Contact.index.updateWith(authentication.user.Contacts);
                            }, function(error) {
                                $log.error(error);
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
        alertModal.activate({
            params: {
                title: $translate.instant('DOWNLOAD_CONTACTS'),
                alert: 'alert-warning',
                message: 'Safari does not fully support downloading contacts.<br /><br />Please login with a different browser to download contacts.', // TODO translate
                ok: function() {
                    alertModal.deactivate();
                }
            }
        });
    };

    $scope.downloadContacts = function() {
        if (tools.getBrowser() === 'Safari') {
            $scope.openSafariWarning();
        } else {
            var contactsArray = [['Name', 'Email']];
            var csvRows = [];
            var filename = 'contacts.csv';

            _.forEach(authentication.user.Contacts, function(contact) {
                contactsArray.push([contact.Name, contact.Email]);
            });

            for(var i=0, l=contactsArray.length; i<l; ++i) {
                csvRows.push(contactsArray[i].join(','));
            }

            var csvString = csvRows.join("%0A");
            var blob = new Blob([csvString], { type: 'data:attachment/csv;' });

            saveAs(blob, filename);
        }
    };

    $scope.initialization();
});

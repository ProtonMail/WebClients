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
    Contact,
    confirmModal,
    contactModal,
    alertModal,
    dropzoneModal,
    eventManager,
    Message,
    networkActivityTracker,
    notify
) {
    // Variables
    var lastChecked = null;

    $rootScope.pageName = 'Contacts';
    $scope.currentPage = 1;
    $scope.params = { searchContactInput: ''};
    $scope.editing = false;
    $scope.numPerPage = 40;
    $scope.sortBy = 'Name';

    // Listeners
    $scope.$on('deleteContact', function(event, ID) {
        $scope.updateContacts();
    });

    $scope.$on('createContact', function(event, ID, contact) {
        $scope.updateContacts();
    });

    $scope.$on('updateContact', function(event, ID, contact) {
        $scope.updateContacts();
    });

    $scope.$on('searchContacts', function(event, keyword) {
        $scope.params.searchContactInput = keyword;
        $scope.refreshContacts(true);
    });

    // Methods
    $scope.initialization = function() {
        $scope.updateContacts();
    };

    $scope.contactsFiltered = function(searching) {
        var contacts = authentication.user.Contacts;
        var pagination = function (contacts) {
            var begin, end;

            begin = ($scope.currentPage - 1) * $scope.numPerPage;
            end = begin + $scope.numPerPage;

            return contacts.slice(begin, end);
        };

        var orderBy = function(contacts) {
            var result = $filter('orderBy')(contacts, $scope.sortBy);

            $scope.totalItems = result.length;

            return result;
        };

        var search = function(contacts) {
            var byName = $filter('filter')(contacts, {Name: $scope.params.searchContactInput});
            var byEmail = $filter('filter')(contacts, {Email: $scope.params.searchContactInput});

            return _.union(byName, byEmail);
        };

        if (searching === true) {
            $scope.currentPage = 1;
        }

        return pagination(orderBy(search(contacts)));
    };

    $scope.updateContacts = function() {
        $scope.contacts = $scope.contactsFiltered();
    };

    $scope.selectPage = function(page) {
        $scope.currentPage = page;
        $scope.refreshContacts();
    };

    $scope.refreshContacts = function(searching) {
        $scope.contacts = $scope.contactsFiltered(searching);
    };

    $scope.setSortBy = function(sort) {
        if($scope.sortBy.charAt(0) !== '-') {
            sort = '-' + sort;
        }

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
                    networkActivityTracker.track(
                        Contact.clear().then(function(response) {
                            notify({message: $translate.instant('CONTACTS_DELETED'), classes: 'notification-success'});
                            eventManager.call();
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
            message = 'Are you sure you want to delete the selected contacts?';
        }

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    var deletedIDs = [];
                    var deletedContacts = [];

                    _.forEach(contactsSelected, function(contact) {
                        deletedIDs.push(contact.ID.toString());
                        deletedContacts.push(contact);
                    });

                    networkActivityTracker.track(
                        Contact.delete({
                            IDs : deletedIDs
                        }).then(function(response) {
                            notify({message: $translate.instant('CONTACTS_DELETED'), classes: 'notification-success'});
                            confirmModal.deactivate();
                            eventManager.call();
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
                            notify({message: $translate.instant('CONTACT_ADDED'), classes: 'notification-success'});
                            contactModal.deactivate();
                            eventManager.call();
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
            networkActivityTracker.track(
                Contact.edit({
                    id: contact.ID,
                    Name: name,
                    Email: email
                }).then(function(response) {
                    if(response.data.Code === 1000) {
                        contactModal.deactivate();
                        notify({message: $translate.instant('CONTACT_EDITED'), classes: 'notification-success'});
                        eventManager.call();
                    } else {
                        notify({message: response.data.Error, classes: 'notification-danger'});
                    }
                }, function(response) {
                    notify({message: response, classes: 'notification-danger'});
                    $log.error(response);
                })
            );
        });
    };

    $scope.onSelectContact = function(event, contact) {
        if (!lastChecked) {
            lastChecked = contact;
        } else {
            if (event.shiftKey) {
                var start = _.indexOf($scope.contacts, contact);
                var end = _.indexOf($scope.contacts, lastChecked);

                _.each($scope.contacts.slice(Math.min(start, end), Math.max(start, end) + 1), function(contact) {
                    contact.selected = lastChecked.selected;
                });
            }

            lastChecked = contact;
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
                message: 'Allowed formats (UTF-8 encoding): <code>.vcf, .csv</code><a class="pull-right" href="https://protonmail.com/support/knowledge-base/adding-contacts/" target="_blank">Need help?</a>',
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

    /**
     * Open modal to alert the user that he cannot download
     */
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

            var escape_for_csv = function(str) {

                var escape = false;
                if ( str.indexOf(',') !== -1 || str.indexOf('\n') !== -1 ) {
                    escape = true;
                }
                if ( str.indexOf('"') !== -1 ) {
                    str = str.replace(/"/g,'""');
                    escape = true;
                }

                if ( escape ) {
                    str = '"'+str+'"';
                }

                return str;
            };

            _.forEach(authentication.user.Contacts, function(contact) {
                contactsArray.push([escape_for_csv(contact.Name), escape_for_csv(contact.Email)]);
            });

            for(var i=0, l=contactsArray.length; i<l; ++i) {
                csvRows.push(contactsArray[i].join(','));
            }

            var csvString = csvRows.join("\n");
            var blob = new Blob([csvString], { type: 'data:attachment/csv;' });

            saveAs(blob, filename);
        }
    };

    $scope.initialization();
});

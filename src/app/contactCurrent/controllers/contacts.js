angular.module('proton.contactCurrent')
.controller('ContactsController', (
    $filter,
    $log,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    alertModal,
    authentication,
    confirmModal,
    CONSTANTS,
    Contact,
    contactModal,
    dropzoneModal,
    eventManager,
    gettextCatalog,
    Message,
    networkActivityTracker,
    notify) => {
    // Variables
    let lastChecked = null;

    $scope.currentPage = 1;
    $scope.params = { searchContactInput: '' };
    $scope.editing = false;
    $scope.numPerPage = CONSTANTS.ELEMENTS_PER_PAGE;
    $scope.sortBy = 'Name';
    $scope.isSafari = jQuery.browser.name === 'safari';

    // Listeners
    $scope.$on('deleteContact', () => {
        $scope.updateContacts();
    });

    $scope.$on('createContact', () => {
        $scope.updateContacts();
    });

    $scope.$on('updateContact', () => {
        $scope.updateContacts();
    });

    $scope.$on('updateContacts', () => {
        $scope.updateContacts();
    });

    $scope.$on('searchContacts', (event, keyword) => {
        $scope.params.searchContactInput = keyword;
        $scope.refreshContacts(true);
    });

    // Methods
    $scope.initialization = () => {
        $scope.updateContacts();
    };

    $scope.contactsFiltered = (searching) => {
        const contacts = authentication.user.Contacts;
        const pagination = (contacts) => {
            const begin = ($scope.currentPage - 1) * $scope.numPerPage;
            const end = begin + $scope.numPerPage;

            return contacts.slice(begin, end);
        };

        const orderBy = (contacts) => {
            const result = $filter('orderBy')(contacts, $scope.sortBy);

            $scope.totalItems = result.length;

            return result;
        };

        const search = (contacts) => {
            const byName = $filter('filter')(contacts, { Name: $scope.params.searchContactInput });
            const byEmail = $filter('filter')(contacts, { Email: $scope.params.searchContactInput });

            return _.union(byName, byEmail);
        };

        if (searching === true) {
            $scope.currentPage = 1;
        }

        return pagination(orderBy(search(contacts)));
    };

    $scope.updateContacts = () => {
        $scope.contacts = $scope.contactsFiltered();
    };

    $scope.selectPage = (page) => {
        $scope.currentPage = page;
        $scope.refreshContacts();
    };

    $scope.refreshContacts = (searching) => {
        $scope.contacts = $scope.contactsFiltered(searching);
    };

    $scope.setSortBy = (sort) => {
        const sortBy = ($scope.sortBy.charAt(0) !== '-') ? ('-' + sort) : sort;
        $scope.sortBy = sortBy;
        $scope.refreshContacts();
    };

    function openContactModal(title, name, email, save) {
        contactModal.activate({
            params: {
                title,
                name,
                email,
                save,
                cancel() {
                    contactModal.deactivate();
                }
            }
        });
    }

    $scope.deleteAllContacts = () => {
        const title = gettextCatalog.getString('Delete all', null, 'Title');
        const message = gettextCatalog.getString('Are you sure you want to delete all your contacts?', null, 'Info');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Contact.clear().then(() => {
                            notify({ message: gettextCatalog.getString('Contacts deleted', null, 'Info'), classes: 'notification-success' });
                            eventManager.call();
                        }, (response) => {
                            $log.error(response);
                        })
                    );
                    confirmModal.deactivate();
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.deleteContact = (contact) => {
        const contactsSelected = contact ? [contact] : $scope.contactsSelected();
        let message;
        let title;

        if (contactsSelected.length === 1) {
            title = gettextCatalog.getString('Delete', null, 'Title');
            message = 'Are you sure you want to delete this contact?';
        } else {
            title = gettextCatalog.getString('Delete', null, 'Title');
            message = 'Are you sure you want to delete the selected contacts?';
        }

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const deletedIDs = [];
                    const deletedContacts = [];

                    _.forEach(contactsSelected, (contact) => {
                        deletedIDs.push(contact.ID.toString());
                        deletedContacts.push(contact);
                    });

                    networkActivityTracker.track(
                        Contact.delete({
                            IDs: deletedIDs
                        }).then(() => {
                            notify({ message: gettextCatalog.getString('Contacts deleted', null, 'Info'), classes: 'notification-success' });
                            confirmModal.deactivate();
                            eventManager.call();
                        }, (error) => {
                            notify({ message: error, classes: 'notification-danger' });
                            $log.error(error);
                        })
                    );
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    $scope.addContact = () => {
        openContactModal(gettextCatalog.getString('Add new contact', null, 'Action'), '', '', (name, email) => {
            const match = _.findWhere(authentication.user.Contacts, { Email: email });

            if (match) {
                notify({ message: gettextCatalog.getString('A contact already exists for this email address', null), classes: 'notification-danger' });
                contactModal.deactivate();
            } else {
                const newContact = {
                    Name: DOMPurify.sanitize(name),
                    Email: DOMPurify.sanitize(email)
                };
                const contactList = [];
                contactList.push(newContact);
                networkActivityTracker.track(
                    Contact.save({
                        Contacts: contactList
                    }).then((response) => {
                        if (response.data.Code === 1001) {
                            notify({ message: gettextCatalog.getString('Contact added', null), classes: 'notification-success' });
                            contactModal.deactivate();
                            eventManager.call();
                        } else {
                            notify({ message: response.data.Responses[0].Error, classes: 'notification-danger' });
                            $log.error(response);
                        }
                    }, (error) => {
                        notify({ message: error, classes: 'notification-danger' });
                        $log.error(error);
                    })
                );
            }
        });
    };

    $scope.editContact = (contact) => {
        openContactModal(gettextCatalog.getString('Edit', null, 'Action'), contact.Name, contact.Email, (name, email) => {
            networkActivityTracker.track(
                Contact.edit({
                    id: contact.ID,
                    Name: name,
                    Email: email
                }).then((response) => {
                    if (response.data.Code === 1000) {
                        contactModal.deactivate();
                        notify({ message: gettextCatalog.getString('Contact edited', null), classes: 'notification-success' });
                        eventManager.call();
                    } else {
                        notify({ message: response.data.Error, classes: 'notification-danger' });
                    }
                }, (response) => {
                    notify({ message: response, classes: 'notification-danger' });
                    $log.error(response);
                })
            );
        });
    };

    $scope.onSelectContact = (event, contact) => {
        if (!lastChecked) {
            lastChecked = contact;
        } else {
            if (event.shiftKey) {
                const start = _.indexOf($scope.contacts, contact);
                const end = _.indexOf($scope.contacts, lastChecked);

                _.each($scope.contacts.slice(Math.min(start, end), Math.max(start, end) + 1), (contact) => {
                    contact.selected = lastChecked.selected;
                });
            }

            lastChecked = contact;
        }
    };

    $scope.contactsSelected = () => {
        return _.filter(authentication.user.Contacts, (contact) => {
            return contact.selected === true;
        });
    };

    $scope.sendMessageTo = (contact) => {
        const message = new Message();

        message.ToList = [{ Address: contact.Email, Name: contact.Name }];

        $rootScope.$emit('composer.new', { message, type: 'new' });
    };

    $scope.composeContacts = () => {
        const contactsSelected = $scope.contactsSelected();
        const message = new Message();

        message.ToList = contactsSelected.map(({ Email, Name }) => ({ Address: Email, Name }));
        $rootScope.$emit('composer.new', { message, type: 'new' });
    };

    $scope.uploadContacts = () => {
        dropzoneModal.activate({
            params: {
                import(files) {
                    const contactArray = [];
                    let extension = '';
                    const reader = new FileReader();
                    let importContacts;

                    if (angular.isUndefined(files) || files.length === 0) {
                        notify({ message: gettextCatalog.getString('No files were selected', null, 'Error'), classes: 'notification-danger' }); // TODO translate
                        return;
                    }

                    extension = files[0].name.slice(-4);

                    reader.onload = () => {
                        const text = reader.result;

                        if (extension === '.vcf') {
                            const vcardData = vCard.parse(text);

                            _.forEach(vcardData, (d) => {
                                if (d.fn && d.email) {
                                    contactArray.push({ Name: String(d.fn.value), Email: String(d.email.value) });
                                } else if (d.email) {
                                    contactArray.push({ Name: String(d.email.value), Email: String(d.email.value) });
                                }
                            });

                            importContacts(contactArray);
                        } else if (extension === '.csv') {
                            Papa.parse(text, {
                                complete(results) {
                                    const csv = results.data;
                                    const nameKeys = ['Name', 'First Name'];
                                    const emailKeys = ['E-mail 1 - Value', 'E-mail Address', 'Email Address', 'E-mail', 'Email'];

                                    const nameKey = _.find(nameKeys, (d) => {
                                        return csv[0].indexOf(d) > -1;
                                    });

                                    const emailKey = _.find(emailKeys, (d) => {
                                        return csv[0].indexOf(d) > -1;
                                    });

                                    const nameIndex = csv[0].indexOf(nameKey);
                                    const emailIndex = csv[0].indexOf(emailKey);
                                    const lastNameIndex = (nameKey === 'First Name' ? csv[0].indexOf('Last Name') : undefined);

                                    _.forEach(csv, (d, i) => {
                                        if (i > 0 && typeof (d[emailIndex]) !== 'undefined' && d[emailIndex] !== '') {
                                            if (d[nameIndex] !== '') {
                                                let name = String(d[nameIndex]);
                                                if (lastNameIndex !== undefined) {
                                                    name = name + ' ' + String(d[lastNameIndex]);
                                                }
                                                contactArray.push({ Name: name, Email: String(d[emailIndex]) });
                                            } else {
                                                contactArray.push({ Name: String(d[emailIndex]), Email: String(d[emailIndex]) });
                                            }
                                        }
                                    });

                                    importContacts(contactArray);
                                }
                            });
                        } else {
                            notify({ message: gettextCatalog.getString('Invalid file type', null, 'Error'), classes: 'notification-danger' });
                        }
                    };

                    reader.readAsText(files[0], 'utf-8');

                    importContacts = (contactArray) => {
                        networkActivityTracker.track(
                            Contact.save({ Contacts: contactArray })
                            .then((result) => {
                                let added = 0;
                                const errors = [];

                                _.forEach(result.data.Responses, (response) => {
                                    if (response.Response.Code === 1000) {
                                        added++;
                                        authentication.user.Contacts.push(response.Response.Contact);
                                    } else if (angular.isDefined(response.Response.Error)) {
                                        errors[response.Response.Code] = response.Response.Error;
                                    }
                                });

                                if (added === 1) {
                                    notify({ message: added + ' ' + gettextCatalog.getString('Contact imported', null, 'Info'), classes: 'notification-success' });
                                } else if (added > 1) {
                                    notify({ message: added + ' ' + gettextCatalog.getString('Contacts imported', null, 'Info'), classes: 'notification-success' });
                                }

                                _.each(Object.keys(errors), (key) => {
                                    notify({ message: errors[key], classes: 'notification-danger' });
                                });

                                $scope.contacts = $scope.contactsFiltered();
                            }, (error) => {
                                $log.error(error);
                            })
                        );
                    };

                    dropzoneModal.deactivate();
                },
                cancel() {
                    dropzoneModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to alert the user that he cannot download
     */
    $scope.openSafariWarning = () => {
        alertModal.activate({
            params: {
                title: gettextCatalog.getString('Download', null, 'Title'),
                alert: 'alert-warning',
                message: gettextCatalog.getString('Safari does not fully support downloading contacts.<br /><br />Please login with a different browser to download contacts.', null, 'Error', 'Info'),
                ok() {
                    alertModal.deactivate();
                }
            }
        });
    };

    $scope.downloadContacts = () => {
        const contactsArray = [['Name', 'Email']];
        const csvRows = [];
        const filename = 'contacts.csv';

        const escapeForCSV = (str) => {
            let result = str;
            let escape = false;

            if (str.indexOf(',') !== -1 || str.indexOf('\n') !== -1) {
                escape = true;
            }
            if (str.indexOf('"') !== -1) {
                result = str.replace(/"/g, '""');
                escape = true;
            }

            if (escape) {
                result = '"' + str + '"';
            }

            return result;
        };

        _.forEach(authentication.user.Contacts, (contact) => {
            contactsArray.push([escapeForCSV(contact.Name), escapeForCSV(contact.Email)]);
        });

        for (let i = 0, l = contactsArray.length; i < l; ++i) {
            csvRows.push(contactsArray[i].join(','));
        }

        const csvString = csvRows.join('\n');
        const blob = new Blob([csvString], { type: 'data:attachment/csv;' });

        window.saveAs(blob, filename);
    };

    $scope.initialization();
});

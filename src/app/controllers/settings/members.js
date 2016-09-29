angular.module('proton.controllers.Settings')

.controller('MembersController', function(
    $rootScope,
    $scope,
    $state,
    $stateParams,
    Address,
    authentication,
    confirmModal,
    domains,
    eventManager,
    gettextCatalog,
    Member,
    memberModal,
    members,
    networkActivityTracker,
    notify,
    organization,
    Organization,
    organizationKeys,
    storageModal
) {
    var MASTER = 2;
    var SUB = 1;
    var NORMAL = 0;

    $scope.roles = [
        {label: gettextCatalog.getString('Master', null), value: MASTER},
        {label: gettextCatalog.getString('Sub', null), value: SUB}
    ];

    // Listeners
    $scope.$on('deleteDomain', function(event, domainId) {
        var index = _.findIndex($scope.domains, {ID: domainId});

        if (index !== -1) {
            $scope.domains.splice(index, 1);
        }
    });

    $scope.$on('createDomain', function(event, domainId, domain) {
        var index = _.findIndex($scope.domains, {ID: domainId});

        if (index === -1) {
            $scope.domains.push(domain);
        } else {
            _.extend($scope.domains[index], domain);
        }
    });

    $scope.$on('updateDomain', function(event, domainId, domain) {
        var index = _.findIndex($scope.domains, {ID: domainId});

        if (index === -1) {
            $scope.domains.push(domain);
        } else {
            _.extend($scope.domains[index], domain);
        }
    });

    $rootScope.$on('deleteMember', function(event, memberId) {
        var index = _.findIndex($scope.members, {ID: memberId});

        if (index !== -1) {
            $scope.members.splice(index, 1);
        }
    });

    $rootScope.$on('createMember', function(event, memberId, member) {
        var index = _.findIndex($scope.members, {ID: memberId});

        if (index === -1) {
            $scope.members.push(member);
        } else {
            _.extend($scope.members[index], member);
        }
    });

    $rootScope.$on('updateMember', function(event, memberId, member) {
        var index = _.findIndex($scope.members, {ID: memberId});

        if (index === -1) {
            $scope.members.push(member);
        } else {
            _.extend($scope.members[index], member);
        }
    });

    $scope.initialization = function() {
        if (members.data && members.data.Code === 1000) {
            $scope.members = members.data.Members;
        }

        if (domains.data && domains.data.Code === 1000) {
            $scope.domains = domains.data.Domains;
        }

        if (organization.data && organization.data.Code === 1000) {
            $scope.organization = organization.data.Organization;
        }

        if (organizationKeys.data && organizationKeys.data.Code === 1000) {
            $scope.organizationPublicKey = organizationKeys.data.PublicKey;
            $scope.organizationPrivateKey = organizationKeys.data.PrivateKey;
        }

        switch ($stateParams.action) {
            case 'new':
                $scope.add();
                break;
            case 'edit':
                var member = _.findWhere($scope.members, {ID: $stateParams.id});

                $scope.edit(member);
                break;
            default:
                break;
        }
    };

    /**
     * We check if domains are verified
     * @return {Boolean}
     */
    $scope.checkDomains = function() {
        var verified = false;

        if (angular.isArray($scope.domains)) {
            _.each($scope.domains, function(domain) {
                if (domain.State === 1) {
                    verified = true;
                }
            });
        }

        return verified;
    };

    /**
     * Initialize select value with role user
     */
    $scope.initRole = function(member) {
        var role = _.findWhere($scope.roles, {value: member.Role});

        if(angular.isDefined(role)) {
            member.selectRole = role;
        }
    };

    /**
     * Inform the back-end to change member role
     * @param {Object} member
     */
    $scope.changeRole = function(member) {
        var params = { Role: member.selectRole.value };

        if (member.selectRole.value === MASTER) {
            params.PrivateKey = $scope.organizationPrivateKey;
        }

        Member.role(member.ID, params).then(function(result) { // TODO check request
            if(result.data && result.data.Code === 1000) {
                notify({message: gettextCatalog.getString('Role updated', null), classes: 'notification-success'});
            } else if(result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger'});
        });
    };

    /**
     * Save the organization name
     */
    $scope.saveOrganizationName = function() {
        Organization.update({ DisplayName: $scope.organization.DisplayName })
        .then(function(result) {
            if (result.data && result.data.Code === 1000) {
                notify({message: gettextCatalog.getString('Organization updated', null), classes: 'notification-success'});
            } else if(result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            } else {
                notify({message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger'});
            }
        }, function(error) {
            notify({message: gettextCatalog.getString('Error during updating', null, 'Error'), classes: 'notification-danger'});
        });
    };

    /**
     * Unlink address
     * @param {Object} member
     * @param {Object} address
     */
    $scope.unlinkAddress = function(member, address) {
        var title = gettextCatalog.getString('Unlink address', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to unlink this address?', null, 'Info');

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    Address.disable(address.ID).then(function(result) {
                        if (result.data && result.data) {
                            address.Status = 0;
                            confirmModal.deactivate();
                            notify({message: gettextCatalog.getString('Address disabled', null, 'Info'), classes: 'notification-success'});
                        }
                    });
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to fix keys
     * @param {Object} address
     */
    $scope.generate = function(address) {
        var title = gettextCatalog.getString('Generate key pair', null, 'Title');
        var message = gettextCatalog.getString('Generate key pair', null, 'Info');

        generateModal.activate({
            params: {
                title: title,
                message: message,
                addresses: [address],
                password: authentication.getPassword(),
                close: function(success) {
                    if (success) {
                        eventManager.call();
                    }

                    generateModal.deactivate();
                }
            }
        });
    };

    /**
     * Switch a specific member to private
     * @param {Object} member
     */
    $scope.makePrivate = function(member) {
        var title = gettextCatalog.getString('Make Private', null);
        var message = gettextCatalog.getString('TODO', null);
        var success = gettextCatalog.getString('Status Updated', null);
        var mailboxPassword = authentication.getPassword();

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(
                        Member.private(member.ID, {Password: mailboxPassword})
                        .then(function(result) {
                            if (result.data && result.data.Code === 1000) {
                                member.Private = 1;
                                notify({message: success, classes: 'notification-success'});
                                confirmModal.deactivate();
                            } else if (result.data && result.data.Error) {
                                notify({message: result.data.Error, classes: 'notification-danger'});
                            }
                        })
                    );
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Allow the current user to access to the mailbox of a specific member
     * @param {Object} member
     */
    $scope.readMail = function(member) {
        var mailboxPassword = authentication.getPassword();

        Member.authenticate(member.ID, {Password: mailboxPassword})
        .then(function(result) {
            if (result.data && result.data.Code === 1000) {
                var sessionToken = result.data.SessionToken;
                var url = window.location.href;
                var arr = url.split('/');
                var domain = arr[0] + '//' + arr[2];
                var tab = $state.href('login', {sub: true}, {absolute: true});
                var send = function(event) {
                    if (event.origin !== domain) { return; }
                    if (event.data === 'ready') {
                        // Send the session token and the organization owner’s mailbox password to the target URI
                        event.source.postMessage({ SessionToken: sessionToken, MailboxPassword: mailboxPassword }, domain);
                        window.removeEventListener('message', send);
                    }
                };
                // Listen message from the future child
                window.addEventListener('message', send, false);
                // Open new tab
                window.open(tab, '_blank');
            } else if (result.data && result.data.Error) {
                notify({message: result.data.Error, classes: 'notification-danger'});
            }
        });
    };

    /**
     * Open a modal to create a new member
     */
    $scope.add = function() {
        $scope.edit();
    };

    /**
     * Display a modal to edit a member
     * @param {Object} member
     */
    $scope.edit = function(member) {
        memberModal.activate({
            params: {
                member: member,
                organization: $scope.organization,
                organizationPublicKey: $scope.organizationPublicKey,
                domains: $scope.domains,
                cancel: function(member) {
                    if (angular.isDefined(member)) {
                        $scope.members.push(member);
                    }

                    memberModal.deactivate();
                }
            }
        });
    };

    /**
     * Remove member
     * @param {Object} member
     */
    $scope.remove = function(member) {
        var title = gettextCatalog.getString('Remove member', null, 'Title');
        var message = gettextCatalog.getString('Are you sure you want to remove this member?', null, "Info");
        var index = $scope.members.indexOf(member);

        confirmModal.activate({
            params: {
                title: title,
                message: message,
                confirm: function() {
                    networkActivityTracker.track(Member.delete(member.ID).then(function(result) {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {
                            $scope.members.splice(index, 1); // Remove member in the members list
                            confirmModal.deactivate(); // Close the modal
                            notify({message: gettextCatalog.getString('Member removed', null), classes: 'notification-success'}); // Display notification
                        } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger'});
                        }
                    }, function() {
                        notify({message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to manage member's storage
     * @param {Object} member
     */
    $scope.manageStorage = function(member) {
        storageModal.activate({
            params: {
                member: member,
                organization: $scope.organization,
                submit: function(space) {
                    networkActivityTracker.track(Member.quota(member.ID, space).then(function(result) {
                        if (result.data && result.data.Code === 1000) {
                            eventManager.call();
                            storageModal.deactivate();
                            notify({message: gettextCatalog.getString('Quota updated', null), classes: 'notification-success'});
                        } else if (result.data && result.data.Error) {
                            notify({message: result.data.Error, classes: 'notification-danger'});
                        } else {
                            notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger'});
                        }
                    }, function(error) {
                        notify({message: gettextCatalog.getString('Unable to save your changes, please try again.', null, 'Error'), classes: 'notification-danger'});
                    }));
                },
                cancel: function() {
                    storageModal.deactivate();
                }
            }
        });
    };

    // Call initialization
    $scope.initialization();
});

angular.module('proton.settings')
.controller('MembersController', (
    $controller,
    $rootScope,
    $scope,
    $state,
    $stateParams,
    $timeout,
    Address,
    activateOrganizationModal,
    authentication,
    changePasswordModal,
    confirmModal,
    CONSTANTS,
    domains,
    eventManager,
    generateOrganizationModal,
    gettextCatalog,
    loginPasswordModal,
    Member,
    memberModal,
    members,
    networkActivityTracker,
    notify,
    organization,
    Organization,
    organizationKeys,
    passwords,
    pmcw,
    setupOrganizationModal,
    User
) => {

    $controller('AddressesController', { $scope, authentication, domains, members, organization, organizationKeys, pmcw });

    const MASTER = 2;
    const SUB = 1;

    function passwordModal(submit) {
        loginPasswordModal.activate({
            params: {
                submit,
                cancel: () => {
                    loginPasswordModal.deactivate();
                },
                hasTwoFactor: authentication.user.TwoFactor
            }
        });
    }

    $scope.roles = [];
    $scope.roles[MASTER] = gettextCatalog.getString('Admin', null);
    $scope.roles[SUB] = gettextCatalog.getString('Member', null);

    $scope.initialization = () => {

        $scope.newRecoveryPassword = '';
        $scope.confirmRecoveryPassword = '';

        switch ($stateParams.action) {
            case 'new':
                $scope.addMember();
                break;
            case 'edit':
                $scope.editMember(_.findWhere($scope.members, { ID: $stateParams.id }));
                break;
            default:
                break;
        }
    };

    /**
     * We check if domains are verified
     * @return {Boolean}
     */
    $scope.checkDomains = () => {
        let verified = false;

        if (angular.isArray($scope.domains)) {
            _.each($scope.domains, (domain) => {
                if (domain.State === 1) {
                    verified = true;
                }
            });
        }

        return verified;
    };

    /**
     * Inform the back-end to change member role
     * @param {Object} member
     */
    $scope.changeRole = (member, role) => {
        const payload = { Role: role };
        const isSubscriber = member.Subscriber === 1;

        let message;

        if (role === MASTER) {
            message = gettextCatalog.getString('You must provide this member with the Organization Password in order to fully activate administrator privileges.', null, 'Info');
        } else if (isSubscriber) {
            message = gettextCatalog.getString('This member is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.', null, 'Info');
        } else {
            message = gettextCatalog.getString('Are you sure you want to remove administrative privileges from this member? You will become responsible for any unpaid invoices belonging to this member.', null, 'Info');
        }

        const params = {
            title: gettextCatalog.getString('Change Role', null, 'Error'),
            message,
            confirm() {
                networkActivityTracker.track(
                    Member.role(member.ID, payload).then(({ data }) => { // TODO check request
                        if (data && data.Code === 1000) {
                            notify({ message: gettextCatalog.getString('Role updated', null), classes: 'notification-success' });

                            member.Role = payload.Role;
                            $scope.initRole(member);

                            confirmModal.deactivate();
                        } else if (data && data.Error) {
                            notify({ message: data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Error updating role', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Error updating role', null, 'Error'), classes: 'notification-danger' });
                    })
                );
            },
            cancel() {
                confirmModal.deactivate();
            }
        };

        confirmModal.activate({ params });
    };

    /**
     * Save the organization name
     */
    $scope.saveOrganizationName = () => {
        Organization.updateOrganizationName({ DisplayName: $scope.organization.DisplayName })
        .then((result) => {
            if (result.data && result.data.Code === 1000) {
                notify({ message: gettextCatalog.getString('Organization updated', null), classes: 'notification-success' });
            } else if (result.data && result.data.Error) {
                notify({ message: result.data.Error, classes: 'notification-danger' });

            } else {
                notify({ message: gettextCatalog.getString('Error updating organization name', null, 'Error'), classes: 'notification-danger' });
            }
        }, () => {
            notify({ message: gettextCatalog.getString('Error updating organization name', null, 'Error'), classes: 'notification-danger' });
        });
    };

    /**
     * Switch a specific member to private
     * @param {Object} member
     */
    $scope.makePrivate = (member) => {
        const title = gettextCatalog.getString('Privatize Member', null);
        const message = gettextCatalog.getString("Organization administrators will no longer be able to log in and control the member's account after privatization. This change is PERMANENT.", null);
        const success = gettextCatalog.getString('Status Updated', null);

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(
                        Member.privatize(member.ID)
                        .then((result) => {
                            if (result.data && result.data.Code === 1000) {
                                member.Private = 1;
                                notify({ message: success, classes: 'notification-success' });
                                confirmModal.deactivate();
                            } else if (result.data && result.data.Error) {
                                notify({ message: result.data.Error, classes: 'notification-danger' });
                            }
                        })
                    );
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    function canLogin() {
        if ($scope.keyStatus > 0 && CONSTANTS.KEY_PHASE > 3) {
            notify({ message: gettextCatalog.getString('Permission denied, administrator privileges have been restricted.', null, 'Error'), classes: 'notification-danger' });
            $state.go('secured.members');
            return false;
        }
        return true;
    }

    /**
     * Allow the current user to access to the mailbox of a specific member
     * @param {Object} member
     */
    $scope.login = (member) => {
        if (!canLogin()) {
            return;
        }

        function submit(currentPassword, twoFactorCode) {

            loginPasswordModal.deactivate();

            const mailboxPassword = authentication.getPassword();

            const arr = window.location.href.split('/');
            const domain = arr[0] + '//' + arr[2];
            const tab = $state.href('login.sub', { sub: true }, { absolute: true });

            let ready = false;
            const receive = (event) => {
                if (event.origin !== domain) { return; }
                if (event.data === 'ready') {
                    ready = true;
                    window.removeEventListener('message', receive);
                }
            };

            // Listen message from the future child
            window.addEventListener('message', receive, false);

            // Open new tab
            const child = window.open(tab, '_blank');

            networkActivityTracker.track(
                Member.authenticate(member.ID, { Password: currentPassword, TwoFactorCode: twoFactorCode })
                .then((result) => {
                    const sessionToken = result.data.SessionToken;

                    const cb = () => {
                        if (ready) {
                            // Send the session token and the organization owner’s mailbox password to the target URI
                            child.postMessage({ SessionToken: sessionToken, MailboxPassword: mailboxPassword }, domain);
                        } else {
                            $timeout(cb, 500, false);
                        }
                    };

                    cb();
                },
                (error) => {
                    child.close();
                    notify({ message: error.error_description, classes: 'notification-danger' });
                })
            )
            .catch(() => {
                // Nothing
            });
        }

        passwordModal(submit);
    };

    /**
     * Open a modal to create a new member
     */
    $scope.addMember = () => {
        if (!$scope.canAddMember()) {
            return;
        }

        $scope.editMember();
    };

    /**
     * Display a modal to edit a member
     * @param {Object} member
     */
    $scope.editMember = (member) => {
        memberModal.activate({
            params: {
                member,
                organization: $scope.organization,
                organizationKey: $scope.organizationKey,
                domains: $scope.domains,
                submit(member) {
                    const index = _.findIndex($scope.members, { ID: member.ID });

                    if (index === -1) {
                        $scope.members.push(member);
                        $scope.organization.UsedMembers++;
                        $scope.organization.UsedAddresses++;
                    } else {
                        _.extend($scope.members[index], member);
                    }

                    memberModal.deactivate();
                },
                cancel() {
                    memberModal.deactivate();
                }
            }
        });
    };

    /**
     * Remove member
     * @param {Object} member
     */
    $scope.removeMember = (member, remove = true) => {

        const title = remove ? gettextCatalog.getString('Remove member', null, 'Title') : gettextCatalog.getString('Delete member', null, 'Title');
        const message = remove ? gettextCatalog.getString('Are you sure you want to permanently remove this member from your organization? They will lose access to any addresses belonging to your organization.', null, 'Info') : gettextCatalog.getString('Are you sure you want to permanently delete this member? The member\'s inbox and all addresses associated with this member will be deleted.', null, 'Info');
        const index = $scope.members.indexOf(member);

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    networkActivityTracker.track(Member.delete(member.ID).then((result) => {
                        if (angular.isDefined(result.data) && result.data.Code === 1000) {

                            // Local changes
                            $scope.members.splice(index, 1); // Remove member in the members list
                            $scope.organization.UsedMembers--;
                            $scope.organization.UsedAddresses -= member.Addresses.filter((address) => address.Type !== 0).length;

                            // Event loop
                            eventManager.call();

                            confirmModal.deactivate(); // Close the modal
                            notify({ message: gettextCatalog.getString('Member removed', null), classes: 'notification-success' }); // Display notification
                        } else if (angular.isDefined(result.data) && angular.isDefined(result.data.Error)) {
                            notify({ message: result.data.Error, classes: 'notification-danger' });
                        } else {
                            notify({ message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger' });
                        }
                    }, () => {
                        notify({ message: gettextCatalog.getString('Error during deletion', null, 'Error'), classes: 'notification-danger' });
                    }));
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Open modal to change the organization password
     */
    $scope.changeOrganizationPassword = () => {
        function modal(creds) {
            changePasswordModal.activate({
                params: {
                    phase: 0,
                    type: 'organization',
                    organizationKey: $scope.organizationKey,
                    creds,
                    close() {
                        changePasswordModal.deactivate();
                    }
                }
            });
        }
        function submit(currentPassword, twoFactorCode) {
            const creds = { Password: currentPassword, TwoFactorCode: twoFactorCode };
            loginPasswordModal.deactivate();
            modal(creds);
        }
        passwordModal(submit);
    };

    /**
     * Enable multi-member support for Visionary or Business account
     */
    $scope.enableMemberSupport = () => {
        function submit() {
            const selfMember = _.findWhere($scope.members, { Self: 1 });
            const memberID = selfMember.ID;
            const space = $scope.organization.MaxSpace - $scope.organization.AssignedSpace;

            setupOrganizationModal.activate({
                params: {
                    memberID,
                    space,
                    close() {
                        User.lock()
                        .then(() => setupOrganizationModal.deactivate());
                    }
                }
            });
        }

        if ($scope.organization.MaxMembers === 1) {
            notify(gettextCatalog.getString('Please upgrade to a Visionary or Business account for multi-member support.', null));
        } else if ($scope.organization.MaxMembers > 1) {
            passwordModal(submit);
        }
    };

    // Call initialization
    $scope.initialization();
});

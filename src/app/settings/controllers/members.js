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
    eventManager,
    generateOrganizationModal,
    changeOrganizationPassword,
    changeOrganizationPasswordModal,
    gettextCatalog,
    domainModel,
    loginPasswordModal,
    memberApi,
    memberModal,
    networkActivityTracker,
    notify,
    organizationApi,
    passwords,
    pmcw,
    setupOrganizationModal,
    User
) => {
    $controller('SignaturesController', { $scope, authentication, pmcw });

    function passwordModal(submit) {
        loginPasswordModal.activate({
            params: {
                submit,
                cancel: () => {
                    loginPasswordModal.deactivate();
                }
            }
        });
    }

    function scrollToUsers() {
        $('.settings').animate({
            scrollTop: $('#settingsMembers').offset().top
        }, 1000);
    }

    $scope.roles = [];
    $scope.roles[CONSTANTS.PAID_ADMIN_ROLE] = gettextCatalog.getString('Admin', null);
    $scope.roles[CONSTANTS.PAID_MEMBER_ROLE] = gettextCatalog.getString('Member', null);

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
            case 'scroll':
                scrollToUsers();
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
        const domains = domainModel.get();
        const verifiedDomains = _.filter(domains, ({ State }) => State); // State value can be 1 (verified) or 2 (dns issue)
        return verifiedDomains.length > 0;
    };

    /**
     * Inform the back-end to change member role
     * @param {Object} member
     */
    $scope.changeRole = (member, role) => {
        const payload = { Role: role };
        const isSubscriber = member.Subscriber === 1;

        let message;

        if (role === CONSTANTS.PAID_ADMIN_ROLE) {
            message = gettextCatalog.getString('You must provide this member with the Organization Password in order to fully activate administrator privileges.', null, 'Info');
        } else if (isSubscriber) {
            message = gettextCatalog.getString('This member is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.', null, 'Info');
        } else {
            message = gettextCatalog.getString('Are you sure you want to remove administrative privileges from this member?', null, 'Info');
        }

        const params = {
            title: gettextCatalog.getString('Change Role', null, 'Error'),
            message,
            confirm() {
                const promise = memberApi.role(member.ID, payload)
                .then(({ data = {} } = {}) => {
                    if (data.Code === 1000) {
                        return Promise.resolve();
                    }
                    throw new Error(data.Error || gettextCatalog.getString('Error updating role', null, 'Error'));
                })
                .then(() => eventManager.call())
                .then(() => {
                    notify({ message: gettextCatalog.getString('Role updated', null), classes: 'notification-success' });
                    confirmModal.deactivate();
                });

                networkActivityTracker.track(promise);
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
        const errorMessage = gettextCatalog.getString('Error updating organization name', null, 'Error');
        const promise = organizationApi.updateOrganizationName({ DisplayName: $scope.organization.DisplayName })
        .then(({ data = {} } = {}) => {
            if (data.Code === 1000) {
                notify({ message: gettextCatalog.getString('Organization updated', null), classes: 'notification-success' });
            } else {
                throw new Error(data.Error || errorMessage);
            }
        });
        networkActivityTracker.track(promise);
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
                        memberApi.privatize(member.ID)
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
                memberApi.authenticate(member.ID, { Password: currentPassword, TwoFactorCode: twoFactorCode })
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
        const params = {
            member,
            organizationKey: $scope.organizationKey,
            domains: $scope.domains,
            submit() {
                memberModal.deactivate();
            },
            cancel() {
                memberModal.deactivate();
            }
        };
        memberModal.activate({ params });
    };

    /**
     * Remove member
     * @param {Object} member
     */
    $scope.removeMember = (member, remove = true) => {
        const title = remove ? gettextCatalog.getString('Remove user', null, 'Title') : gettextCatalog.getString('Delete user', null, 'Title');
        const message = remove ? gettextCatalog.getString('Are you sure you want to permanently remove this user from your organization? They will lose access to any addresses belonging to your organization.', null, 'Info') : gettextCatalog.getString('Are you sure you want to permanently delete this user? The user\'s inbox and all addresses associated with this member will be deleted.', null, 'Info');
        const successMessage = gettextCatalog.getString('User removed', null, 'Info');
        const errorMessage = gettextCatalog.getString('Error during deletion', null, 'Error');

        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = memberApi.delete(member.ID)
                    .then(({ data = {} } = {}) => {
                        if (data.Code === 1000) {
                            return Promise.resolve();
                        }
                        throw new Error(data.Error || errorMessage);
                    })
                    .then(() => eventManager.call())
                    .then(() => {
                        confirmModal.deactivate();
                        notify({ message: successMessage, classes: 'notification-success' });
                    });
                    networkActivityTracker.track(promise);
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
        changeOrganizationPasswordModal.activate({
            params: {
                close(newPassword) {
                    changeOrganizationPasswordModal.deactivate();
                    if (newPassword) {
                        passwordModal((Password, TwoFactorCode) => {
                            const creds = { Password, TwoFactorCode };
                            const { organizationKey } = $scope;
                            const promise = changeOrganizationPassword({ newPassword, creds, organizationKey })
                            .then(() => {
                                notify({ message: gettextCatalog.getString('Password updated', null), classes: 'notification-success' });
                                loginPasswordModal.deactivate();
                            });
                            networkActivityTracker.track(promise);
                        });
                    }
                }
            }
        });
    };

    /**
     * Enable multi-user support for Visionary or Business account
     */
    $scope.enableMemberSupport = () => {
        function modal(creds) {
            const selfMember = _.findWhere($scope.members, { Self: 1 });
            const memberID = selfMember.ID;

            setupOrganizationModal.activate({
                params: {
                    creds,
                    memberID,
                    close() {
                        const promise = User.lock()
                        .then(() => eventManager.call())
                        .then(() => setupOrganizationModal.deactivate());
                        networkActivityTracker.track(promise);
                    }
                }
            });
        }

        function submit(currentPassword, twoFactorCode) {
            const promise = User.password({ Password: currentPassword, TwoFactorCode: twoFactorCode })
            .then((result) => {
                const { data } = result;
                if (data.Error) {
                    return Promise.reject(data.Error);
                }
                return Promise.resolve(result);
            })
            .then(() => {
                loginPasswordModal.deactivate();
                modal();
            });
            networkActivityTracker.track(promise);
        }

        if ($scope.organization.MaxMembers === 1) {
            notify(gettextCatalog.getString('Please upgrade to a Visionary or Business account for multi-user support.', null));
        } else if ($scope.organization.MaxMembers > 1) {
            passwordModal(submit);
        }
    };

    // Call initialization
    $scope.initialization();
});

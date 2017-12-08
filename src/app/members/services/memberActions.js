/* @ngInject */
function memberActions(
    $rootScope,
    addressModel,
    authentication,
    confirmModal,
    CONSTANTS,
    domainModel,
    eventManager,
    gettextCatalog,
    loginPasswordModal,
    memberModal,
    memberModel,
    memberSubLogin,
    membersValidator,
    networkActivityTracker,
    notification,
    organizationKeysModel,
    organizationModel,
    setupOrganizationModal,
    User
) {
    const I18N = {
        PM_ME: {
            paid() {
                return gettextCatalog.getString(
                    'You can now send and receive email from your new {{name}}@pm.me address!',
                    { name: authentication.user.Name },
                    'Success notification for paid user after @pm.me generation'
                );
            },
            free() {
                return gettextCatalog.getString(
                    'You can now receive email from your new {{name}}@pm.me address! To send from it, please upgrade to a paid ProtonMail plan',
                    { name: authentication.user.Name },
                    'Success notification for free user after @pm.me generation'
                );
            }
        },
        CHANGE_ROLE: {
            default: {
                title: gettextCatalog.getString('Change Role', null, 'Title'),
                message: gettextCatalog.getString('Are you sure you want to remove administrative privileges from this user?', null, 'Info')
            },
            isPaidAdmin: {
                message: gettextCatalog.getString(
                    'You must provide this user with the Organization Password in order to fully activate administrator privileges.',
                    null,
                    'Info'
                )
            },
            isSubscriber: {
                message: gettextCatalog.getString(
                    'This user is currently responsible for payments for your organization. By demoting this member, you will become responsible for payments for your organization.',
                    null,
                    'Info'
                )
            }
        },
        MAKE_PRIVATE: {
            title: gettextCatalog.getString('Privatize User', null, 'Title'),
            message: gettextCatalog.getString(
                "Organization administrators will no longer be able to log in and control the user's account after privatization. This change is PERMANENT.",
                null,
                'Info'
            )
        },
        ACTION_REMOVE: {
            title: gettextCatalog.getString('Remove user', null, 'Title'),
            message: gettextCatalog.getString(
                'Are you sure you want to permanently remove this user from your organization? They will lose access to any addresses belonging to your organization.',
                null,
                'Info'
            )
        },
        ACTION_DELETE: {
            title: gettextCatalog.getString('Delete user', null, 'Title'),
            message: gettextCatalog.getString(
                'Are you sure you want to permanently delete this user? The inbox and all addresses associated with this user will be deleted.',
                null,
                'Info'
            )
        },
        SUCCESS_REMOVE: gettextCatalog.getString('User removed', null, 'Info'),
        SUCCESS_CHANGE_ROLE: gettextCatalog.getString('Role updated', null, 'Info'),
        SUCCESS_CHANGE_STATUS: gettextCatalog.getString('Status Updated', null, 'Info'),
        PLEASE_UPGRADE: gettextCatalog.getString(
            'Please upgrade to a Professional plan with more than 1 user, or a Visionary account, to get multi-user support.',
            null,
            'Info'
        )
    };

    const edit = (member) => {
        const params = {
            member,
            organizationKey: organizationKeysModel.get('organizationKey'),
            domains: domainModel.query(),
            submit() {
                memberModal.deactivate();
            },
            cancel() {
                memberModal.deactivate();
            }
        };
        memberModal.activate({ params });
    };

    const add = () => {
        if (membersValidator.canAdd(organizationKeysModel.get('keyStatus'))) {
            edit();
        }
    };

    const removeAction = ({ title, message }, remove = true) => (member) => {
        console.debug('@todo fix remove arg', remove);
        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = memberModel
                        .remove(member)
                        .then(eventManager.call)
                        .then(() => {
                            confirmModal.deactivate();
                            notification.success(I18N.SUCCESS_REMOVE);
                        });
                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    const destroy = removeAction(I18N.ACTION_DELETE, false);
    const remove = removeAction(I18N.ACTION_REMOVE);

    const getChangeRoleModalI18N = (member, role) => {
        const isSubscriber = member.Subscriber === 1 && 'isSubscriber';
        const isPaidAdmin = role === CONSTANTS.PAID_ADMIN_ROLE && 'isPaidAdmin';
        return _.extend({}, I18N.CHANGE_ROLE.default, I18N.CHANGE_ROLE[isPaidAdmin || isSubscriber]);
    };

    const changeRole = (Role) => (member) => {
        const { title, message } = getChangeRoleModalI18N(member, Role);
        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = memberModel
                        .changeRole(member, { Role })
                        .then(eventManager.call)
                        .then(() => {
                            notification.success(I18N.SUCCESS_CHANGE_ROLE);
                            confirmModal.deactivate();
                        });

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    const makeAdmin = changeRole(2);
    const revokeAdmin = changeRole(1);

    const makePrivate = (member) => {
        const { title, message } = I18N.MAKE_PRIVATE;
        confirmModal.activate({
            params: {
                title,
                message,
                confirm() {
                    const promise = memberModel.makePrivate(member).then(() => {
                        member.Private = 1;
                        notification.success(I18N.SUCCESS_CHANGE_STATUS);
                        confirmModal.deactivate();
                    });
                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    const modalSetupOrga = () => {
        const { ID: memberID } = memberModel.getSelf();

        setupOrganizationModal.activate({
            params: {
                memberID,
                close() {
                    const promise = User.lock()
                        .then(eventManager.call)
                        .then(setupOrganizationModal.deactivate);
                    networkActivityTracker.track(promise);
                }
            }
        });
    };

    /**
     * Open the password modal to unlock the next process
     * @param  {submit} {Function}
     */
    const passwordModal = (cb = angular.noop) => {
        loginPasswordModal.activate({
            params: {
                submit(password, twoFactorCode) {
                    loginPasswordModal.deactivate();
                    cb(password, twoFactorCode);
                },
                cancel() {
                    loginPasswordModal.deactivate();
                }
            }
        });
    };

    /**
     * Enable multi-user support for Visionary or Business account
     */
    const enableSupport = () => {
        const { MaxMembers } = organizationModel.get() || {};

        if (MaxMembers === 1) {
            return notification.info(I18N.PLEASE_UPGRADE);
        }

        passwordModal((Password, TwoFactorCode) => {
            const promise = User.password({ Password, TwoFactorCode })
                .then(({ data = {} }) => {
                    if (data.Error) {
                        throw new Error(data.Error);
                    }
                    return data;
                })
                .then(modalSetupOrga);

            networkActivityTracker.track(promise);
        });
    };

    /**
     * Unlock the session to add the @pm.me address
     * @return {[type]} [description]
     */
    const generatePmMe = () => {
        const success = I18N.PM_ME[authentication.hasPaidMail() ? 'paid' : 'free']();

        passwordModal((Password, TwoFactorCode) => {
            const promise = User.unlock({ Password, TwoFactorCode })
                .then(addressModel.generatePmMe)
                .then(User.lock)
                .then(() => notification.success(success));

            networkActivityTracker.track(promise);
        });
    };

    const login = memberSubLogin.login;

    return {
        add,
        edit,
        destroy,
        remove,
        login,
        makeAdmin,
        revokeAdmin,
        makePrivate,
        enableSupport,
        generatePmMe
    };
}
export default memberActions;

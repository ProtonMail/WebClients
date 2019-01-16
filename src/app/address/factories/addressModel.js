import _ from 'lodash';

import { DEFAULT_ENCRYPTION_CONFIG, PAID_ADMIN_ROLE, FREE_USER_ROLE } from '../../constants';

/* @ngInject */
function addressModel(
    $state,
    gettextCatalog,
    networkActivityTracker,
    addressesModel,
    notification,
    organizationModel,
    organizationKeysModel,
    generateKeyModel,
    pmDomainModel,
    domainModel,
    memberModel,
    addressModal,
    membersValidator,
    memberModal,
    eventManager,
    confirmModal,
    Address,
    authentication,
    addressWithoutKeysManager,
    dispatchers
) {
    const { dispatcher } = dispatchers(['addressModel', 'memberActions']);

    const I18N = {
        ERROR_DO_UPGRADE: gettextCatalog.getString(
            'You have used all addresses in your plan. Please upgrade your plan to add a new address',
            null,
            'Error'
        ),
        ERROR_MUST_BE_ADMIN: gettextCatalog.getString('Administrator privileges must be activated', null, 'Error'),
        SUCCESS_DISABLED: gettextCatalog.getString('Address disabled', null, 'Info'),
        SUCCESS_ENABLE: gettextCatalog.getString('Address enabled', null, 'Info'),
        SUCCESS_REMOVE: gettextCatalog.getString('Address deleted', null, 'Info'),
        SUCCESS_EDIT: gettextCatalog.getString('Address updated', null, 'Info'),
        SUCCESS_ORDER: gettextCatalog.getString('Order saved', null, 'Info'),
        DISABLE_MODAL: {
            title: gettextCatalog.getString('Disable address', null, 'Title'),
            message: gettextCatalog.getString('Are you sure you want to disable this address?', null, 'Info')
        },
        DELETE_MODAL: {
            title: gettextCatalog.getString('Delete address', null, 'Title'),
            message: gettextCatalog.getString('Are you sure you want to delete this address?', null, 'Info')
        },
        EDIT_MODAL: {
            title: gettextCatalog.getString('Name / Signature', null, 'Title')
        },
        FREE_ADD_ERROR: gettextCatalog.getString(
            'Please <a href="/dashboard">upgrade</a> to a paid account to use this feature',
            null,
            'Error'
        )
    };

    const canAdd = (member = {}, redirect = true) => {
        const { MaxAddresses, UsedAddresses, HasKeys } = organizationModel.get() || {};

        if (MaxAddresses - UsedAddresses < 1) {
            notification.error(I18N.ERROR_DO_UPGRADE);
            return false;
        }

        // A private member is able to activate the key later
        if (HasKeys === 1 && organizationKeysModel.get('keyStatus') > 0 && !member.Private) {
            notification.error(I18N.ERROR_MUST_BE_ADMIN);
            redirect && $state.go('secured.members');
            return false;
        }

        return true;
    };

    const formatDomains = (domain, member) => {
        const config = {
            pmDomains: [],
            domains: [domain],
            members: [member]
        };

        if (member.Type === 0) {
            config.pmDomains = pmDomainModel.get().map((DomainName) => ({ DomainName }));
        }

        !domain.ID && (config.domains = config.pmDomains.concat(domainModel.query()));
        !member.ID && (config.members = memberModel.getAll());
        return config;
    };

    const add = (domain = {}, member = {}) => {
        if (authentication.user.Role === FREE_USER_ROLE) {
            return notification.error(I18N.FREE_ADD_ERROR);
        }

        const { domains, members } = formatDomains(domain, member);

        if (!domains || domains.length === 0) {
            return $state.go('secured.domains');
        }

        if (!canAdd(member)) {
            return;
        }

        const organizationKey = organizationKeysModel.get('organizationKey');

        addressModal.activate({
            params: {
                domains,
                members,
                organizationKey,
                cancel: addressModal.deactivate,
                addMember() {
                    if (!membersValidator.canAdd(organizationKeysModel.get('keyStatus'))) {
                        return;
                    }

                    addressModal.deactivate();
                    memberModal.activate({
                        params: {
                            organization: organizationModel.get(),
                            organizationKey,
                            domains,
                            submit(member) {
                                dispatcher.memberActions('edit.success', { member, domains });
                                memberModal.deactivate();
                            },
                            cancel: memberModal.deactivate
                        }
                    });
                },
                submit(address, member) {
                    addressModal.deactivate();
                    const dispatch = () => dispatcher.addressModel('address.new', { address, member, domain });

                    // Non private member ~ Open generate modal
                    if (!member.Private) {
                        dispatch();
                        return generate(address, member).then(eventManager.call);
                    }

                    eventManager.call();
                    dispatch();
                }
            }
        });
    };

    const disable = ({ ID }) => {
        confirmModal.activate({
            params: {
                title: I18N.DISABLE_MODAL.title,
                message: I18N.DISABLE_MODAL.message,
                cancel: confirmModal.deactivate,
                confirm() {
                    confirmModal.deactivate();
                    const promise = Address.disable(ID)
                        .then(eventManager.call)
                        .then(() => {
                            notification.success(I18N.SUCCESS_DISABLED);
                        });

                    networkActivityTracker.track(promise);
                }
            }
        });
    };

    /**
     * Setup a new address for the current account
     * @param {Object}
     * * @param {String} Domain
     * * @param {String} DisplayName
     * * @param {String} Signature
     * @return {Promise}
     */
    const setup = ({ Domain, DisplayName, Signature }) => {
        const encryptionConfigName = DEFAULT_ENCRYPTION_CONFIG;
        const passphrase = authentication.getPassword();

        return Address.setup({ Domain, DisplayName, Signature })
            .then(({ data = {} } = {}) => {
                return generateKeyModel.generate({ encryptionConfigName, passphrase, address: data.Address });
            })
            .then(() => {
                const promises = [eventManager.call(), pmDomainModel.fetch()];

                if (authentication.user.Role === PAID_ADMIN_ROLE) {
                    promises.push(memberModel.fetch());
                }

                return Promise.all(promises);
            });
    };

    const enable = ({ ID }) => {
        const promise = Address.enable(ID)
            .then(() => eventManager.call())
            .then(() => notification.success(I18N.SUCCESS_ENABLE));

        networkActivityTracker.track(promise);
    };

    /**
     * Disable the address first if the status equals 0
     * @param  {Object} address
     * @return {Promise}
     */
    const disableFirst = async ({ ID, Status }) => {
        if (Status === 0) {
            return;
        }
        await Address.disable(ID);
        notification.success(I18N.SUCCESS_DISABLED);
    };

    const remove = (address) => {
        confirmModal.activate({
            params: {
                title: I18N.DELETE_MODAL.title,
                message: I18N.DELETE_MODAL.message,
                confirm() {
                    confirmModal.deactivate();
                    const promise = disableFirst(address)
                        .then(() => Promise.all([eventManager.call(), Address.remove(address.ID)]))
                        .then(() => {
                            notification.success(I18N.SUCCESS_REMOVE);
                        })
                        .then(eventManager.call);

                    networkActivityTracker.track(promise);
                },
                cancel() {
                    confirmModal.deactivate();
                }
            }
        });
    };

    /**
     * Generate the key for a single address
     * It will open the generate modal
     * @param  {Object} address
     * @param  {Object} member
     * @return {void}
     */
    function generate(address, member = memberModel.getSelf()) {
        if (!canAdd(member, false)) {
            return;
        }

        // Update the address for the user when it's done
        return addressWithoutKeysManager
            .manageOne(address, member)
            .then(([adr = {}]) => {
                const addresses = addressesModel.getByUser(authentication.user);
                const index = _.findIndex(addresses, ({ ID }) => ID === adr.ID);

                // Address receive === 1 because we have keys and Status === 1
                adr.Receive = +(adr.Status === 1);
                index !== -1 && addresses.splice(index, 1, adr);
                dispatcher.addressModel('generateKey.success', { address });
            })
            .catch(_.noop);
    }

    const saveOrder = (AddressIDs) => {
        const promise = Address.order({ AddressIDs })
            .then(eventManager.call)
            .then(() => notification.success(I18N.SUCCESS_ORDER));

        networkActivityTracker.track(promise);
    };

    const makeDefault = (address) => {
        const addresses = addressesModel.get();
        const index = _.findIndex(addresses, { ID: address.ID });

        addresses.splice(index, 1);
        addresses.unshift(address);

        const order = _.map(addresses, 'ID');

        saveOrder(order);
    };

    return {
        add,
        disable,
        enable,
        generate,
        setup,
        makeDefault,
        remove,
        saveOrder
    };
}
export default addressModel;

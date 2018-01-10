import _ from 'lodash';

/* @ngInject */
function membersValidator(gettextCatalog, notification, $state, organizationModel, domainModel, memberModel) {
    const I18N = {
        INVALID_PLAN: gettextCatalog.getString('Multi-user support requires either a Professional or Visionary plan.', null, 'Info'),
        INACTIVE_MULTI_USER: gettextCatalog.getString('Please enable multi-user support before adding users to your organization', null, 'Info'),
        NO_DOMAIN: gettextCatalog.getString('Please configure a custom domain before adding users to your organization.', null, 'Info'),
        ERROR_NO_USERS_LEFT: gettextCatalog.getString(
            'You have used all users in your plan. Please upgrade your plan to add a new user.',
            null,
            'Error'
        ),
        ERROR_NO_ADDRESS_LEFT: gettextCatalog.getString(
            'You have used all addresses in your plan. Please upgrade your plan to add a new address.',
            null,
            'Error'
        ),
        ERROR_NO_STORAGE_LEFT: gettextCatalog.getString(
            'All storage space has been allocated. Please reduce storage allocated to other users.',
            null,
            'Error'
        ),
        ERROR_PERMISSION: gettextCatalog.getString('Permission denied, administrator privileges have been restricted.', null, 'Error'),
        INVALID_NAME: gettextCatalog.getString('Invalid name', null, 'Error'),
        INVALID_PASSWORD: gettextCatalog.getString('Invalid password', null, 'Error'),
        INVALID_ADDRESS: gettextCatalog.getString('Invalid address', null, 'Error'),
        INVALID_QUOTA: gettextCatalog.getString('Invalid storage quota', null, 'Error'),
        INVALID_VPN: gettextCatalog.getString('Invalid VPN quota', null, 'Error'),
        ERROR_DECRYPT_ORGA_KEY: gettextCatalog.getString('Cannot decrypt organization key', null, 'Error'),
        ERROR_ALREADY_USER: gettextCatalog.getString('Address already associated to a user', null, 'Error')
    };

    const validDependencies = (organization) => {
        const verifiedDomains = _.filter(domainModel.query(), ({ State }) => State);

        if (organization.MaxMembers === 1) {
            notification.info(I18N.INVALID_PLAN);
            $state.go('secured.members');
            return false;
        }

        if (!organization.HasKeys) {
            notification.info(I18N.INACTIVE_MULTI_USER);
            $state.go('secured.members');
            return false;
        }

        if (!verifiedDomains.length) {
            notification.info(I18N.NO_DOMAIN);
            return false;
        }

        return true;
    };

    const canAdd = (keyStatus) => {
        const organization = organizationModel.get();

        if (!validDependencies(organization)) {
            return false;
        }

        try {
            if (organization.MaxMembers - organization.UsedMembers < 1) {
                throw new Error(I18N.ERROR_NO_USERS_LEFT);
            }

            if (organization.MaxAddresses - organization.UsedAddresses < 1) {
                throw new Error(I18N.ERROR_NO_ADDRESS_LEFT);
            }

            if (organization.MaxSpace - organization.AssignedSpace < 1) {
                throw new Error(I18N.ERROR_NO_STORAGE_LEFT);
            }

            if (keyStatus > 0) {
                $state.go('secured.members');
                throw new Error(I18N.ERROR_PERMISSION);
            }
            return true;
        } catch (e) {
            notification.error(e);
            return false;
        }
    };

    /**
     * Check if the address is already associated to a member
     * @return {Boolean}
     */
    const existingActiveAddress = ({ address, domain = {} }) => {
        const addresses = _.reduce(
            memberModel.get(),
            (acc, { Addresses = [] }) => {
                return _.reduce(
                    Addresses,
                    (acc, { Status, Email = '' }) => {
                        // filter by active address
                        if (Status === 1) {
                            acc[Email] = Email;
                        }
                        return acc;
                    },
                    acc
                );
            },
            {}
        );
        return !!addresses[`${address}@${domain.DomainName}`];
    };

    const check = async (
        { member, quota, vpn, params, config = {} },
        { temporaryPassword, confirmPassword, address, organizationKey, name, domain }
    ) => {
        if (name.length === 0) {
            throw new Error(I18N.INVALID_NAME);
        }

        if ((!member.ID || (!member.Private && !params.member.Keys.length)) && temporaryPassword !== confirmPassword) {
            throw new Error(I18N.INVALID_PASSWORD);
        }

        if ((!member.ID || (!params.member.Addresses.length && params.member.Type === 1)) && !address.length) {
            throw new Error(I18N.INVALID_ADDRESS);
        }

        if (quota > config.maxPadding || quota < config.minPadding) {
            throw new Error(I18N.INVALID_QUOTA);
        }

        if (vpn > config.maxVPNPadding) {
            throw new Error(I18N.INVALID_VPN);
        }

        if (!member.ID && !member.Private && !organizationKey) {
            throw new Error(I18N.ERROR_DECRYPT_ORGA_KEY);
        }

        if (!member.ID && existingActiveAddress({ domain, address })) {
            throw new Error(I18N.ERROR_ALREADY_USER);
        }
    };

    return { canAdd, check };
}
export default membersValidator;

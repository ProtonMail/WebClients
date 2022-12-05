import { c, msgid } from 'ttag';

import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Organization } from '@proton/shared/lib/interfaces';

import { UserTemplate } from '../types';

export enum ORGANIZATION_CAPACITY_ERROR_TYPE {
    MEMBER,
    SPACE,
    ADDRESSES,
    VPNS,
}

export class OrganizationCapacityError extends Error {
    type: ORGANIZATION_CAPACITY_ERROR_TYPE;

    constructor(errorType: ORGANIZATION_CAPACITY_ERROR_TYPE, message: string) {
        super(message);
        this.type = errorType;
        Object.setPrototypeOf(this, OrganizationCapacityError.prototype);
    }
}

const validateOrganizationCapacity = (usersToImport: UserTemplate[], organization: Organization) => {
    const availableNumberOfMembers = organization.MaxMembers - organization.UsedMembers;
    if (usersToImport.length > availableNumberOfMembers) {
        throw new OrganizationCapacityError(
            ORGANIZATION_CAPACITY_ERROR_TYPE.MEMBER,
            c('Organization capacity error').ngettext(
                msgid`Your plan includes a maximum of ${availableNumberOfMembers} more organizational user.`,
                `Your plan includes a maximum of ${availableNumberOfMembers} more organizational users.`,
                availableNumberOfMembers
            )
        );
    }

    const { totalStorage, totalAddresses, totalVpnAccess } = usersToImport.reduce(
        (acc, user) => {
            return {
                totalStorage: acc.totalStorage + user.totalStorage,
                totalAddresses: acc.totalAddresses + user.emailAddresses.length,
                totalVpnAccess: acc.totalVpnAccess + Number(user.vpnAccess),
            };
        },
        {
            totalStorage: 0,
            totalAddresses: 0,
            totalVpnAccess: 0,
        }
    );

    const availableSpace = organization.MaxSpace - organization.UsedSpace;
    if (totalStorage > availableSpace) {
        const humanReadableAvailableSpace = humanSize(availableSpace);
        throw new OrganizationCapacityError(
            ORGANIZATION_CAPACITY_ERROR_TYPE.SPACE,
            c('Organization capacity error')
                .t`Your plan includes a maximum of ${humanReadableAvailableSpace} more storage.`
        );
    }

    const availableAddresses = organization.MaxAddresses - organization.UsedAddresses;
    if (totalAddresses > availableAddresses) {
        throw new OrganizationCapacityError(
            ORGANIZATION_CAPACITY_ERROR_TYPE.ADDRESSES,
            c('Organization capacity error').ngettext(
                msgid`Your plan includes a maximum of ${availableAddresses} more address.`,
                `Your plan includes a maximum of ${availableAddresses} more addresses.`,
                availableAddresses
            )
        );
    }

    const availableVPNAccess = organization.MaxVPN - organization.UsedVPN;
    if (totalVpnAccess > availableVPNAccess) {
        throw new OrganizationCapacityError(
            ORGANIZATION_CAPACITY_ERROR_TYPE.VPNS,
            c('Organization capacity error').ngettext(
                msgid`Your plan includes a maximum of ${availableVPNAccess} more VPN account.`,
                `Your plan includes a maximum of ${availableVPNAccess} more VPN accounts.`,
                availableVPNAccess
            )
        );
    }
};

export default validateOrganizationCapacity;

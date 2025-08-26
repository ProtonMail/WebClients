import { c } from 'ttag';

import {
    ADDRESS_FLAGS,
    ADDRESS_PERMISSIONS,
    ADDRESS_PERMISSION_TYPE,
    ADDRESS_RECEIVE,
    ADDRESS_SEND,
    ADDRESS_STATUS,
    ADDRESS_TYPE,
    MEMBER_PRIVATE,
    MEMBER_TYPE,
} from '@proton/shared/lib/constants';
import { getIsBYOEAddress } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import type {
    Address,
    CachedOrganizationKey,
    MailSettings,
    Member,
    OrganizationExtended,
    PartialMemberAddress,
    UserModel,
} from '@proton/shared/lib/interfaces';
import { AddressConfirmationState } from '@proton/shared/lib/interfaces';
import { getCanGenerateMemberAddressKeys } from '@proton/shared/lib/keys/memberKeys';
import { getIsNonDefault } from '@proton/shared/lib/mail/addresses';
import { PM_SIGNATURE } from '@proton/shared/lib/mail/mailSettings';
import { getOrganizationDenomination } from '@proton/shared/lib/organization/helper';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;

export const getStatus = (address: Address, i: number) => {
    const { Type, Status, Receive, DomainID, HasKeys, Flags, Send } = address;

    const isActive = Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === ADDRESS_RECEIVE.RECEIVE_YES;
    const isDisabled = Status === ADDRESS_STATUS.STATUS_DISABLED;
    const isExternal = Type === ADDRESS_TYPE.TYPE_EXTERNAL;
    const isOrphan = DomainID === null && !isExternal;
    const isMissingKeys = !HasKeys;
    const isNotEncrypted = hasBit(Flags, ADDRESS_FLAGS.FLAG_DISABLE_E2EE);
    const isSignatureNotExpected = hasBit(Flags, ADDRESS_FLAGS.FLAG_DISABLE_EXPECTED_SIGNED);
    const isBYOE = Type === ADDRESS_TYPE.TYPE_EXTERNAL && getIsBYOEAddress(address);
    const isBYOEDisconnected = isBYOE && Send === ADDRESS_SEND.SEND_NO;

    return {
        isDefault: i === 0,
        isActive: isBYOE ? !isBYOEDisconnected : isActive,
        isExternal,
        isDisabled,
        isOrphan,
        isMissingKeys,
        isNotEncrypted,
        isSignatureNotExpected,
        isBYOEDisconnected,
    };
};

export const getPermissions = ({
    member,
    address,
    addresses,
    user,
    organizationKey,
    addressIndex,
}: {
    addressIndex: number;
    member?: Member;
    address: Address;
    addresses: PartialMemberAddress[];
    user: UserModel;
    organizationKey?: CachedOrganizationKey;
}) => {
    const { isAdmin, canPay } = user;
    const { ID, Status, Type, Priority, ConfirmationState } = address;

    const isSpecialAddress = Type === TYPE_ORIGINAL || Type === TYPE_PREMIUM;

    const isSelf = !member || !!member.Self;
    const isDefault = addressIndex === 0;
    const isEnabled = Status === ADDRESS_STATUS.STATUS_ENABLED;
    const isExternal = Type === ADDRESS_TYPE.TYPE_EXTERNAL;
    const isBYOE = Type === ADDRESS_TYPE.TYPE_EXTERNAL && getIsBYOEAddress(address);

    const canMakeDefault = !isDefault && !getIsNonDefault(address);

    const canGenerateMemberAddressKeys = getCanGenerateMemberAddressKeys({ user, member, organizationKey, address });
    /*
     * Even though the user in question regarding the permissions here might be
     * the currently logged in user itself (isSelf), it's possible that they don't
     * have the necessary permission to generate their own missing keys. This is
     * the case if the currently logged in user is a member of an org of which they
     * are not an admin of.
     */
    const canGenerateSelfAddressKeys = isSelf && user.Private === MEMBER_PRIVATE.UNREADABLE && !address.HasKeys;
    const canGenerate = canGenerateMemberAddressKeys || canGenerateSelfAddressKeys;

    let canDisable = isEnabled && isAdmin && !isSpecialAddress && !isExternal;

    const isManagedUser = member?.Type === MEMBER_TYPE.MANAGED;
    if (isManagedUser) {
        const hasOtherEnabledAddress = addresses.some(
            (otherAddress) => otherAddress.ID !== ID && otherAddress.Status === ADDRESS_STATUS.STATUS_ENABLED
        );
        // Accounts for: 'Cannot disable your only enabled address. Please add another address first'
        if (!hasOtherEnabledAddress && isSelf) {
            canDisable = false;
        }
        // Accounts for: 'Cannot disable your default address. Please make another address default first'
        if (hasOtherEnabledAddress && Priority === 1) {
            canDisable = false;
        }
    }

    const canEditInternalAddress = Type !== ADDRESS_TYPE.TYPE_EXTERNAL && isSelf;
    const canEditExternalAddress =
        Type === ADDRESS_TYPE.TYPE_EXTERNAL &&
        ConfirmationState !== AddressConfirmationState.CONFIRMATION_CONFIRMED &&
        isSelf;

    // Takes into account disabling permissions since it does that automatically. canPay to simulate the "payments" scope for delete route.
    const adminCanDeleteCustom = ((isEnabled && canDisable) || !isEnabled) && Type === TYPE_CUSTOM_DOMAIN && canPay;

    return {
        canMakeDefault,
        canGenerate,
        canEditInternalAddress,
        canEditExternalAddress,
        canDisable,
        canEnable: Status === ADDRESS_STATUS.STATUS_DISABLED && isAdmin && !isSpecialAddress,
        canDeleteAddress: adminCanDeleteCustom,
        canDeleteAddressOncePerYear: !adminCanDeleteCustom && isAdmin && !isSpecialAddress && !isExternal && !isDefault,
        canEdit: isSelf,
        canReconnectBYOE: isBYOE,
    };
};

export type AddressPermissions = ReturnType<typeof getPermissions>;
export type AddressStatuses = ReturnType<typeof getStatus>;

export interface AddressWithMemberID extends PartialMemberAddress {
    MemberID: string;
    MemberName?: string;
}

export interface MembersMap {
    [MemberID: string]: Member;
}

export interface SwitchAddressPermissionMultiResponses {
    Responses: SwitchAddressPermissionResponse[];
}

export interface SwitchAddressPermissionResponse {
    AddressID: string;
    Response: {
        Code: number;
    };
}

export interface PermissionOption {
    text: string;
    value: ADDRESS_PERMISSIONS;
    testid: string;
}

export const canReceive = (permissions: number): boolean => {
    return (
        hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL) ||
        hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)
    );
};

export const canSend = (permissions: number): boolean => {
    return (
        hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL) ||
        hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)
    );
};

export const hasIncompleteSetup = (permissions: number): boolean => {
    return !canReceive(permissions) && !canSend(permissions);
};

export const noPermissionMap = (): PermissionOption[] => {
    return [
        {
            text: c('Option').t`No permission`,
            value: ADDRESS_PERMISSIONS.NO_PERMISSION,
            testid: 'permission-map:none',
        },
    ];
};

export const setupIncompletePermissionMap = (): PermissionOption[] => {
    return [
        {
            text: c('Option').t`Setup incomplete`,
            value: ADDRESS_PERMISSIONS.NO_PERMISSION,
            testid: 'permission-map:setup-incomplete',
        },
    ];
};

export const permissionsReceiveMap = (): PermissionOption[] => {
    return [
        {
            text: c('Option').t`Receive from all`,
            value: ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL,
            testid: 'permission-dropdown:receive-all',
        },
        {
            text: c('Option').t`Organization only`,
            value: ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG,
            testid: 'permission-dropdown:receive-org',
        },
    ];
};

export const permissionsSendMap = (): PermissionOption[] => {
    return [
        {
            text: c('Option').t`Send to all`,
            value: ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL,
            testid: 'permission-dropdown:send-all',
        },
        {
            text: c('Option').t`Organization only`,
            value: ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG,
            testid: 'permission-dropdown:send-org',
        },
    ];
};

export const getReceivePermission = (permissions: number) => {
    if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)) {
        return ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL;
    }
    if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)) {
        return ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG;
    }
    return ADDRESS_PERMISSIONS.NO_PERMISSION;
};

export const getSendPermission = (permissions: number) => {
    if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)) {
        return ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL;
    }
    if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)) {
        return ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG;
    }
    return ADDRESS_PERMISSIONS.NO_PERMISSION;
};

export const permissionsMap = (addressPermissions: number | undefined, type: ADDRESS_PERMISSION_TYPE) => {
    if (addressPermissions && !hasIncompleteSetup(addressPermissions)) {
        if (
            type === ADDRESS_PERMISSION_TYPE.RECEIVE &&
            getReceivePermission(addressPermissions) !== ADDRESS_PERMISSIONS.NO_PERMISSION
        ) {
            return permissionsReceiveMap();
        }
        if (
            type === ADDRESS_PERMISSION_TYPE.SEND &&
            getSendPermission(addressPermissions) !== ADDRESS_PERMISSIONS.NO_PERMISSION
        ) {
            return permissionsSendMap();
        }
    }
    if (!addressPermissions || hasIncompleteSetup(addressPermissions)) {
        return setupIncompletePermissionMap();
    }
    return noPermissionMap();
};

export const getPermission = (permissions: number, type: ADDRESS_PERMISSION_TYPE): string => {
    if (type === ADDRESS_PERMISSION_TYPE.RECEIVE) {
        if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ALL)) {
            return c('Permission').t`Receive from all`;
        }
        if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_RECEIVE_ORG)) {
            return c('Permission').t`Organization only`;
        }
        if (hasIncompleteSetup(permissions)) {
            return c('Permission').t`Setup incomplete`;
        }
    } else {
        if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ALL)) {
            return c('Permission').t`Send to all`;
        }
        if (hasBit(permissions, ADDRESS_PERMISSIONS.PERMISSIONS_SEND_ORG)) {
            return c('Permission').t`Organization only`;
        }
        if (hasIncompleteSetup(permissions)) {
            return c('Permission').t`Setup incomplete`;
        }
    }

    return c('Permission').t`No permission`;
};

export const canUpdateSignature = (
    user: UserModel,
    organization?: OrganizationExtended,
    mailSettings?: MailSettings
) => {
    if (user.isMember && organization && getOrganizationDenomination(organization) === 'organization') {
        return false;
    }

    if (!user.hasPaidMail) {
        return true;
    }

    return !hasBit(mailSettings?.PMSignature, PM_SIGNATURE.LOCKED);
};

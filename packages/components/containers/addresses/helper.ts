import {
    ADDRESS_RECEIVE,
    ADDRESS_SEND,
    ADDRESS_STATUS,
    ADDRESS_TYPE,
    MEMBER_PRIVATE,
    MEMBER_TYPE,
} from '@proton/shared/lib/constants';
import { Address, CachedOrganizationKey, Member, UserModel } from '@proton/shared/lib/interfaces';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;

export const getStatus = (address: Address, i: number) => {
    const { Type, Status, Receive, DomainID, HasKeys } = address;

    const isActive = Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === ADDRESS_RECEIVE.RECEIVE_YES;
    const isDisabled = Status === ADDRESS_STATUS.STATUS_DISABLED;
    const isExternal = Type === ADDRESS_TYPE.TYPE_EXTERNAL;
    const isOrphan = DomainID === null && !isExternal;
    const isMissingKeys = !HasKeys;

    return {
        isDefault: i === 0,
        isActive,
        isExternal,
        isDisabled,
        isOrphan,
        isMissingKeys,
    };
};

export const getIsNonDefault = (address: Address) => {
    return (
        address.Status === ADDRESS_STATUS.STATUS_DISABLED ||
        address.Type === ADDRESS_TYPE.TYPE_EXTERNAL ||
        address.Receive === ADDRESS_RECEIVE.RECEIVE_NO ||
        address.Send === ADDRESS_SEND.SEND_NO
    );
};

export const getPermissions = ({
    member,
    address: { ID, Status, HasKeys, Type, Priority },
    address,
    addresses,
    user,
    organizationKey,
    addressIndex,
}: {
    addressIndex: number;
    member?: Member;
    address: Address;
    addresses: Address[];
    user: UserModel;
    organizationKey?: CachedOrganizationKey;
}) => {
    const { isAdmin, canPay, isSubUser } = user;

    const isSpecialAddress = Type === TYPE_ORIGINAL || Type === TYPE_PREMIUM;

    const isSelf = !member || !!member.Self;
    const isMemberReadable = member?.Private === MEMBER_PRIVATE.READABLE;
    const isDefault = addressIndex === 0;
    const isEnabled = Status === ADDRESS_STATUS.STATUS_ENABLED;
    const isExternal = Type === ADDRESS_TYPE.TYPE_EXTERNAL;

    const canMakeDefault = !isDefault && !getIsNonDefault(address);

    /*
     * Keys can be generated if the organisation key is decrypted, and you are an admin,
     * and the member is readable, you're not an admin signed in to a readable member.
     */
    const canGenerateMember = organizationKey?.privateKey && isAdmin && isMemberReadable && !isSubUser;
    /*
     * Even though the user in question regarding the permissions here might be
     * the currently logged in user itself (isSelf), it's possible that they don't
     * have the necessary permission to generate their own missing keys. This is
     * the case if the currently logged in user is a member of an org of which they
     * are not an admin of.
     */
    const canGenerateSelf = isSelf && user.Private === MEMBER_PRIVATE.UNREADABLE;
    const canGenerate = !HasKeys && (canGenerateMember || canGenerateSelf);

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

    return {
        canMakeDefault,
        canGenerate,
        canDisable,
        canEnable: Status === ADDRESS_STATUS.STATUS_DISABLED && isAdmin && !isSpecialAddress,
        // Takes into account disabling permissions since it does that automatically. canPay to simulate the "payments" scope for delete route.
        canDelete: ((isEnabled && canDisable) || !isEnabled) && Type === TYPE_CUSTOM_DOMAIN && canPay,
        canEdit: isSelf,
    };
};

const addressSort = (a: Address, b: Address) => {
    if (getIsNonDefault(a)) {
        return 1;
    }
    if (getIsNonDefault(b)) {
        return -1;
    }
    return a.Order - b.Order;
};

export const formatAddresses = (addresses?: Address[]) => {
    if (Array.isArray(addresses)) {
        return addresses.sort(addressSort);
    }
    return [];
};

export type AddressPermissions = ReturnType<typeof getPermissions>;
export type AddressStatuses = ReturnType<typeof getStatus>;

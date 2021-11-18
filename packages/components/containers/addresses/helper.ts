import { ADDRESS_STATUS, ADDRESS_TYPE, MEMBER_PRIVATE, RECEIVE_ADDRESS } from '@proton/shared/lib/constants';
import { Address, Member, UserModel, CachedOrganizationKey } from '@proton/shared/lib/interfaces';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM, TYPE_EXTERNAL } = ADDRESS_TYPE;
const { READABLE } = MEMBER_PRIVATE;

export const getStatus = (address: Address, i: number) => {
    const { Status, Receive, DomainID, HasKeys } = address;

    const isActive = Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === RECEIVE_ADDRESS.RECEIVE_YES;
    const isDisabled = Status === ADDRESS_STATUS.STATUS_DISABLED;
    const isOrphan = DomainID === null;
    const isMissingKeys = !HasKeys;

    return {
        isDefault: i === 0 && !isDisabled && isActive,
        isActive,
        isDisabled,
        isOrphan,
        isMissingKeys,
    };
};

export const getPermissions = ({
    member,
    address: { ID, Status, HasKeys, Type, Priority },
    addresses,
    user: { isAdmin },
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
    const isSpecialAddress = Type === TYPE_ORIGINAL || Type === TYPE_PREMIUM;

    const isSelf = !member || !!member.Self;
    const isMemberReadable = member?.Private === READABLE;
    const isDefault = addressIndex === 0;
    const isEnabled = Status === ADDRESS_STATUS.STATUS_ENABLED;

    const canGenerateMember = organizationKey && isAdmin && isMemberReadable;
    const canMakeDefault = !isDefault && isEnabled;

    let canDisable = isEnabled && isAdmin && !isSpecialAddress;

    // TODO: This is a heuristic that finds out if it's a managed user pending the new Type field (which will
    // be added to the member response) by looking if it has a PM address or external address.
    const isManagedUser = !addresses.some(
        (address) => address.Type === TYPE_ORIGINAL || address.Type === TYPE_EXTERNAL
    );
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
        canGenerate: !HasKeys && (canGenerateMember || isSelf),
        canDisable,
        canEnable: Status === ADDRESS_STATUS.STATUS_DISABLED && isAdmin && !isSpecialAddress,
        // Takes into account disabling permissions since it does that automatically
        canDelete: ((isEnabled && canDisable) || !isEnabled) && Type === TYPE_CUSTOM_DOMAIN && isAdmin,
        canEdit: isSelf,
    };
};

// Moves disabled addresses to the back of the list, and sorts by order.
const addressSort = (a: Address, b: Address) => {
    if (a.Status === ADDRESS_STATUS.STATUS_DISABLED) {
        return 1;
    }
    if (b.Status === ADDRESS_STATUS.STATUS_DISABLED) {
        return -1;
    }
    return a.Order - b.Order;
};

export const formatAddresses = (addresses?: Address[]) => {
    if (Array.isArray(addresses)) {
        return addresses.filter(({ Type }) => Type !== ADDRESS_TYPE.TYPE_EXTERNAL).sort(addressSort);
    }
    return [];
};

export type AddressPermissions = ReturnType<typeof getPermissions>;
export type AddressStatuses = ReturnType<typeof getStatus>;

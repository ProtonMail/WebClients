import { ADDRESS_STATUS, ADDRESS_TYPE, MEMBER_PRIVATE, RECEIVE_ADDRESS } from 'proton-shared/lib/constants';
import { Address, Member, UserModel, CachedOrganizationKey } from 'proton-shared/lib/interfaces';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;
const { READABLE } = MEMBER_PRIVATE;

export const getStatus = (address: Address, i: number) => {
    const { Status, Receive, DomainID, HasKeys } = address;

    const isActive = Status === ADDRESS_STATUS.STATUS_ENABLED && Receive === RECEIVE_ADDRESS.RECEIVE_YES;
    const isDisabled = Status === ADDRESS_STATUS.STATUS_DISABLED;
    const isOrphan = DomainID === null;
    const isMissingKeys = !HasKeys;

    return {
        isDefault: i === 0,
        isActive,
        isDisabled,
        isOrphan,
        isMissingKeys,
    };
};

export const getPermissions = ({
    member,
    address: { Status, HasKeys, Type, Order },
    user: { isAdmin },
    organizationKey,
}: {
    member?: Member;
    address: Address;
    user: UserModel;
    organizationKey?: CachedOrganizationKey;
}) => {
    const isSpecialAddress = Type === TYPE_ORIGINAL || Type === TYPE_PREMIUM;
    const isPrimaryAddress = Order === 1;

    const isSelf = !member || !!member.Self;
    const isMemberReadable = member?.Private === READABLE;

    const canGenerateMember = organizationKey && isAdmin && isMemberReadable;
    return {
        canGenerate: !HasKeys && (canGenerateMember || isSelf),
        canDisable: Status === ADDRESS_STATUS.STATUS_ENABLED && isAdmin && !isSpecialAddress && !isPrimaryAddress,
        canEnable: Status === ADDRESS_STATUS.STATUS_DISABLED && isAdmin && !isSpecialAddress,
        canDelete: Type === TYPE_CUSTOM_DOMAIN && isAdmin,
        canEdit: isSelf,
    };
};

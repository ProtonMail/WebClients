import { ADDRESS_STATUS, ADDRESS_TYPE, MEMBER_PRIVATE, RECEIVE_ADDRESS } from 'proton-shared/lib/constants';

const { TYPE_ORIGINAL, TYPE_CUSTOM_DOMAIN, TYPE_PREMIUM } = ADDRESS_TYPE;
const { READABLE, UNREADABLE } = MEMBER_PRIVATE;

export const getStatus = ({ address: { Status, Receive, DomainID, HasKeys }, i }) => {
    const isActive = ADDRESS_STATUS.STATUS_ENABLED && Receive === RECEIVE_ADDRESS.RECEIVE_YES;
    const isDisabled = Status === ADDRESS_STATUS.STATUS_DISABLED;
    const isOrphan = DomainID === null;
    const isMissingKeys = !HasKeys;

    return {
        isDefault: i === 0,
        isActive,
        isDisabled,
        isOrphan,
        isMissingKeys
    };
};

export const getPermissions = ({
    member: { Private, Self },
    address: { Status, HasKeys, Type },
    user: { isAdmin },
    organizationKey
}) => {
    const isSpecialAddress = Type === TYPE_ORIGINAL && Type === TYPE_PREMIUM;

    return {
        canGenerate:
            !HasKeys && organizationKey && ((isAdmin && Private === READABLE) || (Private === UNREADABLE && Self)),
        canDisable: Status === ADDRESS_STATUS.STATUS_ENABLED && isAdmin && !isSpecialAddress,
        canEnable: Status === ADDRESS_STATUS.STATUS_DISABLED && isAdmin && !isSpecialAddress,
        canDelete: Type === TYPE_CUSTOM_DOMAIN,
        canEdit: !!Self
    };
};

import { c } from 'ttag';

export enum VALIDATION_ERROR_TYPES {
    INVALID_EMAIL,
    EXTERNAL_INVITE_DISABLED,
    DOES_NOT_EXIST,
    EXISTING_MEMBER,
    NOT_INTERNAL_ACCOUNT,
}

const { INVALID_EMAIL, EXTERNAL_INVITE_DISABLED, DOES_NOT_EXIST, EXISTING_MEMBER, NOT_INTERNAL_ACCOUNT } =
    VALIDATION_ERROR_TYPES;

const getValidationErrorMessage = (type: VALIDATION_ERROR_TYPES) => {
    if (type === INVALID_EMAIL) {
        return c('Error').t`The address might be misspelled`;
    }
    if (type === EXTERNAL_INVITE_DISABLED) {
        return c('Error').t`External invitations are temporarily disabled.`;
    }
    if (type === DOES_NOT_EXIST) {
        return c('Error').t`Account does not exist`;
    }
    if (type === EXISTING_MEMBER) {
        return c('Error').t`Already a member of this share`;
    }
    if (type === NOT_INTERNAL_ACCOUNT) {
        return c('Error').t`External accounts are not supported yet`;
    }
    return c('Error').t`Validation error`;
};

export class ShareInviteeValidationError extends Error {
    type: VALIDATION_ERROR_TYPES;

    constructor(type: VALIDATION_ERROR_TYPES) {
        const message = getValidationErrorMessage(type);
        super(message);
        this.type = type;
        Object.setPrototypeOf(this, ShareInviteeValidationError.prototype);
    }
}

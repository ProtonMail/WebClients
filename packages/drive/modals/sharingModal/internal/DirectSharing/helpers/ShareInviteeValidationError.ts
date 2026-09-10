import { c } from 'ttag';

export enum VALIDATION_ERROR_TYPES {
    INVALID_EMAIL,
    EXTERNAL_INVITE_DISABLED,
    EXISTING_MEMBER,
}

const { INVALID_EMAIL, EXTERNAL_INVITE_DISABLED, EXISTING_MEMBER } = VALIDATION_ERROR_TYPES;

const getValidationErrorMessage = (type: VALIDATION_ERROR_TYPES) => {
    if (type === INVALID_EMAIL) {
        return c('Error').t`The address might be misspelled`;
    }
    if (type === EXTERNAL_INVITE_DISABLED) {
        return c('Error').t`External invitations are temporarily disabled.`;
    }
    if (type === EXISTING_MEMBER) {
        return c('Error').t`Already a member of this share`;
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

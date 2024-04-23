import { c } from 'ttag';

import { BRAND_NAME } from '@proton/shared/lib/constants';
import { EncryptionPreferencesError } from '@proton/shared/lib/mail/encryptionPreferences';

export enum VALIDATION_ERROR_TYPES {
    INVALID_EMAIL,
    NOT_PROTON_ACCOUNT,
    DOES_NOT_EXIST,
    EXISTING_MEMBER,
    NOT_INTERNAL_ACCOUNT,
}
const { INVALID_EMAIL, NOT_PROTON_ACCOUNT, DOES_NOT_EXIST, EXISTING_MEMBER, NOT_INTERNAL_ACCOUNT } =
    VALIDATION_ERROR_TYPES;

const getValidationErrorMessage = (type: VALIDATION_ERROR_TYPES) => {
    if (type === INVALID_EMAIL) {
        return c('Error').t`The address might be misspelled`;
    }
    if (type === NOT_PROTON_ACCOUNT) {
        return c('Error').t`Not a ${BRAND_NAME} account`;
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

export class ShareInviteeValdidationError extends Error {
    type: VALIDATION_ERROR_TYPES;

    constructor(type: VALIDATION_ERROR_TYPES) {
        const message = getValidationErrorMessage(type);
        super(message);
        this.type = type;
        Object.setPrototypeOf(this, ShareInviteeValdidationError.prototype);
    }
}

export type RecipientError = ShareInviteeValdidationError | EncryptionPreferencesError;

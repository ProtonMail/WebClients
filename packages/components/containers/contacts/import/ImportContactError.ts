import { c } from 'ttag';

export enum IMPORT_CONTACT_ERROR_TYPE {
    UNSUPPORTED_VCARD_VERSION,
    ENCRYPTION_ERROR,
    EXTERNAL_ERROR,
}

const getErrorMessage = (errorType: IMPORT_CONTACT_ERROR_TYPE, externalError?: Error) => {
    if (errorType === IMPORT_CONTACT_ERROR_TYPE.UNSUPPORTED_VCARD_VERSION) {
        return c('Error importing contact').t`vCard versions < 3.0 not supported`;
    }
    if (errorType === IMPORT_CONTACT_ERROR_TYPE.ENCRYPTION_ERROR) {
        return c('Error importing contact').t`Encryption failed`;
    }
    if (errorType === IMPORT_CONTACT_ERROR_TYPE.EXTERNAL_ERROR) {
        return externalError?.message || '';
    }
    return '';
};

export class ImportContactError extends Error {
    contactId: string;

    type: IMPORT_CONTACT_ERROR_TYPE;

    externalError?: Error;

    constructor(errorType: IMPORT_CONTACT_ERROR_TYPE, contactId: string, externalError?: Error) {
        super(getErrorMessage(errorType, externalError));
        this.type = errorType;
        this.contactId = contactId;
        this.externalError = externalError;
        Object.setPrototypeOf(this, ImportContactError.prototype);
    }
}

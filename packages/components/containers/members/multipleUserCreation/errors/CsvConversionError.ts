export enum CSV_CONVERSION_ERROR_TYPE {
    EMAIL_REQUIRED,
    PASSWORD_REQUIRED,
    PASSWORD_LESS_THAN_MIN_LENGTH,
    INVALID_TYPE,
    INVITATION_EMAIL_REQUIRED,
}

export default class CsvConversionError extends Error {
    readonly type: CSV_CONVERSION_ERROR_TYPE;

    constructor(errorType: CSV_CONVERSION_ERROR_TYPE) {
        super();
        this.type = errorType;
        Object.setPrototypeOf(this, CsvConversionError.prototype);
    }
}

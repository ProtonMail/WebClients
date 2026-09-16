export enum CSV_CONVERSION_ERROR_TYPE {
    EMAIL_REQUIRED = 0,
    PASSWORD_REQUIRED = 1,
    PASSWORD_LESS_THAN_MIN_LENGTH = 2,
    INVALID_TYPE = 3,
    INVITATION_EMAIL_REQUIRED = 4,
}

export default class CsvConversionError extends Error {
    readonly type: CSV_CONVERSION_ERROR_TYPE;

    constructor(errorType: CSV_CONVERSION_ERROR_TYPE) {
        super();
        this.type = errorType;
        Object.setPrototypeOf(this, CsvConversionError.prototype);
    }
}

export enum Step {
    PREPARE = 1,
    STARTED = 2,
}

export enum IMPORT_ERROR {
    IMAP_CONNECTION_ERROR = 2900,
    AUTHENTICATION_ERROR = 2901,
    ALREADY_EXISTS = 2500,
    OAUTH_INSUFFICIENT_SCOPES = 2027,
    BANDWIDTH_LIMIT = 2902,
    TEMP_PROVIDER_ERROR = 2902,
    RATE_LIMIT_EXCEEDED = 429,
}

export interface ImportCalendarModalModel {
    step: Step;
    importID: string;
    email: string;
    payload: ImportPayloadModel;
    errorCode: number;
    errorLabel: string;
    isPayloadInvalid: boolean;
}

export interface ImportPayloadModel {
    AddressID: string;
}

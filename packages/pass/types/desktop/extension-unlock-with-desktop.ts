export enum NativeMessageType {
    SETUP_LOCK_SECRET = 'setup-lock-secret',
    UNLOCK = 'unlock',
    DELETE_LOCK_SECRET = 'delete-lock-secret',
}

export enum NativeMessageErrorType {
    HOST_NOT_FOUND = 'HOST_NOT_FOUND',
    HOST_NOT_RESPONDING = 'HOST_NOT_RESPONDING',
    DESKTOP_APP_LOCKED = 'DESKTOP_APP_LOCKED',
    TIMEOUT = 'TIMEOUT',
    NATIVE_MESSAGE_ENCRYPTION_FAILED = 'NATIVE_MESSAGE_ENCRYPTION_FAILED',
    NATIVE_MESSAGE_DECRYPTION_FAILED = 'NATIVE_MESSAGE_DECRYPTION_FAILED',
    UNKNOWN = 'UNKNOWN',
    SETUP_LOCK_SECRET_INVALID_RESPONSE = 'SETUP_LOCK_SECRET_INVALID_RESPONSE',
    SECRET_NOT_FOUND = 'SECRET_NOT_FOUND',
    BIOMETRICS_FAILED = 'BIOMETRICS_FAILED',
    BIOMETRICS_CANCELLED = 'BIOMETRICS_CANCELLED',
    DESKTOP_LOCK_NOT_CONFIGURED = 'DESKTOP_LOCK_NOT_CONFIGURED',
    SECRET_MISMATCH = 'SECRET_MISMATCH',
    ACCOUNT_MISMATCH = 'ACCOUNT_MISMATCH',
    DESKTOP_APP_NOT_LOGGED_IN = 'DESKTOP_APP_NOT_LOGGED_IN',
    UNLOCK_IN_PROGRESS = 'UNLOCK_IN_PROGRESS',
    TOO_MANY_ATTEMPTS = 'TOO_MANY_ATTEMPTS',
}

export type NativeMessageRequest =
    NativeMessageSetupLockSecretRequest | NativeMessageUnlockRequest | NativeMessageDeleteLockSecretRequest;

export type NativeMessageResponse =
    NativeMessageSetupLockSecretResponse | NativeMessageUnlockResponse | NativeMessageDeleteLockSecretResponse;

export type NativeMessage = NativeMessageRequest | NativeMessageResponse;

export type NativeMessageData = Omit<NativeMessage, 'type' | 'encrypt'>;

export type NativeMessageSetupLockSecretRequest = {
    type: NativeMessageType.SETUP_LOCK_SECRET;
    encrypt: true;
    lockSecret: string;
    userIdentifier: string;
};

export type NativeMessageSetupLockSecretResponse = {
    type: NativeMessageType.SETUP_LOCK_SECRET;
    encrypt: true;
    lockSecret: string;
    userIdentifier: string;
};

type NativeMessageUnlockRequest = {
    type: NativeMessageType.UNLOCK;
    encrypt: false;
    userIdentifier: string;
    reason: string;
};

type NativeMessageUnlockResponse = {
    type: NativeMessageType.UNLOCK;
    encrypt: false;
    secret: string;
};

export type NativeMessageDeleteLockSecretRequest = {
    type: NativeMessageType.DELETE_LOCK_SECRET;
    encrypt: false;
    userIdentifier: string;
};

export type NativeMessageDeleteLockSecretResponse = {
    type: NativeMessageType.DELETE_LOCK_SECRET;
    encrypt: false;
};

export type NativeMessageRequestForType<Type extends NativeMessageType> = Extract<NativeMessageRequest, { type: Type }>;
type NativeMessageResponseForType<Type extends NativeMessageType> = Extract<NativeMessageResponse, { type: Type }>;

export type NativeMessageResponseForRequest<Req extends NativeMessageRequest> = NativeMessageResponseForType<
    Req['type']
>;

export type SendNativeMessageRequest = <Req extends NativeMessageRequest>(
    request: Req
) => Promise<NativeMessageResponseForRequest<Req>>;

export type SendNativeMessageResponse = <Res extends NativeMessageResponse>(
    response: NativeMessageResponseWithError<Res>,
    messageId: string
) => Promise<void>;

export type NativeMessagePayload<Mes extends NativeMessage> = Mes['encrypt'] extends true
    ? { type: Mes['type']; messageId: string; encrypted: string; serverTime: number; userIdentifier?: string }
    : Omit<Mes, 'encrypt'> & { messageId: string };

type NativeMessageResponseWithError<Res extends NativeMessageResponse> =
    | Res
    | (Pick<Res, 'type'> & { error: NativeMessageErrorType });

/** `installed` is false for a skipped browser (not present on this machine) and for a failed one. */
export type NativeMessagingInstallReport = {
    browser: string;
    installed: boolean;
    skipped: boolean;
    error?: string;
};

/** `browser` of the report entry standing for a failure of the whole install call. */
export const NATIVE_MESSAGING_ALL_BROWSERS = 'all';

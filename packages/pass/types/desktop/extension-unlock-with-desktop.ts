export enum NativeMessageType {
    SETUP_LOCK_SECRET = 'setup-lock-secret',
    UNLOCK = 'unlock',
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
}

export type NativeMessageRequest = NativeMessageSetupLockSecretRequest | NativeMessageUnlockRequest;

export type NativeMessageResponse = NativeMessageSetupLockSecretResponse | NativeMessageUnlockResponse;

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

export type NativeMessageUnlockRequest = {
    type: NativeMessageType.UNLOCK;
    encrypt: false;
    userIdentifier: string;
};

export type NativeMessageUnlockResponse = {
    type: NativeMessageType.UNLOCK;
    encrypt: false;
    secret: string;
};

export type NativeMessageRequestForType<Type extends NativeMessageType> = Extract<NativeMessageRequest, { type: Type }>;
export type NativeMessageResponseForType<Type extends NativeMessageType> = Extract<
    NativeMessageResponse,
    { type: Type }
>;
export type NativeMessageRequestForResponse<Res extends NativeMessageResponse> = NativeMessageRequestForType<
    Res['type']
>;
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

export type NativeMessagePayload<Mes extends NativeMessage> =
    Mes['encrypt'] extends true ? { type: Mes['type']; messageId: string; encrypted: string; serverTime: number }
    :   Omit<Mes, 'encrypt'> & { messageId: string };

export type NativeMessageResponseWithError<Res extends NativeMessageResponse> =
    | Res
    | (Pick<Res, 'type'> & { error: NativeMessageErrorType });

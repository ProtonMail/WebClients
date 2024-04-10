import { WorkerMessageType } from '@proton/pass/types';

export const BRIDGE_REQUEST = 'Pass::MainWorld::Message';
export const BRIDGE_RESPONSE = 'Pass::MainWorld::Response';
export const BRIDGE_ABORT = 'Pass::MainWorld::Abort';
export const BRIDGE_DISCONNECT = 'Pass::MainWorld::Disconnect';

export const ALLOWED_MESSAGES = [
    WorkerMessageType.PASSKEY_CREATE,
    WorkerMessageType.PASSKEY_GET,
    WorkerMessageType.PASSKEY_INTERCEPT,
] as const;

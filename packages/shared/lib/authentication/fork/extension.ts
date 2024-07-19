import type { OfflineKey } from '../../authentication/offlineKey';
import { type ExtensionApp, type ExtensionMessageResponse, sendExtensionMessage } from '../../browser/extension';
import type { ProduceForkParameters } from './produce';

interface ExtensionForkPayloadArguments {
    selector: string;
    session: {
        keyPassword?: string | undefined;
        offlineKey: OfflineKey | undefined;
        persistent: boolean;
        trusted: boolean;
    };
    forkParameters: ProduceForkParameters;
}

export interface ExtensionForkPayload {
    selector: string;
    keyPassword: string | undefined;
    offlineKey: OfflineKey | undefined;
    persistent: boolean;
    trusted: boolean;
    state: string;
}

export type ExtensionForkResultPayload = { title?: string; message: string };
export type ExtensionForkResult = ExtensionMessageResponse<ExtensionForkResultPayload>;

export const produceExtensionFork = async (options: {
    app: ExtensionApp;
    payload: ExtensionForkPayloadArguments;
}): Promise<ExtensionForkResult> => {
    const payload: ExtensionForkPayload = {
        selector: options.payload.selector,
        keyPassword: options.payload.session.keyPassword,
        offlineKey: options.payload.session.offlineKey,
        persistent: options.payload.session.persistent,
        trusted: options.payload.session.trusted,
        state: options.payload.forkParameters.state,
    };

    return sendExtensionMessage<ExtensionForkResultPayload>({ type: 'fork', payload }, { app: options.app });
};

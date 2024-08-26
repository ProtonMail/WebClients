import { ForkSearchParameters, type ForkType } from './constants';
import { getReturnUrlParameter } from './returnUrl';
import { getValidatedForkType, getValidatedRawKey } from './validation';

export interface ConsumeForkParameters {
    selector: string;
    state: string;
    key: Uint8Array;
    persistent: boolean;
    trusted: boolean;
    payloadVersion: 1 | 2;
    payloadType: 'offline' | 'default';
    forkType: ForkType | undefined;
    returnUrl?: string;
}

export const getConsumeForkParameters = (searchParams: URLSearchParams): ConsumeForkParameters | null => {
    const selector = searchParams.get(ForkSearchParameters.Selector) || '';
    const unparsedState = searchParams.get(ForkSearchParameters.State) || '';
    const base64StringKey = searchParams.get(ForkSearchParameters.Base64Key) || '';
    const type = searchParams.get(ForkSearchParameters.ForkType) || '';
    const persistent = searchParams.get(ForkSearchParameters.Persistent) || '';
    const trusted = searchParams.get(ForkSearchParameters.Trusted) || '';
    const payloadVersion = searchParams.get(ForkSearchParameters.PayloadVersion) || '';
    const payloadType = searchParams.get(ForkSearchParameters.PayloadType) || '';

    const state = unparsedState.slice(0, 100);
    const key = base64StringKey.length ? getValidatedRawKey(base64StringKey) : undefined;

    if (!selector || !key) {
        return null;
    }

    return {
        state,
        selector,
        key,
        forkType: getValidatedForkType(type),
        persistent: persistent === '1',
        trusted: trusted === '1',
        payloadVersion: payloadVersion === '2' ? 2 : 1,
        payloadType: payloadType === 'offline' ? payloadType : 'default',
        returnUrl: getReturnUrlParameter(searchParams),
    };
};

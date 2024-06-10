import { ForkSearchParameters } from './constants';
import { getValidatedForkType, getValidatedRawKey } from './validation';

export const getConsumeForkParameters = (searchParams: URLSearchParams) => {
    const selector = searchParams.get(ForkSearchParameters.Selector) || '';
    const state = searchParams.get(ForkSearchParameters.State) || '';
    const base64StringKey = searchParams.get(ForkSearchParameters.Base64Key) || '';
    const type = searchParams.get(ForkSearchParameters.ForkType) || '';
    const persistent = searchParams.get(ForkSearchParameters.Persistent) || '';
    const trusted = searchParams.get(ForkSearchParameters.Trusted) || '';
    const payloadVersion = searchParams.get(ForkSearchParameters.PayloadVersion) || '';
    const payloadType = searchParams.get(ForkSearchParameters.PayloadType) || '';

    return {
        state: state.slice(0, 100),
        selector,
        key: base64StringKey.length ? getValidatedRawKey(base64StringKey) : undefined,
        forkType: getValidatedForkType(type),
        persistent: persistent === '1',
        trusted: trusted === '1',
        payloadVersion: payloadVersion === '2' ? 2 : 1,
        payloadType: payloadType === 'offline' ? payloadType : 'default',
    } as const;
};

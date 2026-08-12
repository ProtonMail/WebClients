import type { NoiseCancellationModel } from '../types';

export const nativeModel: NoiseCancellationModel = {
    id: 'native',
    isSupported: () => true,
    isNative: true,
    createProcessor: () => null,
};

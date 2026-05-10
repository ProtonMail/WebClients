import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context/types';

import { PassFeature } from '@proton/pass/types/api/features';

import { isOfflineModeEnabled } from './auth.utils';

describe('auth.utils', () => {
    let ctx: WorkerContextInterface;
    let resolve: jest.Mock;

    beforeEach(() => {
        resolve = jest.fn();
        ctx = { service: { featureFlags: { resolve } } } as any;
        WorkerContext.set(ctx);
    });

    afterEach(() => WorkerContext.clear());

    describe('`isOfflineModeEnabled`', () => {
        test('should map to `PassExtensionOfflineV1` feature flag value', async () => {
            resolve.mockResolvedValueOnce({ features: { [PassFeature.PassExtensionOfflineV1]: true }, variants: {} });
            expect(await isOfflineModeEnabled()).toBe(true);
            resolve.mockResolvedValueOnce({ features: { [PassFeature.PassExtensionOfflineV1]: false }, variants: {} });
            expect(await isOfflineModeEnabled()).toBe(false);
        });
        test('should return `false` when flag is missing from feature flags', async () => {
            resolve.mockResolvedValueOnce({ features: {}, variants: {} });
            expect(await isOfflineModeEnabled()).toBe(false);
        });
    });
});

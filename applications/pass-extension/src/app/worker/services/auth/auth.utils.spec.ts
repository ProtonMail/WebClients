import { WorkerContext } from 'proton-pass-extension/app/worker/context/inject';
import type { WorkerContextInterface } from 'proton-pass-extension/app/worker/context/types';

import { PassFeature } from '@proton/pass/types/api/features';
import { epochToMs, getEpoch } from '@proton/pass/utils/time/epoch';

import { isOfflineModeEnabled, shouldForceLock } from './auth.utils';

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

    describe('`shouldForceLock`', () => {
        let getLocal: jest.Mock;
        let setLocal: jest.Mock;
        let getLockLastExtendTime: jest.Mock;
        let getLockTTL: jest.Mock;
        let alarmWhen: jest.Mock;

        beforeEach(() => {
            getLocal = jest.fn().mockResolvedValue(undefined);
            setLocal = jest.fn().mockResolvedValue(undefined);
            getLockLastExtendTime = jest.fn().mockReturnValue(undefined);
            getLockTTL = jest.fn().mockReturnValue(undefined);
            alarmWhen = jest.fn().mockResolvedValue(undefined);

            ctx = {
                authStore: { getLockLastExtendTime, getLockTTL },
                service: {
                    storage: { local: { getItem: getLocal, setItem: setLocal } },
                    auth: { alarms: { autoLockAlarm: { when: alarmWhen } } },
                },
            } as any;
            WorkerContext.set(ctx);
        });

        test('Should short-circuit when `forceLock` flag is set', async () => {
            getLocal.mockResolvedValueOnce(true);
            expect(await shouldForceLock()).toBe(true);
            expect(getLockLastExtendTime).not.toHaveBeenCalled();
            expect(getLockTTL).not.toHaveBeenCalled();
            expect(alarmWhen).not.toHaveBeenCalled();
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('Should force-lock and promote when persisted deadline has passed', async () => {
            const now = getEpoch();
            getLockLastExtendTime.mockReturnValueOnce(now - 600);
            getLockTTL.mockReturnValueOnce(60);
            expect(await shouldForceLock()).toBe(true);
            expect(setLocal).toHaveBeenCalledWith('forceLock', true);
            expect(alarmWhen).not.toHaveBeenCalled();
        });

        test('Should fall through when deadline has not passed', async () => {
            const now = getEpoch();
            getLockLastExtendTime.mockReturnValueOnce(now);
            getLockTTL.mockReturnValueOnce(600);
            expect(await shouldForceLock()).toBe(false);
            expect(alarmWhen).toHaveBeenCalled();
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('Should fall through when `lockLastExtendTime` is missing', async () => {
            getLockTTL.mockReturnValueOnce(60);
            expect(await shouldForceLock()).toBe(false);
            expect(alarmWhen).toHaveBeenCalled();
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('Should fall through when `lockTTL` is missing', async () => {
            const now = getEpoch();
            getLockLastExtendTime.mockReturnValueOnce(now - 600);
            expect(await shouldForceLock()).toBe(false);
            expect(alarmWhen).toHaveBeenCalled();
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('Should force-lock and promote when alarm `when` is in the past', async () => {
            const now = getEpoch();
            alarmWhen.mockResolvedValueOnce(epochToMs(now - 1));
            expect(await shouldForceLock()).toBe(true);
            expect(setLocal).toHaveBeenCalledWith('forceLock', true);
        });

        test('Should not force-lock when alarm `when` is in the future', async () => {
            const now = getEpoch();
            alarmWhen.mockResolvedValueOnce(epochToMs(now + 600));
            expect(await shouldForceLock()).toBe(false);
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('Should not force-lock when alarm `when` is undefined', async () => {
            alarmWhen.mockResolvedValueOnce(undefined);
            expect(await shouldForceLock()).toBe(false);
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('should return `false` when no layer triggers', async () => {
            expect(await shouldForceLock()).toBe(false);
            expect(setLocal).not.toHaveBeenCalled();
        });

        test('should return `false` when in case of errors', async () => {
            getLocal.mockRejectedValueOnce(new Error('storage'));
            expect(await shouldForceLock()).toBe(false);
        });
    });
});

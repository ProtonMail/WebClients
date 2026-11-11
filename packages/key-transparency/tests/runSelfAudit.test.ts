import { CryptoProxy, type PrivateKeyReference } from '@protontech/crypto';
import { vi } from 'vitest';

import { APPS, HOUR, MINUTE, SECOND } from '@proton/shared/lib/constants';
import type { Address } from '@proton/shared/lib/interfaces/Address';
import type { Api } from '@proton/shared/lib/interfaces/Api';
import type { DecryptedKey } from '@proton/shared/lib/interfaces/Key';
import { type KTUserContext, KeyTransparencyActivation } from '@proton/shared/lib/interfaces/KeyTransparency';
import type { User } from '@proton/shared/lib/interfaces/User';

import type * as Utils from '../lib/helpers/utils';
import { KT_ERROR_TYPE, StaleEpochError, ktSentryReportError } from '../lib/helpers/utils';
import type { SelfAuditResult, SelfAuditState } from '../lib/interfaces';
import { reportSelfAuditErrors } from '../lib/shared/reportSelfAuditErrors';
import { getSelfAuditDelay, runSelfAudit } from '../lib/shared/runSelfAudit';
import { selfAudit } from '../lib/verification/self-audit/selfAudit';

// The audit itself verifies epochs and proofs from the API, what's tested here is what runs around it.
vi.mock('../lib/verification/self-audit/selfAudit', () => ({ selfAudit: vi.fn() }));
vi.mock('../lib/shared/reportSelfAuditErrors', () => ({ reportSelfAuditErrors: vi.fn() }));
vi.mock('../lib/helpers/utils', async (importOriginal) => ({
    ...(await importOriginal<typeof Utils>()),
    ktSentryReportError: vi.fn(),
}));

const mockedSelfAudit = vi.mocked(selfAudit);
const mockedReportSelfAuditErrors = vi.mocked(reportSelfAuditErrors);
const mockedKtSentryReportError = vi.mocked(ktSentryReportError);

const NOW = 1_700_000_000_000;
const SELF_AUDIT_INTERVAL = 4 * HOUR;

const api = vi.fn() as unknown as Api;

const getSelfAuditResult = (result: Partial<SelfAuditResult> = {}): SelfAuditResult => {
    return {
        auditTime: NOW,
        nextAuditTime: NOW + SELF_AUDIT_INTERVAL,
        addressAuditResults: [],
        localStorageAuditResultsOwnAddress: [],
        localStorageAuditResultsOtherAddress: [],
        ...result,
    };
};

const getFailedSelfAuditResult = (failedTrials: number) => {
    return getSelfAuditResult({ error: { failedTrials, tooManyRetries: false } });
};

const getIsKeyUsable = (key: PrivateKeyReference) => {
    return CryptoProxy.exportPublicKey({ key }).then(
        () => true,
        () => false
    );
};

const setup = async ({ hasUserKeys = true }: { hasUserKeys?: boolean } = {}) => {
    const userKey = await CryptoProxy.generateKey({ userIDs: { email: 'user@example.com' } });
    const addressKey = await CryptoProxy.generateKey({ userIDs: { email: 'address@example.com' } });
    const userKeys: DecryptedKey[] = hasUserKeys ? [{ ID: 'user-key', privateKey: userKey, publicKey: userKey }] : [];
    const addresses: SelfAuditState['addresses'] = [
        {
            address: { ID: 'address', Email: 'address@example.com' } as Address,
            addressKeys: [{ ID: 'address-key', Flags: 3, Primary: 1, privateKey: addressKey, publicKey: addressKey }],
        },
    ];
    const ktUserContext: KTUserContext = {
        ktActivation: KeyTransparencyActivation.SHOW_UI,
        appName: APPS.PROTONMAIL,
        getUser: async () => ({ ID: 'user' }) as User,
        getUserKeys: async () => userKeys,
    };
    return { ktUserContext, addresses, userKey, addressKey };
};

describe('runSelfAudit', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
        vi.restoreAllMocks();
    });

    it('audits copies of the keys, and clears them once done', async () => {
        const { ktUserContext, addresses, userKey, addressKey } = await setup();
        const clearKey = vi.spyOn(CryptoProxy, 'clearKey');
        mockedSelfAudit.mockResolvedValue(getSelfAuditResult());

        await runSelfAudit({ ktUserContext, api, addresses, lastSelfAudit: undefined });

        // The copies themselves can't be used here: unlike the worker, the in-process test endpoint
        // keeps the buffers it imports keys from, and runSelfAudit zeroes those buffers afterwards.
        const [{ state }] = mockedSelfAudit.mock.calls[0];
        const userKeyCopy = state.userKeys[0].privateKey;
        const addressKeyCopy = state.addresses[0].addressKeys[0];
        expect(userKeyCopy).not.toBe(userKey);
        expect(userKeyCopy.getFingerprint()).toBe(userKey.getFingerprint());
        expect(addressKeyCopy).toMatchObject({ ID: 'address-key', Flags: 3, Primary: 1 });
        expect(addressKeyCopy.privateKey).not.toBe(addressKey);
        expect(addressKeyCopy.privateKey.getFingerprint()).toBe(addressKey.getFingerprint());
        expect(state.addresses[0].address).toBe(addresses[0].address);

        expect(clearKey).toHaveBeenCalledTimes(2);
        expect(clearKey).toHaveBeenCalledWith({ key: userKeyCopy });
        expect(clearKey).toHaveBeenCalledWith({ key: addressKeyCopy.privateKey });
        expect(await getIsKeyUsable(userKey)).toBe(true);
        expect(await getIsKeyUsable(addressKey)).toBe(true);
    });

    it('returns the result of the audit and reports its errors', async () => {
        const { ktUserContext, addresses } = await setup();
        const selfAuditResult = getSelfAuditResult();
        mockedSelfAudit.mockResolvedValue(selfAuditResult);

        const result = await runSelfAudit({ ktUserContext, api, addresses, lastSelfAudit: undefined });

        expect(result).toBe(selfAuditResult);
        expect(mockedReportSelfAuditErrors).toHaveBeenCalledWith({
            selfAuditResult,
            api,
            ktActivation: KeyTransparencyActivation.SHOW_UI,
        });
        expect(mockedKtSentryReportError).not.toHaveBeenCalled();
    });

    it('retries a failed audit with an exponential backoff', async () => {
        const { ktUserContext, addresses } = await setup();
        const error = new Error('Epoch could not be verified');
        mockedSelfAudit.mockRejectedValue(error);

        const selfAuditResult = await runSelfAudit({
            ktUserContext,
            api,
            addresses,
            lastSelfAudit: getFailedSelfAuditResult(2),
        });

        // The third failure in a row retries 2^3 minutes later
        expect(selfAuditResult).toEqual(
            getSelfAuditResult({
                nextAuditTime: NOW + 8 * MINUTE,
                error: { failedTrials: 3, tooManyRetries: false },
            })
        );
        expect(mockedKtSentryReportError).toHaveBeenCalledWith(error, KT_ERROR_TYPE.LOCAL, { context: 'runSelfAudit' });
        expect(mockedReportSelfAuditErrors).toHaveBeenCalledWith({
            selfAuditResult,
            api,
            ktActivation: KeyTransparencyActivation.SHOW_UI,
        });
    });

    it('does not report a stale epoch to Sentry', async () => {
        const { ktUserContext, addresses } = await setup();
        mockedSelfAudit.mockRejectedValue(new StaleEpochError());

        const selfAuditResult = await runSelfAudit({ ktUserContext, api, addresses, lastSelfAudit: undefined });

        expect(selfAuditResult.nextAuditTime).toBe(NOW + 2 * MINUTE);
        expect(selfAuditResult.error).toEqual({ failedTrials: 1, tooManyRetries: false });
        expect(mockedKtSentryReportError).not.toHaveBeenCalled();
    });

    it('falls back to the regular interval after too many failures, and reports even a stale epoch', async () => {
        const { ktUserContext, addresses } = await setup();
        const error = new StaleEpochError();
        mockedSelfAudit.mockRejectedValue(error);

        const selfAuditResult = await runSelfAudit({
            ktUserContext,
            api,
            addresses,
            lastSelfAudit: getFailedSelfAuditResult(5),
        });

        // The count starts over, so the next failure backs off from the start
        expect(selfAuditResult.nextAuditTime).toBe(NOW + SELF_AUDIT_INTERVAL);
        expect(selfAuditResult.error).toEqual({ failedTrials: 0, tooManyRetries: true });
        expect(mockedKtSentryReportError).toHaveBeenCalledWith(error, KT_ERROR_TYPE.LOCAL, { context: 'runSelfAudit' });
    });

    it('rejects when the user has no keys, after clearing the copied address keys', async () => {
        const { ktUserContext, addresses } = await setup({ hasUserKeys: false });
        const clearKey = vi.spyOn(CryptoProxy, 'clearKey');

        await expect(runSelfAudit({ ktUserContext, api, addresses, lastSelfAudit: undefined })).rejects.toThrow(
            'User has no user keys'
        );

        expect(mockedSelfAudit).not.toHaveBeenCalled();
        expect(clearKey).toHaveBeenCalledTimes(1);
    });
});

describe('getSelfAuditDelay', () => {
    beforeEach(() => {
        vi.useFakeTimers({ toFake: ['Date'] });
        vi.setSystemTime(NOW);
    });

    afterEach(() => {
        vi.useRealTimers();
    });

    it('waits until the next audit time', () => {
        expect(getSelfAuditDelay(getSelfAuditResult({ nextAuditTime: NOW + HOUR }))).toBe(HOUR);
    });

    it('is short when there is no previous audit', () => {
        expect(getSelfAuditDelay(undefined)).toBe(10 * SECOND);
    });

    it('is short when the next audit is overdue', () => {
        expect(getSelfAuditDelay(getSelfAuditResult({ nextAuditTime: NOW - HOUR }))).toBe(10 * SECOND);
    });
});

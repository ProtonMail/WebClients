import { renderHook } from '@testing-library/react';
import { getUnixTime, subDays } from 'date-fns';

import type { UserModel } from '@proton/shared/lib/interfaces/User';
import { buildUser } from '@proton/shared/testing/buildUser';
import { MailFeatureFlag } from '@proton/unleash/Flags';

import type useAssistantSubscriptionStatusType from './useAssistantSubscriptionStatus';

const mockUseUser = jest.fn();
const mockUseFlag = jest.fn();
const mockUseFeature = jest.fn();
const mockUpdate = jest.fn();
const mockCreateNotification = jest.fn();
const mockSendFreeTrialStart = jest.fn();

jest.mock('@proton/account/user/hooks', () => ({ useUser: () => mockUseUser() }));
jest.mock('@proton/unleash/useFlag', () => ({ useFlag: (name: string) => mockUseFlag(name) }));
jest.mock('@proton/features/useFeature', () => ({ __esModule: true, default: () => mockUseFeature() }));
jest.mock('@proton/app-context/useNotifications', () => ({
    useNotifications: () => ({ createNotification: mockCreateNotification }),
}));
jest.mock('./useAssistantTelemetry', () => ({
    __esModule: true,
    default: () => ({ sendFreeTrialStart: mockSendFreeTrialStart }),
}));

const NOW = new Date('2026-11-11T12:00:00Z');

const paidUser = buildUser();
const freeUser = buildUser({ Subscribed: 0, isFree: true, isPaid: false, hasPaidMail: false });

const setup = ({
    user = paidUser,
    scribeToLumo,
    trialStartedDaysAgo,
}: {
    user?: UserModel;
    scribeToLumo: boolean;
    trialStartedDaysAgo?: number;
}) => {
    mockUseUser.mockReturnValue([user]);
    mockUseFlag.mockImplementation((name: string) => name === MailFeatureFlag.ScribeToLumo && scribeToLumo);
    const Value = trialStartedDaysAgo === undefined ? 0 : getUnixTime(subDays(NOW, trialStartedDaysAgo));
    mockUseFeature.mockReturnValue({ feature: { Value }, update: mockUpdate });
};

// A fresh module per test resets the module-level `started` guard
const renderFreshHook = () => {
    let useAssistantSubscriptionStatus: typeof useAssistantSubscriptionStatusType | undefined;
    jest.isolateModules(() => {
        useAssistantSubscriptionStatus = require('./useAssistantSubscriptionStatus').default;
    });
    return renderHook(() => useAssistantSubscriptionStatus!()).result.current;
};

const getTrialStatus = () => renderFreshHook().trialStatus;

describe('useAssistantSubscriptionStatus', () => {
    beforeEach(() => {
        jest.useFakeTimers().setSystemTime(NOW);
        jest.clearAllMocks();
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    describe.each([false, true])('ScribeToLumo %s', (scribeToLumo) => {
        it('gives trial-ongoing for a trial started 5 days ago', () => {
            setup({ scribeToLumo, trialStartedDaysAgo: 5 });
            expect(getTrialStatus()).toBe('trial-ongoing');
        });

        it('gives trial-ended for a trial started 15 days ago', () => {
            setup({ scribeToLumo, trialStartedDaysAgo: 15 });
            expect(getTrialStatus()).toBe('trial-ended');
        });

        it.each([
            ['NumAI', buildUser({ NumAI: 1 })],
            ['NumLumo', buildUser({ NumLumo: 1 })],
        ])('gives is-paid with %s', (_, user) => {
            setup({ user, scribeToLumo });
            expect(getTrialStatus()).toBe('is-paid');
        });

        it('gives no-trial for a free user, even with a trial date', () => {
            setup({ user: freeUser, scribeToLumo, trialStartedDaysAgo: 5 });
            expect(getTrialStatus()).toBe('no-trial');
        });
    });

    describe('ScribeToLumo off', () => {
        it('gives trial-not-started for a paid user with no trial date', () => {
            setup({ scribeToLumo: false });
            expect(getTrialStatus()).toBe('trial-not-started');
        });

        it('writes the trial start date once when start is called twice', async () => {
            setup({ scribeToLumo: false });
            const { start } = renderFreshHook();

            await start();
            await start();

            expect(mockUpdate).toHaveBeenCalledTimes(1);
            expect(mockUpdate).toHaveBeenCalledWith(getUnixTime(NOW));
            expect(mockCreateNotification).toHaveBeenCalledTimes(1);
            expect(mockSendFreeTrialStart).toHaveBeenCalledTimes(1);
        });
    });

    describe('ScribeToLumo on', () => {
        it('gives no-trial for a paid user with no trial date', () => {
            setup({ scribeToLumo: true });
            expect(getTrialStatus()).toBe('no-trial');
        });

        it('does not start a trial', async () => {
            setup({ scribeToLumo: true });
            const { start } = renderFreshHook();

            await start();

            expect(mockUpdate).not.toHaveBeenCalled();
            expect(mockCreateNotification).not.toHaveBeenCalled();
            expect(mockSendFreeTrialStart).not.toHaveBeenCalled();
        });
    });
});

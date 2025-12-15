import { renderHook } from '@testing-library/react';
import { getUnixTime, subDays } from 'date-fns';

import { useUserSettings } from '@proton/account';
import { useUser } from '@proton/account/user/hooks';
import { useFeature } from '@proton/features';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';
import { useFlag } from '@proton/unleash';

import { NPSApplication } from '../interface';
import { useNPSEligiblity } from './useNPSEligibility';

interface EligibilityMockConfig {
    featureValue?: boolean;
    notificationsEnabled?: boolean;
    flagEnabled?: boolean;
    accountAgeDays?: number;
}

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.Mock;

jest.mock('@proton/account/userSettings/hooks');
const mockUseUserSettings = useUserSettings as jest.Mock;

jest.mock('@proton/unleash');
const mockUseFlag = useFlag as jest.Mock;

jest.mock('@proton/features', () => ({
    ...jest.requireActual('@proton/features/interface'),
    useFeature: jest.fn(),
}));
const mockUseFeature = useFeature as jest.Mock;

const daysAgo = (days: number) => getUnixTime(subDays(new Date(), days));

const createMockConfig = (overrides: EligibilityMockConfig = {}) => ({
    featureValue: true,
    notificationsEnabled: true,
    flagEnabled: true,
    accountAgeDays: 31,
    ...overrides,
});

const setupMocks = (overrides: EligibilityMockConfig = {}) => {
    const config = createMockConfig(overrides);

    mockUseFeature.mockReturnValue(
        config.featureValue !== undefined ? { feature: { Value: config.featureValue } } : {}
    );
    mockUseUserSettings.mockReturnValue([
        { News: config.notificationsEnabled ? NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS : 0 },
    ]);
    mockUseFlag.mockReturnValue(config.flagEnabled);
    mockUseUser.mockReturnValue([{ CreateTime: daysAgo(config.accountAgeDays) }]);
};

describe('Net promoters score eligibility', () => {
    afterEach(() => {
        jest.resetAllMocks();
    });

    it('should call all inner hooks', () => {
        setupMocks();

        renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(mockUseFeature).toHaveBeenCalledWith('NPSFeedbackWebMail');
        expect(mockUseUserSettings).toHaveBeenCalled();
        expect(mockUseFlag).toHaveBeenCalledWith('WebNPSModal');
        expect(mockUseUser).toHaveBeenCalled();
    });

    it('should be eligible when all conditions are met', () => {
        setupMocks();

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBe(true);
    });

    it('should not be eligible if account is younger than 30 days', () => {
        setupMocks({ accountAgeDays: 20 });

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBe(false);
    });

    it('should not be eligible if in-app notifications are disabled', () => {
        setupMocks({ notificationsEnabled: false });

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBe(false);
    });

    it('should not be eligible if WebNPSModal feature flag is off', () => {
        setupMocks({ flagEnabled: false });

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBe(false);
    });

    it('should not be eligible if feature value is false', () => {
        setupMocks({ featureValue: false });

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBe(false);
    });

    it('should not be eligible if feature is missing', () => {
        setupMocks({ featureValue: undefined });

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBeFalsy();
    });

    it('should not be eligible if user.CreateTime is undefined', () => {
        setupMocks();
        mockUseUser.mockReturnValue([{}]);

        const { result } = renderHook(() => useNPSEligiblity(NPSApplication.WebMail));

        expect(result.current).toBe(false);
    });
});

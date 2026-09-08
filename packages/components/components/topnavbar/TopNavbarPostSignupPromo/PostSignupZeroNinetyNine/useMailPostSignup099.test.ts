import { renderHook } from '@testing-library/react';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useConfig } from '@proton/app-context/useConfig';
import { FeatureCode, useFeature } from '@proton/features';
import { APPS } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash/useFlag';

import { useMailPostSignup099 } from './useMailPostSignup099';

jest.mock('react-router', () => {
    return { useLocation: () => ({ pathname: '/inbox' }) };
});

jest.mock('@proton/account/user/hooks');
const mockUseUser = useUser as jest.Mock;

jest.mock('@proton/account/subscription/hooks');
const mockUseSubscription = useSubscription as jest.Mock;

jest.mock('@proton/app-context/useConfig');
const mockUseConfig = useConfig as jest.Mock;

jest.mock('@proton/features');
const mockUseFeature = useFeature as jest.Mock;

jest.mock('@proton/unleash/useFlag');
const mockUseFlag = useFlag as jest.Mock;

const setFeatures = ({ hideOffer = false }: { hideOffer?: boolean }) => {
    mockUseFeature.mockImplementation((code: FeatureCode) => {
        if (code === FeatureCode.HideMailPostSignupZeroNinetyNineOffer) {
            return { feature: { Value: hideOffer }, loading: false };
        }

        return { feature: { Value: { offerStartDate: 0, automaticOfferReminders: 0 } }, loading: false };
    });
};

describe('useMailPostSignup099', () => {
    beforeEach(() => {
        mockUseUser.mockReturnValue([{ isFree: true, isDelinquent: false, canPay: true, Flags: {} }, false]);
        mockUseSubscription.mockReturnValue([undefined, false]);
        mockUseConfig.mockReturnValue({ APP_NAME: APPS.PROTONMAIL });
        mockUseFlag.mockReturnValue(true);
        setFeatures({});
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should be eligible when the flag is on and the offer has not been dismissed', () => {
        const { result } = renderHook(() => useMailPostSignup099());
        expect(result.current.isEligible).toBeTruthy();
    });

    it('should not be eligible when the flag is off', () => {
        mockUseFlag.mockReturnValue(false);

        const { result } = renderHook(() => useMailPostSignup099());
        expect(result.current.isEligible).toBeFalsy();
    });

    it('should not be eligible once the user has permanently dismissed the offer', () => {
        setFeatures({ hideOffer: true });

        const { result } = renderHook(() => useMailPostSignup099());
        expect(result.current.isEligible).toBeFalsy();
    });

    it('should stay dismissed after the flag is toggled off and back on', () => {
        // Turning the offer off and on again must not resurface it for anyone who opted
        // out, since the dismissal lives in its own feature flag
        setFeatures({ hideOffer: true });

        mockUseFlag.mockReturnValue(false);
        const { result: offResult } = renderHook(() => useMailPostSignup099());
        expect(offResult.current.isEligible).toBeFalsy();

        mockUseFlag.mockReturnValue(true);
        const { result: backOnResult } = renderHook(() => useMailPostSignup099());
        expect(backOnResult.current.isEligible).toBeFalsy();
    });
});

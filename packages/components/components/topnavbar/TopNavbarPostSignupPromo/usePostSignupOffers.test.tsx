import { renderHook } from '@testing-library/react';

import { APPS } from '@proton/shared/lib/constants';

import { useAlwaysOnUpsell } from './AlwaysOnUpsell/useAlwaysOnUpsell';
import { useGoUnlimited2025 } from './GoUnlimitedOffer/hooks/useGoUnlimited2025';
import { useMailSubscriptionReminder } from './MailSubscriptionReminder/useMailSubscriptionReminder';
import { usePaidUsersNudge } from './PaidUsersNudge/hooks/usePaidUsersNudge';
import { useDrivePostSignupOneDollar } from './PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollar';
import { useMailPostSignupOneDollar } from './PostSignupOneDollar/MailPostSignupOneDollar/useMailPostSignupOneDollar';
import { usePostSignupOffers } from './usePostSignupOffers';

jest.mock('./PostSignupOneDollar/MailPostSignupOneDollar/useMailPostSignupOneDollar');
const mockUseMailPostSignupOneDollar = useMailPostSignupOneDollar as jest.Mock;

jest.mock('./PostSignupOneDollar/DrivePostSignupOneDollar/useDrivePostSignupOneDollar');
const mockUseDrivePostSignupOneDollar = useDrivePostSignupOneDollar as jest.Mock;

jest.mock('./AlwaysOnUpsell/useAlwaysOnUpsell');
const mockUseAlwaysOnUpsell = useAlwaysOnUpsell as jest.Mock;

jest.mock('./MailSubscriptionReminder/useMailSubscriptionReminder');
const mockUseMailSubscriptionReminder = useMailSubscriptionReminder as jest.Mock;

jest.mock('./PaidUsersNudge/hooks/usePaidUsersNudge');
const mockUsePaidUsersNudge = usePaidUsersNudge as jest.Mock;

jest.mock('./GoUnlimitedOffer/hooks/useGoUnlimited2025');
const mockUseGoUnlimited2025 = useGoUnlimited2025 as jest.Mock;

describe('usePostSignupOffers', () => {
    beforeEach(() => {
        mockUseMailPostSignupOneDollar.mockReturnValue({
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        });

        mockUseDrivePostSignupOneDollar.mockReturnValue({
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        });

        mockUseAlwaysOnUpsell.mockReturnValue({
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        });

        mockUseMailSubscriptionReminder.mockReturnValue({
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        });

        mockUsePaidUsersNudge.mockReturnValue({
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        });

        mockUseGoUnlimited2025.mockReturnValue({
            isEligible: false,
            isLoading: false,
            openSpotlight: false,
        });
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should return the mail post-signup offer when user is eligible for both mail offer and always-on upsell', () => {
        mockUseMailPostSignupOneDollar.mockReturnValue({
            isEligible: true,
            isLoading: false,
            openSpotlight: false,
        });

        mockUseAlwaysOnUpsell.mockReturnValue({
            isEligible: true,
            isLoading: false,
            openSpotlight: false,
        });

        const { result } = renderHook(() => usePostSignupOffers({ app: APPS.PROTONMAIL }));
        expect(result.current.id).toBe('mail-one-dollar-offer');
    });

    it('should return always-on upsell when mail post-signup offer is not eligible but always-on is', () => {
        mockUseAlwaysOnUpsell.mockReturnValue({
            isEligible: true,
            isLoading: false,
            openSpotlight: false,
        });

        const { result } = renderHook(() => usePostSignupOffers({ app: APPS.PROTONMAIL }));
        expect(result.current.id).toBe('always-on-upsell');
    });

    it('should return undefined when neither offer is eligible', () => {
        const { result } = renderHook(() => usePostSignupOffers({ app: APPS.PROTONMAIL }));
        expect(result.current.id).toBeUndefined();
    });
});

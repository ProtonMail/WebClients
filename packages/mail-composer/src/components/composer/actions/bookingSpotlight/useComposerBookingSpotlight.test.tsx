import { renderHook } from '@testing-library/react';
import type { Mock, MockedFunction } from 'vitest';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';

import { useComposerBookingSpotlight } from './useComposerBookingSpotlight';

vi.mock('@proton/account/userSettings/hooks');
const mockedUseUserSettings = useUserSettings as Mock<any>;

vi.mock('@proton/components/hooks/useSpotlightOnFeature');
const mockedUseSpotlightOnFeature = useSpotlightOnFeature as MockedFunction<typeof useSpotlightOnFeature>;

vi.mock('@proton/components/components/spotlight/useSpotlightShow', () => ({
    __esModule: true,
    default: (show: boolean) => show,
}));

const getInitialShow = () => {
    return mockedUseSpotlightOnFeature.mock.calls.at(-1)?.[1];
};

describe('useComposerBookingSpotlight', () => {
    beforeEach(() => {
        mockedUseUserSettings.mockReturnValue([{ News: NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS }]);
        mockedUseSpotlightOnFeature.mockReturnValue({ show: true, onDisplayed: vi.fn(), onClose: vi.fn() });
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    it('should allow the spotlight when the composer is rich text', () => {
        renderHook(() => useComposerBookingSpotlight(false, true, false));

        expect(getInitialShow()).toBe(true);
    });

    it('should suppress the spotlight when the composer is plaintext', () => {
        renderHook(() => useComposerBookingSpotlight(false, true, true));

        expect(getInitialShow()).toBe(false);
    });
});

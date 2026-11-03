import { renderHook } from '@testing-library/react-hooks';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import useSpotlightOnFeature from '@proton/components/hooks/useSpotlightOnFeature';
import { NEWSLETTER_SUBSCRIPTIONS_BITS } from '@proton/shared/lib/helpers/newsletter';

import { useComposerBookingSpotlight } from './useComposerBookingSpotlight';

jest.mock('@proton/account/userSettings/hooks');
const mockedUseUserSettings = useUserSettings as jest.MockedFunction<any>;

jest.mock('@proton/components/hooks/useSpotlightOnFeature');
const mockedUseSpotlightOnFeature = useSpotlightOnFeature as jest.MockedFunction<typeof useSpotlightOnFeature>;

jest.mock('@proton/components/components/spotlight/useSpotlightShow', () => {
    return (show: boolean) => {
        return show;
    };
});

const getInitialShow = () => {
    return mockedUseSpotlightOnFeature.mock.calls.at(-1)?.[1];
};

describe('useComposerBookingSpotlight', () => {
    beforeEach(() => {
        mockedUseUserSettings.mockReturnValue([{ News: NEWSLETTER_SUBSCRIPTIONS_BITS.IN_APP_NOTIFICATIONS }]);
        mockedUseSpotlightOnFeature.mockReturnValue({ show: true, onDisplayed: jest.fn(), onClose: jest.fn() });
    });

    afterEach(() => {
        jest.clearAllMocks();
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

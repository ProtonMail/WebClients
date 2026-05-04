import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderHook } from '@testing-library/react-hooks';

import { useDynamicFavicon } from '@proton/components/hooks/useDynamicFavicon';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { DEFAULT_MAIL_SETTINGS, UNREAD_FAVICON } from '@proton/shared/lib/mail/mailSettings';

import { useMailboxCounter } from 'proton-mail/hooks/mailboxCounter/useMailboxCounter';

import { useMailboxFavicon } from './useMailboxFavicon';

jest.mock('@proton/components/hooks/useDynamicFavicon', () => ({
    useDynamicFavicon: jest.fn(),
}));

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as jest.Mock;

jest.mock('proton-mail/hooks/mailboxCounter/useMailboxCounter');
const mockUseMailboxCounter = useMailboxCounter as jest.Mock;

const mockBaseFavicon = 'mock-base-favicon';
const mockFavicons = {
    1: 'favicon-1',
    2: 'favicon-2',
    10: 'favicon-10',
    50: 'favicon-50',
    99: 'favicon-99',
    100: 'favicon-100+',
};

jest.mock('../../../assets/favicons', () => {
    return {
        __esModule: true,
        default: {
            1: 'favicon-1',
            2: 'favicon-2',
            10: 'favicon-10',
            50: 'favicon-50',
            99: 'favicon-99',
            100: 'favicon-100+',
        },
        baseFavicon: 'mock-base-favicon',
    };
});

const mockUnreadCount = (unread: number) => {
    mockUseMailboxCounter.mockReturnValue({
        loading: false,
        counterMap: {},
        getLocationCount: jest.fn(),
        getCurrentLocationCount: jest.fn().mockReturnValue({ Unread: unread, Total: unread }),
    });
};

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useMailboxFavicon', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use baseFavicon when there are no unread messages', () => {
        mockUnreadCount(0);
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useMailboxFavicon(), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockBaseFavicon);
    });

    it('should use the correct favicon when there are 10 unread messages', () => {
        mockUnreadCount(10);
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useMailboxFavicon(), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockFavicons[10]);
    });

    it('should use the last favicon when there are more than 100 unread messages', () => {
        mockUnreadCount(200);
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: UNREAD_FAVICON.ENABLED }]);

        renderHook(() => useMailboxFavicon(), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockFavicons[100]);
    });

    it('should use baseFavicon when the favicon is disabled', () => {
        mockUnreadCount(10);
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: UNREAD_FAVICON.DISABLED }]);

        renderHook(() => useMailboxFavicon(), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockBaseFavicon);
    });
});

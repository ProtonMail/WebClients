import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderHook } from '@testing-library/react-hooks';

import { useDynamicFavicon } from '@proton/components';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS, UNREAD_FAVICON, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useMailboxFavicon } from './useMailboxFavicon';

jest.mock('@proton/components', () => ({
    useDynamicFavicon: jest.fn(),
}));

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as jest.Mock;

jest.mock('@proton/mail/store/counts/conversationCountsSlice');
const mockUseConversationCounts = useConversationCounts as jest.Mock;

jest.mock('@proton/mail/store/labels/hooks', () => ({
    useLabels: jest.fn(),
    useFolders: jest.fn(),
    useSystemFolders: jest.fn(),
}));

jest.mock('@proton/mail/store/counts/conversationCountsSlice', () => ({
    useConversationCounts: jest.fn(),
}));

jest.mock('@proton/mail/store/counts/messageCountsSlice');
const mockUseMessageCounts = useMessageCounts as jest.Mock;

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

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useMailboxFavicon', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should use baseFavicon when there are no unread messages', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.GROUP, UnreadFavicon: UNREAD_FAVICON.ENABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockBaseFavicon);
    });

    it('should use the correct favicon when there are 10 unread messages in conversation mode', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 10 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.GROUP, UnreadFavicon: UNREAD_FAVICON.ENABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockFavicons[10]);
    });

    it('should use the correct favicon when there are 10 unread messages in message mode', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 10 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.SINGLE, UnreadFavicon: UNREAD_FAVICON.ENABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockFavicons[10]);
    });

    it('should use the last favicon when there are more than 100 unread messages in conversation mode', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 200 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.GROUP, UnreadFavicon: UNREAD_FAVICON.ENABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockFavicons[100]);
    });

    it('should use the last favicon when there are more than 100 unread messages in message mode', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 200 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.SINGLE, UnreadFavicon: UNREAD_FAVICON.ENABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockFavicons[100]);
    });

    it('should use baseFavicon when the favicon is disabled in conversation mode', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 10 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.GROUP, UnreadFavicon: UNREAD_FAVICON.DISABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockBaseFavicon);
    });

    it('should use baseFavicon when the favicon is disabled in message mode', () => {
        mockUseConversationCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 0 }]]);
        mockUseMessageCounts.mockReturnValue([[{ LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: 10 }]]);
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, ViewMode: VIEW_MODE.SINGLE, UnreadFavicon: UNREAD_FAVICON.DISABLED },
        ]);

        renderHook(() => useMailboxFavicon(MAILBOX_LABEL_IDS.INBOX), { wrapper });

        expect(useDynamicFavicon).toHaveBeenCalledWith(mockBaseFavicon);
    });
});

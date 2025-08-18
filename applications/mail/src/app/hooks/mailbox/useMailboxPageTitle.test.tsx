import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderHook } from '@testing-library/react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAILSETTINGS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useMailboxPageTitle } from './useMailboxPageTitle';

const EMAIL = 'testing@example.com';
const UNREAD_COUNT = 10;
const LABEL_NAME = 'Inbox';

jest.mock('@proton/mail/store/labels/hooks', () => ({
    useLabels: jest.fn().mockReturnValue([]),
    useFolders: jest.fn().mockReturnValue([]),
}));

jest.mock('@proton/account/user/hooks', () => ({
    useUser: jest.fn().mockReturnValue([{ Email: EMAIL }]),
}));

jest.mock('@proton/mail/store/counts/messageCountsSlice', () => ({
    useMessageCounts: jest.fn().mockReturnValue([[{ LabelID: '0', Unread: UNREAD_COUNT, Total: 11 }]]),
}));

jest.mock('@proton/mail/store/counts/conversationCountsSlice', () => ({
    useConversationCounts: jest.fn().mockReturnValue([[{ LabelID: '0', Unread: UNREAD_COUNT, Total: 11 }]]),
}));

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as jest.Mock;

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useMailboxPageTitle', () => {
    afterEach(() => {
        jest.clearAllMocks();
        document.title = '';
    });

    it('Should display the unread count when the favicon is disabled in conversation mode', () => {
        mockUseMailSettings.mockReturnValue([
            {
                ...DEFAULT_MAILSETTINGS,
                UnreadFavicon: 0,
            },
        ]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`(${UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should not display the unread count when the favicon is enabled in conversation mode', () => {
        mockUseMailSettings.mockReturnValue([
            {
                ...DEFAULT_MAILSETTINGS,
                UnreadFavicon: 1,
            },
        ]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should display the unread count when the favicon is disabled in message mode', () => {
        mockUseMailSettings.mockReturnValue([
            {
                ...DEFAULT_MAILSETTINGS,
                UnreadFavicon: 0,
                ViewMode: VIEW_MODE.SINGLE,
            },
        ]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`(${UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should not display the unread count when the favicon is enabled in message mode', () => {
        mockUseMailSettings.mockReturnValue([
            {
                ...DEFAULT_MAILSETTINGS,
                UnreadFavicon: 1,
                ViewMode: VIEW_MODE.SINGLE,
            },
        ]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });
});

import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useMailboxPageTitle } from './useMailboxPageTitle';

const EMAIL = 'testing@example.com';
const INBOX_UNREAD_COUNT = 10;
const CATEGORY_DEFAULT_UNREAD_COUNT = 12;
const CATEGORY_PROMOTIONS_UNREAD_COUNT = 13;
const LABEL_NAME = 'Inbox';

jest.mock('@proton/mail/store/labels/hooks');
jest.mock('@proton/account/user/hooks');
jest.mock('@proton/mail/store/counts/messageCountsSlice');
jest.mock('@proton/mail/store/counts/conversationCountsSlice');
jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('proton-mail/store/hooks');
jest.mock('proton-mail/components/categoryView/useCategoriesView');

jest.mocked(useLabels).mockReturnValue([undefined, false]);
jest.mocked(useFolders).mockReturnValue([undefined, false]);
jest.mocked(useUser).mockReturnValue([{ Email: EMAIL }, false] as ReturnType<typeof useUser>);
jest.mocked(useMessageCounts).mockReturnValue([
    [
        { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: INBOX_UNREAD_COUNT, Total: 11 },
        { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Unread: CATEGORY_DEFAULT_UNREAD_COUNT, Total: 11 },
        { LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: CATEGORY_PROMOTIONS_UNREAD_COUNT, Total: 11 },
    ],
    false,
]);
jest.mocked(useConversationCounts).mockReturnValue([
    [
        { LabelID: MAILBOX_LABEL_IDS.INBOX, Unread: INBOX_UNREAD_COUNT, Total: 11 },
        { LabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, Unread: CATEGORY_DEFAULT_UNREAD_COUNT, Total: 11 },
        { LabelID: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, Unread: CATEGORY_PROMOTIONS_UNREAD_COUNT, Total: 11 },
    ],
    false,
]);
const mockUseMailSettings = jest.mocked(useMailSettings);
const mockUseMailSelector = jest.mocked(useMailSelector);
const mockUseCategoriesView = jest.mocked(useCategoriesView);

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useMailboxPageTitle', () => {
    beforeEach(() => {
        mockUseMailSelector.mockReturnValue([]);
        mockUseCategoriesView.mockReturnValue({ categoryViewAccess: false } as ReturnType<typeof useCategoriesView>);
    });

    afterEach(() => {
        jest.clearAllMocks();
        document.title = '';
    });

    describe('category view tests', () => {
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 0 }, false]);

        it('should return the primary label count when on default category', () => {
            mockUseMailSelector.mockReturnValue([MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]);
            mockUseCategoriesView.mockReturnValue({ categoryViewAccess: true } as ReturnType<typeof useCategoriesView>);

            renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
            expect(document.title).toBe(`(${CATEGORY_DEFAULT_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
        });

        it('should return the promotion label count when on default category', () => {
            mockUseMailSelector.mockReturnValue([MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS]);
            mockUseCategoriesView.mockReturnValue({ categoryViewAccess: true } as ReturnType<typeof useCategoriesView>);

            renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
            expect(document.title).toBe(`(${CATEGORY_PROMOTIONS_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
        });

        it('should return the primary count if multiple categories in the array', () => {
            mockUseMailSelector.mockReturnValue([
                MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            ]);
            mockUseCategoriesView.mockReturnValue({ categoryViewAccess: true } as ReturnType<typeof useCategoriesView>);

            renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
            expect(document.title).toBe(`(${CATEGORY_DEFAULT_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
        });
    });

    it('Should display the unread count when the favicon is disabled in conversation mode', () => {
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 0 }, false]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`(${INBOX_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should not display the unread count when the favicon is enabled in conversation mode', () => {
        mockUseMailSettings.mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 1 }, false]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should display the unread count when the favicon is disabled in message mode', () => {
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 0, ViewMode: VIEW_MODE.SINGLE },
            false,
        ]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`(${INBOX_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should not display the unread count when the favicon is enabled in message mode', () => {
        mockUseMailSettings.mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 1, ViewMode: VIEW_MODE.SINGLE },
            false,
        ]);

        renderHook(() => useMailboxPageTitle(MAILBOX_LABEL_IDS.INBOX), { wrapper });
        expect(document.title).toBe(`${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });
});

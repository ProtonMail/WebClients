import type { ReactNode } from 'react';
import { MemoryRouter } from 'react-router-dom';

import { renderHook } from '@testing-library/react';

import { useUser } from '@proton/account/user/hooks';
import { useFolders, useLabels } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useMailSelector } from '../../../store/hooks';
import { useMailboxCounter } from '../../mailboxCounter/useMailboxCounter';
import { useMailboxPageTitle } from './useMailboxPageTitle';

const EMAIL = 'testing@example.com';
const INBOX_UNREAD_COUNT = 10;
const CATEGORY_DEFAULT_UNREAD_COUNT = 12;
const LABEL_NAME = 'Inbox';

vi.mock('@proton/mail/store/labels/hooks');
vi.mock('@proton/account/user/hooks');
vi.mock('@proton/mail/store/mailSettings/hooks');
vi.mock('../../../store/hooks');
vi.mock('../../mailboxCounter/useMailboxCounter');

vi.mocked(useLabels).mockReturnValue([undefined, false]);
vi.mocked(useFolders).mockReturnValue([undefined, false]);
vi.mocked(useUser).mockReturnValue([{ Email: EMAIL }, false] as ReturnType<typeof useUser>);

const wrapper = ({ children }: { children: ReactNode }) => <MemoryRouter>{children}</MemoryRouter>;

describe('useMailboxPageTitle', () => {
    beforeEach(() => {
        vi.mocked(useMailSelector).mockReturnValue(MAILBOX_LABEL_IDS.INBOX);
        vi.mocked(useMailboxCounter).mockReturnValue({
            loading: false,
            getLocationCount: vi.fn().mockReturnValue({ Unread: INBOX_UNREAD_COUNT, Total: 7 }),
            getCurrentLocationCount: vi.fn().mockReturnValue({ Unread: INBOX_UNREAD_COUNT, Total: 11 }),
        });
    });

    afterEach(() => {
        vi.clearAllMocks();
        document.title = '';
    });

    describe('category view tests', () => {
        vi.mocked(useMailSettings).mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 0, MailCategoryView: true },
            false,
        ]);

        vi.mocked(useMailSelector).mockReturnValue(MAILBOX_LABEL_IDS.INBOX);

        it('should return the primary label count when on default category', () => {
            vi.mocked(useMailboxCounter).mockReturnValue({
                loading: false,
                getLocationCount: vi.fn().mockReturnValue({ Unread: CATEGORY_DEFAULT_UNREAD_COUNT, Total: 7 }),
                getCurrentLocationCount: vi.fn().mockReturnValue({ Unread: INBOX_UNREAD_COUNT, Total: 11 }),
            });
            renderHook(() => useMailboxPageTitle(), { wrapper });
            expect(document.title).toBe(`(${CATEGORY_DEFAULT_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
        });
    });

    it('Should display the unread count when the favicon is disabled in conversation mode', () => {
        vi.mocked(useMailSettings).mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 0 }, false]);

        renderHook(() => useMailboxPageTitle(), { wrapper });
        expect(document.title).toBe(`(${INBOX_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should not display the unread count when the favicon is enabled in conversation mode', () => {
        vi.mocked(useMailSettings).mockReturnValue([{ ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 1 }, false]);

        renderHook(() => useMailboxPageTitle(), { wrapper });
        expect(document.title).toBe(`${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should display the unread count when the favicon is disabled in message mode', () => {
        vi.mocked(useMailSettings).mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 0, ViewMode: VIEW_MODE.SINGLE },
            false,
        ]);

        renderHook(() => useMailboxPageTitle(), { wrapper });
        expect(document.title).toBe(`(${INBOX_UNREAD_COUNT}) ${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });

    it('Should not display the unread count when the favicon is enabled in message mode', () => {
        vi.mocked(useMailSettings).mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, UnreadFavicon: 1, ViewMode: VIEW_MODE.SINGLE },
            false,
        ]);

        renderHook(() => useMailboxPageTitle(), { wrapper });
        expect(document.title).toBe(`${LABEL_NAME} | ${EMAIL} | Proton Mail`);
    });
});

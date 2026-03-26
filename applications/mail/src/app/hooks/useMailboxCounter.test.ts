import { renderHook } from '@testing-library/react';

import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels, useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label, MailSettings } from '@proton/shared/lib/interfaces';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useMailSelector } from 'proton-mail/store/hooks';

import { useMailboxCounter } from './useMailboxCounter';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('proton-mail/store/hooks');
jest.mock('@proton/mail/store/labels/hooks');
jest.mock('@proton/mail/store/counts/conversationCountsSlice');
jest.mock('@proton/mail/store/counts/messageCountsSlice');

const getCount = (labelID: string, unread: number, total: number) => {
    return { LabelID: labelID, Unread: unread, Total: total };
};

const customLabels = [{ ID: 'custom-label' }] as Label[];

const customSystemFolders = [{ ID: 'custom-folder' }] as Folder[];

describe('useMailboxCounter', () => {
    describe('case with no data', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([{} as MailSettings, true]);
            jest.mocked(useFolders).mockReturnValue([[], true]);
            jest.mocked(useLabels).mockReturnValue([[], true]);
            jest.mocked(useSystemFolders).mockReturnValue([[], true]);
            jest.mocked(useConversationCounts).mockReturnValue([[], true]);
            jest.mocked(useMessageCounts).mockReturnValue([[], true]);
            jest.mocked(useMailSelector).mockReturnValue([]);
        });

        it('should return loading while not all data is loaded', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current[1]).toEqual(true);
        });

        it('should return an object containing all default mailbox label IDs', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current).toStrictEqual([{}, true]);
        });
    });

    describe('data is loaded', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([{} as MailSettings, false]);
            jest.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            jest.mocked(useLabels).mockReturnValue([customLabels, false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
            jest.mocked(useConversationCounts).mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100)], false]);
            jest.mocked(useMessageCounts).mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 500, 50)], false]);
            jest.mocked(useMailSelector).mockReturnValue([]);
        });

        it('should return loading while not all data is loaded', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current[1]).toEqual(false);
        });

        it('should return conversation count when default setting', () => {
            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100);
            expect(result.current[0][MAILBOX_LABEL_IDS.INBOX]).toStrictEqual(expected);
        });

        it('should return conversation count when conversation grouping is disabled', () => {
            jest.mocked(useMailSettings).mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE } as MailSettings, false]);
            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.INBOX, 500, 50);
            expect(result.current[0][MAILBOX_LABEL_IDS.INBOX]).toStrictEqual(expected);
        });

        it('should return default value count when default setting and the data is not in list', () => {
            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.ARCHIVE, 0, 0);
            expect(result.current[0][MAILBOX_LABEL_IDS.ARCHIVE]).toStrictEqual(expected);
        });
    });

    describe('Categories test', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([{} as MailSettings, false]);
            jest.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            jest.mocked(useLabels).mockReturnValue([customLabels, false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
            jest.mocked(useMailSelector).mockReturnValue([]);
        });

        it('should return the primary category with disabled category count', () => {
            jest.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 1000, 100),
                ],
                false,
            ]);
            jest.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 500, 50),
                ],
                false,
            ]);
            jest.mocked(useMailSelector).mockReturnValue([
                MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            ]);

            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 2000, 200);
            expect(result.current[0][MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]).toStrictEqual(expected);
        });

        it('should work with multiple disabled categories', () => {
            jest.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 1000, 100),
                ],
                false,
            ]);
            jest.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 500, 50),
                ],
                false,
            ]);
            jest.mocked(useMailSelector).mockReturnValue([
                MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
            ]);

            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 3000, 300);
            expect(result.current[0][MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]).toStrictEqual(expected);
        });
    });
});

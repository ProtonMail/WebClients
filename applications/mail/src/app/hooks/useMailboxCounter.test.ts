import { renderHook } from '@testing-library/react';

import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';

import { useMailboxCounter } from './useMailboxCounter';

jest.mock('@proton/mail/store/mailSettings/hooks');
const mockUseMailSettings = useMailSettings as jest.Mock;

jest.mock('proton-mail/components/categoryView/useCategoriesView');
const mockUseCategoriesView = useCategoriesView as jest.Mock;

jest.mock('@proton/mail', () => ({
    ...jest.requireActual('@proton/mail'),
    useLabels: jest.fn(),
    useFolders: jest.fn(),
    useSystemFolders: jest.fn(),
    useConversationCounts: jest.fn(),
    useMessageCounts: jest.fn(),
}));

const mockUseFolders = jest.requireMock('@proton/mail').useFolders;
const mockUseLabels = jest.requireMock('@proton/mail').useLabels;
const mockUseSystemFolders = jest.requireMock('@proton/mail').useSystemFolders;
const mockUseConversationCounts = jest.requireMock('@proton/mail').useConversationCounts;
const mockUseMessageCounts = jest.requireMock('@proton/mail').useMessageCounts;

const getCount = (labelID: string, unread: number, total: number) => {
    return { LabelID: labelID, Unread: unread, Total: total };
};

const customLabels = [
    {
        ID: 'custom-label',
    },
];

const customSystemFolders = [
    {
        ID: 'custom-folder',
    },
];

describe('useMailboxCounter', () => {
    describe('case with no data', () => {
        beforeEach(() => {
            mockUseMailSettings.mockReturnValue([{}, true]);
            mockUseFolders.mockReturnValue([[], true]);
            mockUseLabels.mockReturnValue([[], true]);
            mockUseSystemFolders.mockReturnValue([[], true]);
            mockUseConversationCounts.mockReturnValue([[], true]);
            mockUseMessageCounts.mockReturnValue([[], true]);
            mockUseCategoriesView.mockReturnValue({ disabledCategoriesIDs: [] });
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
            mockUseMailSettings.mockReturnValue([{}, false]);
            mockUseFolders.mockReturnValue([customSystemFolders, false]);
            mockUseLabels.mockReturnValue([customLabels, false]);
            mockUseSystemFolders.mockReturnValue([[], false]);
            mockUseConversationCounts.mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100)], false]);
            mockUseMessageCounts.mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 500, 50)], false]);
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
            mockUseMailSettings.mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE }, false]);
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
            mockUseMailSettings.mockReturnValue([{}, false]);
            mockUseFolders.mockReturnValue([customSystemFolders, false]);
            mockUseLabels.mockReturnValue([customLabels, false]);
            mockUseSystemFolders.mockReturnValue([[], false]);
        });

        it('should return the primary category with disabled category count', () => {
            mockUseConversationCounts.mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 1000, 100),
                ],
                false,
            ]);
            mockUseMessageCounts.mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 500, 50),
                ],
                false,
            ]);
            mockUseCategoriesView.mockReturnValue({ disabledCategoriesIDs: [MAILBOX_LABEL_IDS.CATEGORY_FORUMS] });

            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 2000, 200);
            expect(result.current[0][MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]).toStrictEqual(expected);
        });

        it('should work with multiple disabled categories', () => {
            mockUseConversationCounts.mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 1000, 100),
                ],
                false,
            ]);
            mockUseMessageCounts.mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_FORUMS, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 500, 50),
                ],
                false,
            ]);
            mockUseCategoriesView.mockReturnValue({
                disabledCategoriesIDs: [MAILBOX_LABEL_IDS.CATEGORY_FORUMS, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
            });

            const { result } = renderHook(() => useMailboxCounter());

            const expected = getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 3000, 300);
            expect(result.current[0][MAILBOX_LABEL_IDS.CATEGORY_DEFAULT]).toStrictEqual(expected);
        });
    });
});

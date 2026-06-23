import { renderHook } from '@testing-library/react';

// eslint-disable-next-line no-restricted-imports
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
// eslint-disable-next-line no-restricted-imports
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels, useSystemFolders } from '@proton/mail/store/labels/hooks';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder, Label, MailSettings } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useCategoriesView } from 'proton-mail/components/categoryView/useCategoriesView';
import { selectCategoryIDs, selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailSelector } from 'proton-mail/store/hooks';

import { useMailboxCounter } from './useMailboxCounter';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('@proton/mail/store/labels/hooks');
jest.mock('@proton/mail/store/counts/conversationCountsSlice');
jest.mock('@proton/mail/store/counts/messageCountsSlice');

jest.mock('proton-mail/store/hooks');
jest.mock('proton-mail/components/categoryView/useCategoriesView');

type CategoryViewType = ReturnType<typeof useCategoriesView>;

const getCount = (labelID: string, unread: number, total: number) => {
    return { LabelID: labelID, Unread: unread, Total: total };
};

const customLabels = [{ ID: 'custom-label' }] as Label[];
const customSystemFolders = [{ ID: 'custom-folder' }] as Folder[];

const mockSelector = (
    selector: any,
    {
        disabledCategoryIDs = [],
        categoryIDs = [],
        labelID = MAILBOX_LABEL_IDS.INBOX,
    }: { disabledCategoryIDs?: string[]; categoryIDs?: string[]; labelID?: string } = {}
): any => {
    if (selector === selectDisabledCategoriesIDs) {
        return disabledCategoryIDs;
    }
    if (selector === selectCategoryIDs) {
        return categoryIDs;
    }
    if (selector === selectLabelID) {
        return labelID;
    }
};

const getMockCategoryView = (override: Partial<CategoryViewType> = {}): CategoryViewType => ({
    categoryViewAccess: false,
    shouldSeeWideToolbars: false,
    shouldShowTabs: false,
    categoriesStore: [],
    activeCategoriesTabs: [],
    hasAccessToCategoryView: false,
    ...override,
});

describe('useMailboxCounter', () => {
    beforeEach(() => {
        jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector));
        jest.mocked(useCategoriesView).mockReturnValue(getMockCategoryView());
    });

    describe('loading state', () => {
        it('should return loading as true when data is not yet available', () => {
            jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, true]);
            jest.mocked(useFolders).mockReturnValue([[], true]);
            jest.mocked(useLabels).mockReturnValue([[], true]);
            jest.mocked(useSystemFolders).mockReturnValue([[], true]);
            jest.mocked(useConversationCounts).mockReturnValue([[], true]);
            jest.mocked(useMessageCounts).mockReturnValue([[], true]);

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.loading).toEqual(true);
            // While loading, the underlying counter map is empty: lookups must still resolve to safe zero counts
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(getCount('', 0, 0));
        });

        it('should return loading as false when all data is available', () => {
            jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            jest.mocked(useFolders).mockReturnValue([[], false]);
            jest.mocked(useLabels).mockReturnValue([[], false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
            jest.mocked(useConversationCounts).mockReturnValue([[], false]);
            jest.mocked(useMessageCounts).mockReturnValue([[], false]);

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.loading).toEqual(false);
        });
    });

    describe('count resolution', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            jest.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            jest.mocked(useLabels).mockReturnValue([customLabels, false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
            jest.mocked(useConversationCounts).mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100)], false]);
            jest.mocked(useMessageCounts).mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 500, 50)], false]);
        });

        it('should use conversation counts in conversation mode', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100)
            );
        });

        it('should use message counts in single message mode', () => {
            jest.mocked(useMailSettings).mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE } as MailSettings, false]);
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.INBOX, 500, 50)
            );
        });

        it('should return zero counts for a label with no data', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.ARCHIVE)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.ARCHIVE, 0, 0)
            );
        });
    });

    describe('category rollup', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            jest.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            jest.mocked(useLabels).mockReturnValue([customLabels, false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
        });

        it('should roll a single disabled category count into the primary category', () => {
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
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { disabledCategoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS] })
            );

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 2000, 200)
            );
        });

        it('should roll multiple disabled categories into the primary category', () => {
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
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, {
                    disabledCategoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                })
            );

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 3000, 300)
            );
        });
    });

    describe('getLocationCount', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            jest.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            jest.mocked(useLabels).mockReturnValue([customLabels, false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
            jest.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 10, 20),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60),
                ],
                false,
            ]);
            jest.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 11, 21),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 31, 41),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 51, 61),
                ],
                false,
            ]);
        });

        it('should return inbox count', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40)
            );
        });

        it('should return message count for the sent folder', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.SENT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.SENT, 11, 21)
            );
        });

        it('should return CATEGORY_DEFAULT count directly when passed CATEGORY_DEFAULT', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });

        it('should redirect inbox to CATEGORY_DEFAULT when category access is enabled', () => {
            jest.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ categoryViewAccess: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });

        it('should return CATEGORY_DEFAULT count when passed CATEGORY_DEFAULT with category access enabled', () => {
            jest.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ categoryViewAccess: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });
    });

    describe('getCurrentLocationCount', () => {
        beforeEach(() => {
            jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            jest.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            jest.mocked(useLabels).mockReturnValue([customLabels, false]);
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);
            jest.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 10, 20),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60),
                ],
                false,
            ]);
            jest.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 11, 21),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 31, 41),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 51, 61),
                ],
                false,
            ]);
        });

        it('should return inbox count when user is in inbox', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.INBOX })
            );
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40));
        });

        it('should return message count when user is in sent folder', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.SENT })
            );
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(getCount(MAILBOX_LABEL_IDS.SENT, 11, 21));
        });

        it('should redirect inbox to CATEGORY_DEFAULT when user is in inbox with category access but no active categoryIDs', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.INBOX })
            );
            jest.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ categoryViewAccess: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });

        it('should return the active category count when user is in inbox with category access and categoryIDs set', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, {
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                })
            );
            jest.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ categoryViewAccess: true }));
            jest.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 70, 80),
                ],
                false,
            ]);

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 70, 80)
            );
        });

        it('should return CATEGORY_DEFAULT count when user is in the default category folder', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT })
            );
            jest.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ categoryViewAccess: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });
    });
});

import { renderHook } from '@testing-library/react';

// eslint-disable-next-line proton/restricted-imports
import { useConversationCounts } from '@proton/mail/store/counts/conversationCountsSlice';
// eslint-disable-next-line proton/restricted-imports
import { useMessageCounts } from '@proton/mail/store/counts/messageCountsSlice';
import { useFolders, useLabels, useSystemFolders } from '@proton/mail/store/labels/hooks';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Folder } from '@proton/shared/lib/interfaces/Folder';
import type { Label } from '@proton/shared/lib/interfaces/Label';
import type { MailSettings } from '@proton/shared/lib/interfaces/MailSettings';
import { DEFAULT_MAIL_SETTINGS, VIEW_MODE } from '@proton/shared/lib/mail/mailSettings';

import { useCategoriesView } from '../../components/categoryView/useCategoriesView';
import { selectCategoryIDs, selectLabelID } from '../../store/elements/elementsSelectors';
import { useMailSelector } from '../../store/hooks';
import { useMailboxCounter } from './useMailboxCounter';

vi.mock('@proton/mail/store/mailSettings/hooks');
vi.mock('@proton/mail/store/labels/hooks');
vi.mock('@proton/mail/store/counts/conversationCountsSlice');
vi.mock('@proton/mail/store/counts/messageCountsSlice');

vi.mock('../../store/hooks');
vi.mock('../../components/categoryView/useCategoriesView');

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
    isCategoryViewEnabled: false,
    isCategoryViewEnabledSettled: true,
    shouldShowTabs: false,
    canMoveToCategories: false,
    categoriesStore: [],
    activeCategoriesTabs: [],
    canUseCategoryView: false,
    ...override,
});

describe('useMailboxCounter', () => {
    beforeEach(() => {
        vi.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector));
        vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView());
    });

    describe('loading state', () => {
        it('should return loading as true when data is not yet available', () => {
            vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, true]);
            vi.mocked(useFolders).mockReturnValue([[], true]);
            vi.mocked(useLabels).mockReturnValue([[], true]);
            vi.mocked(useSystemFolders).mockReturnValue([[], true]);
            vi.mocked(useConversationCounts).mockReturnValue([[], true]);
            vi.mocked(useMessageCounts).mockReturnValue([[], true]);

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.loading).toEqual(true);
            // While loading, the underlying counter map is empty: lookups must still resolve to safe zero counts
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(getCount('', 0, 0));
        });

        it('should return loading as false when all data is available', () => {
            vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            vi.mocked(useFolders).mockReturnValue([[], false]);
            vi.mocked(useLabels).mockReturnValue([[], false]);
            vi.mocked(useSystemFolders).mockReturnValue([[], false]);
            vi.mocked(useConversationCounts).mockReturnValue([[], false]);
            vi.mocked(useMessageCounts).mockReturnValue([[], false]);

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.loading).toEqual(false);
        });
    });

    describe('count resolution', () => {
        beforeEach(() => {
            vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            vi.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            vi.mocked(useLabels).mockReturnValue([customLabels, false]);
            vi.mocked(useSystemFolders).mockReturnValue([[], false]);
            vi.mocked(useConversationCounts).mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100)], false]);
            vi.mocked(useMessageCounts).mockReturnValue([[getCount(MAILBOX_LABEL_IDS.INBOX, 500, 50)], false]);
        });

        it('should use conversation counts in conversation mode', () => {
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.INBOX, 1000, 100)
            );
        });

        it('should use message counts in single message mode', () => {
            vi.mocked(useMailSettings).mockReturnValue([{ ViewMode: VIEW_MODE.SINGLE } as MailSettings, false]);
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
            vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            vi.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            vi.mocked(useLabels).mockReturnValue([customLabels, false]);
            vi.mocked(useSystemFolders).mockReturnValue([[], false]);
        });

        it('should roll a single disabled category count into the primary category', () => {
            vi.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 1000, 100),
                ],
                false,
            ]);
            vi.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 500, 50),
                ],
                false,
            ]);
            vi.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { disabledCategoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS] })
            );

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 2000, 200)
            );
        });

        it('should roll multiple disabled categories into the primary category', () => {
            vi.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 1000, 100),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 1000, 100),
                ],
                false,
            ]);
            vi.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, 500, 50),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, 500, 50),
                ],
                false,
            ]);
            vi.mocked(useMailSelector).mockImplementation((selector) =>
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
            vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            vi.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            vi.mocked(useLabels).mockReturnValue([customLabels, false]);
            vi.mocked(useSystemFolders).mockReturnValue([[], false]);
            vi.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 10, 20),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60),
                ],
                false,
            ]);
            vi.mocked(useMessageCounts).mockReturnValue([
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
            vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ isCategoryViewEnabled: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });

        it('should return CATEGORY_DEFAULT count when passed CATEGORY_DEFAULT with category access enabled', () => {
            vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ isCategoryViewEnabled: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT)).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });

        it('should not redirect inbox to CATEGORY_DEFAULT when ignoreCategories is set, even with category access enabled', () => {
            vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ isCategoryViewEnabled: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getLocationCount(MAILBOX_LABEL_IDS.INBOX, { ignoreCategories: true })).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40)
            );
        });
    });

    describe('getCurrentLocationCount', () => {
        beforeEach(() => {
            vi.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
            vi.mocked(useFolders).mockReturnValue([customSystemFolders, false]);
            vi.mocked(useLabels).mockReturnValue([customLabels, false]);
            vi.mocked(useSystemFolders).mockReturnValue([[], false]);
            vi.mocked(useConversationCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 10, 20),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60),
                ],
                false,
            ]);
            vi.mocked(useMessageCounts).mockReturnValue([
                [
                    getCount(MAILBOX_LABEL_IDS.SENT, 11, 21),
                    getCount(MAILBOX_LABEL_IDS.INBOX, 31, 41),
                    getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 51, 61),
                ],
                false,
            ]);
        });

        it('should return inbox count when user is in inbox', () => {
            vi.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.INBOX })
            );
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(getCount(MAILBOX_LABEL_IDS.INBOX, 30, 40));
        });

        it('should return message count when user is in sent folder', () => {
            vi.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.SENT })
            );
            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(getCount(MAILBOX_LABEL_IDS.SENT, 11, 21));
        });

        it('should redirect inbox to CATEGORY_DEFAULT when user is in inbox with category access but no active categoryIDs', () => {
            vi.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.INBOX })
            );
            vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ isCategoryViewEnabled: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });

        it('should return the active category count when user is in inbox with category access and categoryIDs set', () => {
            vi.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, {
                    labelID: MAILBOX_LABEL_IDS.INBOX,
                    categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                })
            );
            vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ isCategoryViewEnabled: true }));
            vi.mocked(useConversationCounts).mockReturnValue([
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
            vi.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT })
            );
            vi.mocked(useCategoriesView).mockReturnValue(getMockCategoryView({ isCategoryViewEnabled: true }));

            const { result } = renderHook(() => useMailboxCounter());
            expect(result.current.getCurrentLocationCount()).toStrictEqual(
                getCount(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, 50, 60)
            );
        });
    });
});

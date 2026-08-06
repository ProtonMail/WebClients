import { renderHook } from '@testing-library/react-hooks';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useSystemFolders } from '@proton/mail/store/labels/hooks';
import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash/useFlag';

import { useMailSelector } from 'proton-mail/store/hooks';

import { TabState } from './tabsInterface';
import { useCategoriesBadge } from './useCategoriesBadge';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('@proton/mail/store/labels/hooks');
jest.mock('@proton/unleash/useFlag');
jest.mock('proton-mail/store/hooks');

const category: CategoryTab = {
    id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    display: true,
    notify: true,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
};

const folderWithUnseen: Label = {
    ID: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    Name: 'Social',
    Color: '#000000',
    Type: 4,
    Order: 0,
    Path: '',
    LastUnseenMessageEventID: 42,
};

interface MockSelectorParams {
    unreadCount?: number;
    disabledCategories?: string[];
}

const mockSelector = (selector: any, options?: MockSelectorParams) => {
    if (selector === selectDisabledCategoriesIDs) {
        return options?.disabledCategories || [];
    }

    // The hook reads `.count` inside the selector, so the mocked store returns the number
    return options?.unreadCount || 0;
};

describe('useCategoriesBadge', () => {
    beforeEach(() => {
        jest.mocked(useFlag).mockReturnValue(true);
        jest.mocked(useMailSettings).mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
            false,
        ]);
        jest.mocked(useSystemFolders).mockReturnValue([[], false]);
        // selectDisabledCategoriesIDs — no disabled categories by default
        jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector));
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('reads the unseen badge state from the MailRecordLastUnseenIncomingMessageEventID flag', () => {
        renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));
        expect(useFlag).toHaveBeenCalledWith('MailRecordLastUnseenIncomingMessageEventID');
    });

    describe('shouldShowCounter', () => {
        it('is true when counters are enabled and there are unread messages', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector, { unreadCount: 10 }));
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: true },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(true);
            expect(result.current.count).toBe(10);
        });

        it('is false when counters are off and there are unread messages', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector, { unreadCount: 10 }));
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(false);
            expect(result.current.count).toBe(10);
        });

        it('is false where counters are on and there are no unread messages', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector, { unreadCount: 0 }));
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: true },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(false);
            expect(result.current.count).toBe(0);
        });
    });

    describe('shouldShowNewBadge', () => {
        it('is true on an inactive tab when the folder has an unseen event', () => {
            jest.mocked(useSystemFolders).mockReturnValue([[folderWithUnseen], false]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowNewBadge).toBe(true);
        });

        it('is false on the active tab even when the folder has an unseen event', () => {
            jest.mocked(useSystemFolders).mockReturnValue([[folderWithUnseen], false]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.ACTIVE }));

            expect(result.current.shouldShowNewBadge).toBe(false);
        });

        it('is false when the mail category view counter setting is enabled', () => {
            jest.mocked(useSystemFolders).mockReturnValue([[folderWithUnseen], false]);
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: true },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowNewBadge).toBe(false);
        });

        it('is false when the folder has no unseen event', () => {
            jest.mocked(useSystemFolders).mockReturnValue([
                [{ ...folderWithUnseen, LastUnseenMessageEventID: null }],
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowNewBadge).toBe(false);
        });

        it('is false when the folder is missing from the store', () => {
            jest.mocked(useSystemFolders).mockReturnValue([[], false]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowNewBadge).toBe(false);
        });
    });

    describe('shouldShowNewBadge on the primary tab (folds in disabled categories)', () => {
        const primaryCategory: CategoryTab = {
            id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
            display: true,
            notify: true,
            colorShade: CATEGORIES_COLOR_SHADES.IRIS,
        };

        const defaultFolderWithoutUnseen: Label = {
            ID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
            Name: 'Primary',
            Color: '#000000',
            Type: 4,
            Order: 0,
            Path: '',
            LastUnseenMessageEventID: null,
        };

        it('is true when a disabled category folded into the primary tab has an unseen event', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { disabledCategories: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL] })
            );
            jest.mocked(useSystemFolders).mockReturnValue([[defaultFolderWithoutUnseen, folderWithUnseen], false]);

            const { result } = renderHook(() =>
                useCategoriesBadge({ category: primaryCategory, tabState: TabState.INACTIVE })
            );

            expect(result.current.shouldShowNewBadge).toBe(true);
        });

        it('is true when the default folder itself has an unseen event', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector));
            jest.mocked(useSystemFolders).mockReturnValue([
                [{ ...defaultFolderWithoutUnseen, LastUnseenMessageEventID: 42 }],
                false,
            ]);

            const { result } = renderHook(() =>
                useCategoriesBadge({ category: primaryCategory, tabState: TabState.INACTIVE })
            );

            expect(result.current.shouldShowNewBadge).toBe(true);
        });

        it('is false when neither the default nor the disabled categories have an unseen event', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) =>
                mockSelector(selector, { disabledCategories: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL] })
            );
            jest.mocked(useSystemFolders).mockReturnValue([
                [defaultFolderWithoutUnseen, { ...folderWithUnseen, LastUnseenMessageEventID: null }],
                false,
            ]);

            const { result } = renderHook(() =>
                useCategoriesBadge({ category: primaryCategory, tabState: TabState.INACTIVE })
            );

            expect(result.current.shouldShowNewBadge).toBe(false);
        });

        it('ignores the unseen event of a category that is not folded into the primary tab', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector));
            jest.mocked(useSystemFolders).mockReturnValue([[defaultFolderWithoutUnseen, folderWithUnseen], false]);

            const { result } = renderHook(() =>
                useCategoriesBadge({ category: primaryCategory, tabState: TabState.INACTIVE })
            );

            expect(result.current.shouldShowNewBadge).toBe(false);
        });
    });

    describe('when the unseen badge flag is off', () => {
        beforeEach(() => {
            jest.mocked(useFlag).mockReturnValue(false);
        });

        it('shows the counter as soon as there are unread messages, whatever the counters setting is', () => {
            jest.mocked(useMailSelector).mockImplementation((selector) => mockSelector(selector, { unreadCount: 10 }));
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(true);
            expect(result.current.count).toBe(10);
        });

        it('never shows the new badge, even on an inactive tab with an unseen event and counters off', () => {
            jest.mocked(useSystemFolders).mockReturnValue([[folderWithUnseen], false]);
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowNewBadge).toBe(false);
        });
    });
});

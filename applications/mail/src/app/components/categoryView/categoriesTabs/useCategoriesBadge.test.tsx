import { renderHook } from '@testing-library/react-hooks';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useSystemFolders } from '@proton/mail/store/labels/hooks';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import type { Label } from '@proton/shared/lib/interfaces';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash/useFlag';

import { TabState } from './tabsInterface';
import { useCategoriesBadge } from './useCategoriesBadge';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('@proton/mail/store/labels/hooks');
jest.mock('@proton/unleash/useFlag');

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

describe('useCategoriesBadge', () => {
    beforeEach(() => {
        jest.mocked(useFlag).mockReturnValue(true);
        jest.mocked(useMailSettings).mockReturnValue([
            { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
            false,
        ]);
        jest.mocked(useSystemFolders).mockReturnValue([[], false]);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when the feature flag is off', () => {
        beforeEach(() => {
            jest.mocked(useFlag).mockReturnValue(false);
        });

        it('never shows the counter or the new badge', () => {
            jest.mocked(useSystemFolders).mockReturnValue([[folderWithUnseen], false]);
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: true },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(false);
            expect(result.current.shouldShowNewBadge).toBe(false);
        });
    });

    describe('shouldShowCounter', () => {
        it('is true when the active tab is selected, even if the setting is off', () => {
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.ACTIVE }));

            expect(result.current.shouldShowCounter).toBe(true);
        });

        it('is true on an inactive tab when the setting is enabled', () => {
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: true },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(true);
        });

        it('is false on an inactive tab when the setting is disabled', () => {
            jest.mocked(useMailSettings).mockReturnValue([
                { ...DEFAULT_MAIL_SETTINGS, MailCategoryViewCountersEnabled: false },
                false,
            ]);

            const { result } = renderHook(() => useCategoriesBadge({ category, tabState: TabState.INACTIVE }));

            expect(result.current.shouldShowCounter).toBe(false);
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
});

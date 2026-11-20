import { useHistory, useLocation } from 'react-router';

import { renderHook } from '@testing-library/react';

import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { categoryIDFromUrl, removeCategoryFromCurrentUrl, setCategoryInCurrentUrl } from '../../helpers/mailboxUrl';
import { selectLabelID } from '../../store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from '../../store/hooks';
import { useCategoriesView } from './useCategoriesView';
import { useCategoryFlagWatcher } from './useCategoryFlagWatcher';

vi.mock('react-router');
vi.mock('../../helpers/mailboxUrl');
vi.mock('../../store/hooks');
vi.mock('./useCategoriesView');

const INBOX_URL = `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`;
const CATEGORY_DEFAULT_URL = '/inbox#category=primary';

const mockReplace = vi.fn();
const mockDispatch = vi.fn();

const hasCategoryAccess = {
    isCategoryViewEnabled: true,
    isCategoryViewEnabledSettled: true,
} as ReturnType<typeof useCategoriesView>;
const noCategoryAccess = {
    isCategoryViewEnabled: false,
    isCategoryViewEnabledSettled: true,
} as ReturnType<typeof useCategoriesView>;

describe('useCategoryFlagWatcher', () => {
    beforeEach(() => {
        vi.mocked(useHistory).mockReturnValue({ replace: mockReplace } as any);
        vi.mocked(useLocation).mockReturnValue({ pathname: '/inbox', hash: '' } as any);
        vi.mocked(useMailSelector).mockImplementation((selector) => {
            if (selector === selectLabelID) {
                return MAILBOX_LABEL_IDS.INBOX;
            }
            return undefined;
        });
        vi.mocked(useMailDispatch).mockReturnValue(mockDispatch);
        vi.mocked(useCategoriesView).mockReturnValue(noCategoryAccess);
        vi.mocked(categoryIDFromUrl).mockReturnValue(undefined);
        vi.mocked(setCategoryInCurrentUrl).mockReturnValue(CATEGORY_DEFAULT_URL);
        vi.mocked(removeCategoryFromCurrentUrl).mockReturnValue(INBOX_URL);
    });

    afterEach(() => {
        vi.clearAllMocks();
    });

    describe('when not on inbox', () => {
        beforeEach(() => {
            vi.mocked(useMailSelector).mockImplementation((selector) => {
                if (selector === selectLabelID) {
                    return MAILBOX_LABEL_IDS.SENT;
                }
                return undefined;
            });
            vi.mocked(useLocation).mockReturnValue({ pathname: '/sent', hash: '' } as any);
        });

        it('does not redirect when category view is enabled', () => {
            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();
        });

        it('does not redirect when category view is disabled', () => {
            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();
        });
    });

    describe('when on inbox without a category in the URL', () => {
        it('redirects to the default category when category view is enabled', () => {
            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            renderHook(() => useCategoryFlagWatcher());
            expect(setCategoryInCurrentUrl).toHaveBeenCalledWith(
                { pathname: '/inbox', hash: '' },
                MAILBOX_LABEL_IDS.CATEGORY_DEFAULT
            );
            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(CATEGORY_DEFAULT_URL);
        });

        it('does not redirect when category view is disabled', () => {
            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();
        });
    });

    describe('when on inbox with a category in the URL', () => {
        beforeEach(() => {
            vi.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
        });

        it('does not redirect when category view is enabled', () => {
            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();
        });

        it('redirects to inbox when category view is disabled', () => {
            renderHook(() => useCategoryFlagWatcher());
            expect(mockDispatch).toHaveBeenCalled();
            expect(removeCategoryFromCurrentUrl).toHaveBeenCalledWith({ pathname: '/inbox', hash: '' });
            expect(mockReplace).toHaveBeenCalledWith(INBOX_URL);
        });
    });

    describe('when category view access changes', () => {
        it('redirects to the default category when access becomes enabled on inbox without a category', () => {
            const { rerender } = renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();

            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            rerender();

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(CATEGORY_DEFAULT_URL);
        });

        it('redirects to inbox when access becomes disabled with a category in the URL', () => {
            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            vi.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);

            const { rerender } = renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();

            vi.mocked(useCategoriesView).mockReturnValue(noCategoryAccess);
            rerender();

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(INBOX_URL);
        });
    });

    describe('when redirecting disabled categories', () => {
        it('redirects to inbox when access becomes enabled on inbox without a category', () => {
            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            vi.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS);
            vi.mocked(useMailSelector).mockImplementation((selector) => {
                if (selector === selectLabelID) {
                    return MAILBOX_LABEL_IDS.INBOX;
                }
                if (selector === selectDisabledCategoriesIDs) {
                    return [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS];
                }
                return undefined;
            });

            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).toHaveBeenCalled();

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(CATEGORY_DEFAULT_URL);
        });

        it('does not redirect if the category is not disabled', () => {
            vi.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            vi.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            vi.mocked(useMailSelector).mockImplementation((selector) => {
                if (selector === selectLabelID) {
                    return MAILBOX_LABEL_IDS.INBOX;
                }
                if (selector === selectDisabledCategoriesIDs) {
                    return [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL];
                }
                return undefined;
            });

            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();
        });
    });
});

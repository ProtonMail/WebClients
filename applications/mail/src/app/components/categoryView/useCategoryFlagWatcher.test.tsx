import { useHistory, useLocation } from 'react-router';

import { renderHook } from '@testing-library/react-hooks';

import { selectDisabledCategoriesIDs } from '@proton/mail/store/labels/selector';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { LABEL_IDS_TO_HUMAN } from '@proton/shared/lib/mail/constants';

import { categoryIDFromUrl, setCategoryInUrl } from 'proton-mail/helpers/mailboxUrl';
import { selectLabelID } from 'proton-mail/store/elements/elementsSelectors';
import { useMailDispatch, useMailSelector } from 'proton-mail/store/hooks';

import { useCategoriesView } from './useCategoriesView';
import { useCategoryFlagWatcher } from './useCategoryFlagWatcher';

jest.mock('react-router');
jest.mock('proton-mail/helpers/mailboxUrl');
jest.mock('proton-mail/store/hooks');
jest.mock('./useCategoriesView');

const INBOX_URL = `/${LABEL_IDS_TO_HUMAN[MAILBOX_LABEL_IDS.INBOX]}`;
const CATEGORY_DEFAULT_URL = '/inbox#category=primary';

const mockReplace = jest.fn();
const mockDispatch = jest.fn();

const hasCategoryAccess = { categoryViewAccess: true } as ReturnType<typeof useCategoriesView>;
const noCategoryAccess = { categoryViewAccess: false } as ReturnType<typeof useCategoriesView>;

describe('useCategoryFlagWatcher', () => {
    beforeEach(() => {
        jest.mocked(useHistory).mockReturnValue({ replace: mockReplace } as any);
        jest.mocked(useLocation).mockReturnValue({ pathname: '/inbox', hash: '' } as any);
        jest.mocked(useMailSelector).mockImplementation((selector) => {
            if (selector === selectLabelID) {
                return MAILBOX_LABEL_IDS.INBOX;
            }
            return undefined;
        });
        jest.mocked(useMailDispatch).mockReturnValue(mockDispatch);
        jest.mocked(useCategoriesView).mockReturnValue(noCategoryAccess);
        jest.mocked(categoryIDFromUrl).mockReturnValue(undefined);
        jest.mocked(setCategoryInUrl).mockReturnValue(CATEGORY_DEFAULT_URL);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when not on inbox', () => {
        beforeEach(() => {
            jest.mocked(useMailSelector).mockImplementation((selector) => {
                if (selector === selectLabelID) {
                    return MAILBOX_LABEL_IDS.SENT;
                }
                return undefined;
            });
            jest.mocked(useLocation).mockReturnValue({ pathname: '/sent', hash: '' } as any);
        });

        it('does not redirect when category view is enabled', () => {
            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
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
            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            renderHook(() => useCategoryFlagWatcher());
            expect(setCategoryInUrl).toHaveBeenCalledWith(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
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
            jest.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);
        });

        it('does not redirect when category view is enabled', () => {
            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();
        });

        it('redirects to inbox when category view is disabled', () => {
            renderHook(() => useCategoryFlagWatcher());
            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(INBOX_URL);
        });
    });

    describe('when category view access changes', () => {
        it('redirects to the default category when access becomes enabled on inbox without a category', () => {
            const { rerender } = renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();

            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            rerender();

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(CATEGORY_DEFAULT_URL);
        });

        it('redirects to inbox when access becomes disabled with a category in the URL', () => {
            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            jest.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_DEFAULT);

            const { rerender } = renderHook(() => useCategoryFlagWatcher());
            expect(mockReplace).not.toHaveBeenCalled();

            jest.mocked(useCategoriesView).mockReturnValue(noCategoryAccess);
            rerender();

            expect(mockDispatch).toHaveBeenCalled();
            expect(mockReplace).toHaveBeenCalledWith(INBOX_URL);
        });
    });

    describe('when redirecting disabled categories', () => {
        it('redirects to inbox when access becomes enabled on inbox without a category', () => {
            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            jest.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS);
            jest.mocked(useMailSelector).mockImplementation((selector) => {
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
            jest.mocked(useCategoriesView).mockReturnValue(hasCategoryAccess);
            jest.mocked(categoryIDFromUrl).mockReturnValue(MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS);
            jest.mocked(useMailSelector).mockImplementation((selector) => {
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

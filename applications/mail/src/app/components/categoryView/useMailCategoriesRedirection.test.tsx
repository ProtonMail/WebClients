import { useHistory, useLocation } from 'react-router-dom';

import { renderHook } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useCategoriesView } from './useCategoriesView';
import { useMailCategoriesRedirection } from './useMailCategoriesRedirection';

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
    useHistory: jest.fn(),
}));
const mockUseLocation = useLocation as jest.Mock;
const mockUseHistory = useHistory as jest.Mock;

jest.mock('./useCategoriesView');
const mockedUseCategoryView = jest.mocked(useCategoriesView);

describe('useMailCategoriesRedirection', () => {
    const push = jest.fn();
    beforeEach(() => {
        mockUseHistory.mockReturnValue({ push } as any);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should redirect to default category when accessing inbox', () => {
        mockUseLocation.mockReturnValue({ pathname: '/inbox' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).toHaveBeenCalledWith('primary');
    });

    it('should redirect even if we have elements in inbox', () => {
        mockUseLocation.mockReturnValue({ pathname: '/inbox/conversation/message' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).toHaveBeenCalledWith('primary');
    });

    it('should not redirect if the pathname is already primary', () => {
        mockUseLocation.mockReturnValue({ pathname: '/primary' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, display: true }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).not.toHaveBeenCalled();
    });

    it('should not redirect if the pathname is spam', () => {
        mockUseLocation.mockReturnValue({ pathname: '/spam' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, display: true }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).not.toHaveBeenCalled();
    });

    it('should not redirect if the category is disabled', () => {
        mockUseLocation.mockReturnValue({ pathname: '/primary' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: false,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, display: true }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).not.toHaveBeenCalled();
    });

    it('should redirect if the category is not displayed', () => {
        mockUseLocation.mockReturnValue({ pathname: '/primary' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS, display: false }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS }));

        expect(push).toHaveBeenCalled();
    });

    it('should not redirect if the category is displayed', () => {
        mockUseLocation.mockReturnValue({ pathname: '/forums' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS, display: true }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS }));

        expect(push).not.toHaveBeenCalled();
    });

    it('should not redirect from inbox when categoryViewAccess is false', () => {
        mockUseLocation.mockReturnValue({ pathname: '/inbox' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: false,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, display: true }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).not.toHaveBeenCalled();
    });

    it('should not redirect when labelID is not found in activeCategoriesTabs', () => {
        mockUseLocation.mockReturnValue({ pathname: '/forums' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, display: true }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS }));

        expect(push).not.toHaveBeenCalled();
    });

    it('should redirect twice when on inbox path and current category is not displayed', () => {
        mockUseLocation.mockReturnValue({ pathname: '/inbox' } as any);
        mockedUseCategoryView.mockReturnValue({
            categoryViewAccess: true,
            activeCategoriesTabs: [{ id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, display: false }],
        } as any);

        renderHook(() => useMailCategoriesRedirection({ labelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT }));

        expect(push).toHaveBeenCalledTimes(2);
        expect(push).toHaveBeenCalledWith('primary');
    });
});

import { useHistory, useLocation } from 'react-router-dom';

import { renderHook } from '@testing-library/react';

import { useCategoryView } from './useCategoryView';
import { useMailCategoriesRedirection } from './useMailCategoriesRedirection';

jest.mock('react-router-dom', () => ({
    useLocation: jest.fn(),
    useHistory: jest.fn(),
}));
const mockUseLocation = useLocation as jest.Mock;
const mockUseHistory = useHistory as jest.Mock;

jest.mock('./useCategoryView');
const mockedUseCategoryView = jest.mocked(useCategoryView);

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
        mockedUseCategoryView.mockReturnValue({ categoryViewAccess: true } as any);

        renderHook(() => useMailCategoriesRedirection());

        expect(push).toHaveBeenCalledWith('primary');
    });

    it('should redirect even if we have elements in inbox', () => {
        mockUseLocation.mockReturnValue({ pathname: '/inbox/conversation/message' } as any);
        mockedUseCategoryView.mockReturnValue({ categoryViewAccess: true } as any);

        renderHook(() => useMailCategoriesRedirection());

        expect(push).toHaveBeenCalledWith('primary');
    });

    it('should not redirect if the pathname is already primary', () => {
        mockUseLocation.mockReturnValue({ pathname: '/primary' } as any);
        mockedUseCategoryView.mockReturnValue({ categoryViewAccess: true } as any);

        renderHook(() => useMailCategoriesRedirection());

        expect(push).not.toHaveBeenCalled();
    });

    it('should not redirect if the pathname is spam', () => {
        mockUseLocation.mockReturnValue({ pathname: '/spam' } as any);
        mockedUseCategoryView.mockReturnValue({ categoryViewAccess: true } as any);

        renderHook(() => useMailCategoriesRedirection());

        expect(push).not.toHaveBeenCalled();
    });

    it('should not redirect if the category is disabled', () => {
        mockUseLocation.mockReturnValue({ pathname: '/primary' } as any);
        mockedUseCategoryView.mockReturnValue({ categoryViewAccess: false } as any);

        renderHook(() => useMailCategoriesRedirection());

        expect(push).not.toHaveBeenCalled();
    });
});

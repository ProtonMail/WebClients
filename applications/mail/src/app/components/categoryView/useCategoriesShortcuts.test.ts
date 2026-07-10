import { renderHook } from '@testing-library/react';

import { mockActiveCategoriesData, mockCategoriesStore } from './testUtils/helpers';
import { useCategoriesShortcuts } from './useCategoriesShortcuts';
import { useCategoriesView } from './useCategoriesView';

jest.mock('./useCategoriesView');
const mockUseCategoriesView = useCategoriesView as jest.Mock<ReturnType<typeof useCategoriesView>>;

jest.mock('@proton/mail/features/categoriesView/useCategoriesTelemetry', () => ({
    useCategoriesTelemetry: () => ({
        sendReportCategoriesNav: jest.fn(),
    }),
}));

describe('useCategoriesShortcuts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Category view disabled tests', () => {
        it('should return inbox shortcuts if flag is disabled', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: [],
                activeCategoriesTabs: [],
                isCategoryViewEnabled: false,
                isCategoryViewEnabledSettled: true,
                shouldSeeWideToolbars: false,
                shouldShowTabs: false,
                canUseCategoryView: false,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption).toEqual([
                {
                    icon: 'inbox',
                    label: 'Go to Inbox',
                    value: 'inbox',
                    action: expect.anything(),
                    shortcuts: ['G', 'I'],
                },
            ]);

            expect(result.current.categoriesAndInboxShortcuts).toEqual([['G', 'I', expect.anything()]]);
        });

        it('should return inbox shortcuts if there is no active categories', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: [],
                activeCategoriesTabs: [],
                isCategoryViewEnabled: true,
                isCategoryViewEnabledSettled: true,
                shouldSeeWideToolbars: false,
                shouldShowTabs: true,
                canUseCategoryView: false,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption).toEqual([
                {
                    icon: 'inbox',
                    label: 'Go to Inbox',
                    value: 'inbox',
                    action: expect.anything(),
                    shortcuts: ['G', 'I'],
                },
            ]);

            expect(result.current.categoriesAndInboxShortcuts).toEqual([['G', 'I', expect.anything()]]);
        });

        it('should return only inbox if categories are disabled', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: mockCategoriesStore,
                activeCategoriesTabs: mockActiveCategoriesData,
                isCategoryViewEnabled: false,
                isCategoryViewEnabledSettled: true,
                shouldSeeWideToolbars: false,
                shouldShowTabs: false,
                canUseCategoryView: false,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption.length).toEqual(1);
            expect(result.current.categoriesAndInboxShortcuts.length).toEqual(1);
        });
    });

    describe('should render partial list of shortcuts', () => {
        it('should return all activated categories', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: mockCategoriesStore,
                activeCategoriesTabs: mockActiveCategoriesData,
                isCategoryViewEnabled: true,
                isCategoryViewEnabledSettled: true,
                shouldSeeWideToolbars: false,
                shouldShowTabs: true,
                canUseCategoryView: false,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption.length).toEqual(mockActiveCategoriesData.length);
            expect(result.current.categoriesAndInboxShortcuts.length).toEqual(mockActiveCategoriesData.length);
        });

        it('should return only the activated categories', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: mockCategoriesStore,
                activeCategoriesTabs: [
                    mockActiveCategoriesData[0],
                    mockActiveCategoriesData[1],
                    mockActiveCategoriesData[2],
                ],
                isCategoryViewEnabled: true,
                isCategoryViewEnabledSettled: true,
                shouldSeeWideToolbars: false,
                shouldShowTabs: true,
                canUseCategoryView: false,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption.length).toEqual(3);
            expect(result.current.categoriesAndInboxShortcuts.length).toEqual(3);
        });
    });
});

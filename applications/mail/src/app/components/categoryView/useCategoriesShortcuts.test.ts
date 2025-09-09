import { renderHook } from '@testing-library/react';

import { mockActiveCategoriesData, mockCategoriesStore } from './testUtils/helpers';
import { useCategoriesShortcuts } from './useCategoriesShortcuts';
import { useCategoriesView } from './useCategoriesView';

jest.mock('./useCategoriesView');
const mockUseCategoriesView = useCategoriesView as jest.Mock<ReturnType<typeof useCategoriesView>>;

describe('useCategoriesShortcuts', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('Category view disabled tests', () => {
        it('should return inbox shortcuts if flag is disabled', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: [],
                categoriesTabs: [],
                activeCategoriesTabs: [],
                categoryViewAccess: false,
                shouldShowTabs: false,
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
                categoriesTabs: [],
                activeCategoriesTabs: [],
                categoryViewAccess: true,
                shouldShowTabs: true,
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
                categoriesTabs: mockActiveCategoriesData,
                activeCategoriesTabs: mockActiveCategoriesData,
                categoryViewAccess: false,
                shouldShowTabs: false,
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
                categoriesTabs: mockActiveCategoriesData,
                activeCategoriesTabs: mockActiveCategoriesData,
                categoryViewAccess: true,
                shouldShowTabs: true,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption.length).toEqual(mockActiveCategoriesData.length);
            expect(result.current.categoriesAndInboxShortcuts.length).toEqual(mockActiveCategoriesData.length);
        });

        it('should return only the activated categories', () => {
            mockUseCategoriesView.mockReturnValue({
                categoriesStore: mockCategoriesStore,
                categoriesTabs: mockActiveCategoriesData,
                activeCategoriesTabs: [
                    mockActiveCategoriesData[0],
                    mockActiveCategoriesData[1],
                    mockActiveCategoriesData[2],
                ],
                categoryViewAccess: true,
                shouldShowTabs: true,
            });

            const { result } = renderHook(() => useCategoriesShortcuts());
            expect(result.current.moveToCategoriesOption.length).toEqual(3);
            expect(result.current.categoriesAndInboxShortcuts.length).toEqual(3);
        });
    });
});

import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mockActiveCategoriesData } from '../testUtils/helpers';
import { getTabState } from './categoriesTabsHelper';
import { TabState } from './tabsInterface';

describe('CategoriesTabsHelper', () => {
    describe('getTabState', () => {
        it('should return inactive when category is not selected nor dragged over', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                draggedOverCategoryId: undefined,
            });
            expect(tabState).toBe(TabState.INACTIVE);
        });

        it('should return active if the category is part of disabled categories', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                draggedOverCategoryId: undefined,
            });
            expect(tabState).toBe(TabState.ACTIVE);
        });

        it('should return active if the category is the same as the labelID', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                draggedOverCategoryId: undefined,
            });
            expect(tabState).toBe(TabState.ACTIVE);
        });

        it('should return dragging over if the categories is dragged over', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.DRAGGING_OVER);
        });

        it('should return active is categories is dragged over but is already active', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS],
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.ACTIVE);
        });

        it('should return the dragging neighbor if the next category is dragged over', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 1,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.DRAGGING_NEIGHBOR);
        });

        it('should return the dragging neighbor if the previous category is dragged over', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 3,
                category,
                selectAll: false,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.DRAGGING_NEIGHBOR);
        });

        it('should return inative is select all is enabled even if dragged over', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                selectAll: true,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.INACTIVE);
        });

        it('should return inative is select all is enabled even if neighbor', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 3,
                category,
                selectAll: true,
                categoriesList: mockActiveCategoriesData,
                categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT],
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.INACTIVE);
        });
    });
});

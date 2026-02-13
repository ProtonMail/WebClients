import type { CategoryTab } from '@proton/mail';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail';
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
                categoriesList: mockActiveCategoriesData,
                categoryLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                draggedOverCategoryId: undefined,
            });
            expect(tabState).toBe(TabState.INACTIVE);
        });

        it('should return active if the category is the same as the labelID', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                categoriesList: mockActiveCategoriesData,
                categoryLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                draggedOverCategoryId: undefined,
            });
            expect(tabState).toBe(TabState.ACTIVE);
        });

        it('should return dragging over if the categories is dragged over', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                categoriesList: mockActiveCategoriesData,
                categoryLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_FORUMS.toString(),
            });
            expect(tabState).toBe(TabState.DRAGGING_OVER);
        });

        it('should return active is categories is dragged over but is already active', () => {
            const category: CategoryTab = {
                id: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                colorShade: CATEGORIES_COLOR_SHADES.BLUE,
                outlinedIcon: 'inbox',
                filledIcon: 'inbox',
            };
            const tabState = getTabState({
                index: 0,
                category,
                categoriesList: mockActiveCategoriesData,
                categoryLabelID: MAILBOX_LABEL_IDS.CATEGORY_FORUMS,
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_FORUMS.toString(),
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
                categoriesList: mockActiveCategoriesData,
                categoryLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
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
                categoriesList: mockActiveCategoriesData,
                categoryLabelID: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT,
                draggedOverCategoryId: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS.toString(),
            });
            expect(tabState).toBe(TabState.DRAGGING_NEIGHBOR);
        });
    });
});

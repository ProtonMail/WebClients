import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mailTestRender } from 'proton-mail/helpers/test/helper';
import { newElementsState } from 'proton-mail/store/elements/elementsSlice';
import { layoutInitialState } from 'proton-mail/store/layout/layoutSlice';

import { mockActiveCategoriesData } from '../testUtils/helpers';
import { CategoryContextMenu } from './CategoryContextMenu';

jest.mock('../useCategoriesView', () => ({
    useCategoriesView: jest.fn(() => ({
        shouldShowTabs: true,
        activeCategoriesTabs: mockActiveCategoriesData,
    })),
}));

describe('CategoryContextMenu', () => {
    it('should offer the categories when a normal selection is checked', async () => {
        await mailTestRender(<CategoryContextMenu onCategoryMove={jest.fn()} />, {
            preloadedState: {
                layout: { ...layoutInitialState, selectAll: false },
                elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT] } }),
            },
        });
        expect(screen.getByText('Move to category...')).toBeInTheDocument();
    });

    it('should not offer the categories during a select all', async () => {
        await mailTestRender(<CategoryContextMenu onCategoryMove={jest.fn()} />, {
            preloadedState: {
                layout: { ...layoutInitialState, selectAll: true },
                elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT] } }),
            },
        });
        expect(screen.queryByText('Move to category...')).not.toBeInTheDocument();
    });
});

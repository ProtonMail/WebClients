import { screen } from '@testing-library/react';

import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import * as helpers from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mailTestRender } from 'proton-mail/helpers/test/helper';
import { newElementsState } from 'proton-mail/store/elements/elementsSlice';

import { mockActiveCategoriesData } from '../testUtils/helpers';
import { CategoriesTabs } from './CategoriesTabs';

jest.mock('../useCategoriesView', () => ({
    useCategoriesView: jest.fn(() => ({
        categoriesStore: [],
        categoriesTabs: [],
        activeCategoriesTabs: mockActiveCategoriesData,
    })),
}));

describe('CategoriesTabs', () => {
    describe('selected category test', () => {
        // TODO add a test to cover disabled categories
        it('should select primary when category is in categoryIDs', async () => {
            await mailTestRender(<CategoriesTabs />, {
                preloadedState: {
                    elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_DEFAULT] } }),
                },
            });
            const categoryTab = screen.getByTestId(`category-tab-${MAILBOX_LABEL_IDS.CATEGORY_DEFAULT}`);
            expect(categoryTab).toHaveClass('mail-category-border');
            expect(categoryTab.dataset.color).toStrictEqual(CATEGORIES_COLOR_SHADES.IRIS);
        });

        it('should select social when category is in categoryIDs', async () => {
            await mailTestRender(<CategoriesTabs />, {
                preloadedState: {
                    elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_SOCIAL] } }),
                },
            });
            const categoryTab = screen.getByTestId(`category-tab-${MAILBOX_LABEL_IDS.CATEGORY_SOCIAL}`);
            expect(categoryTab).toHaveClass('mail-category-border');
            expect(categoryTab.dataset.color).toStrictEqual(CATEGORIES_COLOR_SHADES.CYAN);
        });

        it('should select promotion when category is in categoryIDs', async () => {
            await mailTestRender(<CategoriesTabs />, {
                preloadedState: {
                    elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS] } }),
                },
            });
            const categoryTab = screen.getByTestId(`category-tab-${MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS}`);
            expect(categoryTab).toHaveClass('mail-category-border');
            expect(categoryTab.dataset.color).toStrictEqual(CATEGORIES_COLOR_SHADES.TEAL);
        });

        it('should select newsletters when category is in categoryIDs', async () => {
            await mailTestRender(<CategoriesTabs />, {
                preloadedState: {
                    elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS] } }),
                },
            });
            const categoryTab = screen.getByTestId(`category-tab-${MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS}`);
            expect(categoryTab).toHaveClass('mail-category-border');
            expect(categoryTab.dataset.color).toStrictEqual(CATEGORIES_COLOR_SHADES.ORANGE);
        });

        it('should select transactions when category is in categoryIDs', async () => {
            await mailTestRender(<CategoriesTabs />, {
                preloadedState: {
                    elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS] } }),
                },
            });
            const categoryTab = screen.getByTestId(`category-tab-${MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS}`);
            expect(categoryTab).toHaveClass('mail-category-border');
            expect(categoryTab.dataset.color).toStrictEqual(CATEGORIES_COLOR_SHADES.RED);
        });

        it('should select updates when category is in categoryIDs', async () => {
            await mailTestRender(<CategoriesTabs />, {
                preloadedState: {
                    elements: newElementsState({ params: { categoryIDs: [MAILBOX_LABEL_IDS.CATEGORY_UPDATES] } }),
                },
            });
            const categoryTab = screen.getByTestId(`category-tab-${MAILBOX_LABEL_IDS.CATEGORY_UPDATES}`);
            expect(categoryTab).toHaveClass('mail-category-border');
            expect(categoryTab.dataset.color).toStrictEqual(CATEGORIES_COLOR_SHADES.PINK);
        });
    });

    describe('error boundaries test', () => {
        // This is used to mock the console.error and avoid spamming logs
        let consoleErrorSpy: jest.SpyInstance;

        afterEach(() => {
            jest.resetModules();
            jest.clearAllMocks();

            consoleErrorSpy.mockRestore();
        });

        beforeAll(() => {
            consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('shows refresh when whole list crashes', async () => {
            jest.isolateModules(() => {
                jest.mock('./Tab', () => ({
                    Tab: () => {
                        throw new Error('Tab crashed');
                    },
                }));
                // Import AFTER mock is set up inside isolateModules
                const { CategoriesTabs } = require('./CategoriesTabs');

                return mailTestRender(<CategoriesTabs labelID={MAILBOX_LABEL_IDS.CATEGORY_DEFAULT} />);
            });

            const errorMessage = await screen.findByText('An error occurred with the categories');
            expect(errorMessage).toBeInTheDocument();

            const refreshButton = await screen.findByText('Refresh the page');
            expect(refreshButton).toBeInTheDocument();
        });

        it('shows error on the tab when it crashes', async () => {
            jest.spyOn(helpers, 'getLabelFromCategoryId').mockImplementation((id: any) => {
                if (id === MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS) {
                    throw new Error('forced crash');
                }
                return 'Label';
            });

            await mailTestRender(<CategoriesTabs />);

            const errorMessage = await screen.findAllByText('Something went wrong');
            expect(errorMessage).toHaveLength(1);
        });
    });
});

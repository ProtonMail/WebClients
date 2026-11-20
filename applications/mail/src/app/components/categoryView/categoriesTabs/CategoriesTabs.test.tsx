import type { PropsWithChildren } from 'react';

import { screen } from '@testing-library/react';
import type { MockInstance } from 'vitest';

import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import * as helpers from '@proton/mail/features/categoriesView/categoriesStringHelpers';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mailTestRender } from '../../../helpers/tests/render';
import { newElementsState } from '../../../store/elements/elementsSlice';
import { useCategoriesImproveSpotlight } from '../categoriesImproveSpotlight/useCategoriesImproveSpotlight';
import { mockActiveCategoriesData } from '../testUtils/helpers';
import { CategoriesTabs } from './CategoriesTabs';

vi.mock('../useCategoriesView', () => ({
    useCategoriesView: vi.fn(() => ({
        categoriesStore: [],
        activeCategoriesTabs: mockActiveCategoriesData,
    })),
}));

vi.mock('./useCategoriesBadge', () => ({
    useCategoriesBadge: vi.fn(() => ({
        shouldShowCounter: false,
        shouldShowNewBadge: false,
    })),
}));

vi.mock('../categoriesOnboarding/CategoriesOnboardingSpotlights', () => ({
    CategoriesOnboardingSpotlight: ({ children }: PropsWithChildren) => <>{children}</>,
}));

vi.mock('../categoriesImproveSpotlight/useCategoriesImproveSpotlight', () => ({
    useCategoriesImproveSpotlight: vi.fn(() => ({ isEligible: false })),
}));

vi.mock('../categoriesOnboarding/CategoriesOnboardingContext', () => ({
    useCategoriesOnboarding: vi.fn(() => ({
        activeStep: 6, // OnboardingStep.DONE
        userIsInB2COnboardingFlow: false,
    })),
}));

vi.mock('@proton/mail/features/categoriesView/categoriesStringHelpers', async () => ({
    ...(await vi.importActual('@proton/mail/features/categoriesView/categoriesStringHelpers')),
    getLabelFromCategoryId: vi.fn(
        (await vi.importActual<any>('@proton/mail/features/categoriesView/categoriesStringHelpers'))
            .getLabelFromCategoryId
    ),
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
        let consoleErrorSpy: MockInstance;

        afterEach(() => {
            vi.clearAllMocks();
            vi.mocked(useCategoriesImproveSpotlight).mockReset();

            consoleErrorSpy.mockRestore();
        });

        beforeAll(() => {
            consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
        });

        it('shows refresh when whole list crashes', async () => {
            vi.mocked(useCategoriesImproveSpotlight).mockImplementation(() => {
                throw new Error('Categories crashed');
            });

            await mailTestRender(<CategoriesTabs />);

            const errorMessage = await screen.findByText('An error occurred with the categories');
            expect(errorMessage).toBeInTheDocument();

            const refreshButton = await screen.findByText('Refresh the page');
            expect(refreshButton).toBeInTheDocument();
        });

        it('shows error on the tab when it crashes', async () => {
            vi.mocked(helpers.getLabelFromCategoryId).mockImplementation((id: any) => {
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

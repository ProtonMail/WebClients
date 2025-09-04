import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mailTestRender } from 'proton-mail/helpers/test/helper';

import * as helpers from '../categoriesStringHelpers';
import { CategoriesTabs } from './CategoriesTabs';

describe('CategoriesTabs', () => {
    it.each([
        { label: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, colorShade: 'iris' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, colorShade: 'sky' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, colorShade: 'teal' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, colorShade: 'pink' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, colorShade: 'blue' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_UPDATES, colorShade: 'purple' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_FORUMS, colorShade: 'amber' },
    ])('should render the categories with the proper border class', async ({ label, colorShade }) => {
        await mailTestRender(<CategoriesTabs labelID={label} />);
        const categoryTab = screen.getByTestId(`category-tab-${label}`);
        expect(categoryTab).toHaveClass('mail-category-border');
        expect(categoryTab.dataset.color).toStrictEqual(colorShade);
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

            const errorMessage = await screen.findByText('An error occured with the categories');
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

            await mailTestRender(<CategoriesTabs labelID={MAILBOX_LABEL_IDS.CATEGORY_DEFAULT} />);

            const errorMessage = await screen.findAllByText('Something went wrong');
            expect(errorMessage).toHaveLength(1);
        });
    });
});

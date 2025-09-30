import { ALMOST_ALL_MAIL } from '@proton/shared/lib/mail/mailSettings';
import { mockUseFolders, mockUseLabels } from '@proton/testing';
import { mockUseMailSettings } from '@proton/testing/lib/mockUseMailSettings';

import { mockUseEncryptedSearchContext } from 'proton-mail/helpers/test/mockUseEncryptedSearchContext';
import { mockUseScheduleSendFeature } from 'proton-mail/helpers/test/mockUseScheduleSendFeature';

import { isCustomFolder, isDefaultFolder, isLabel } from './advancesSearchFieldHelpers';
import { useLocationFieldOptions } from './useLocationFieldOptions';
import { expectedAll, expectedGrouped } from './useLocationFieldOptions.test.data';

jest.mock('proton-mail/components/categoryView/useCategoriesView', () => ({
    useCategoriesView: jest.fn(() => ({
        categoriesStore: [],
        categoriesTabs: [],
        activeCategoriesTabs: [],
    })),
}));

describe('useLocationFieldOptions', () => {
    beforeEach(() => {
        mockUseEncryptedSearchContext();
        mockUseMailSettings();
        mockUseScheduleSendFeature();
        mockUseLabels([
            [
                {
                    ID: 'highlighted',
                    Name: 'highlighted',
                    Path: 'highlighted',
                    Type: 1,
                    Color: '#EC3E7C',
                    Order: 2,
                    Display: 1,
                },
            ],
        ]);
        mockUseFolders([
            [
                {
                    ID: '31dixxUc6tNkpKrI-abC_IQcnG4_K2brHumXkQb_Ib4-FEl5Q3n27dbhIkfBTnYrNonJ8DsySBbUM0RtQdhYhA==',
                    Name: 'news',
                    Path: 'news',
                    Type: 3,
                    Color: '#54473f',
                    Order: 1,
                    Notify: 1,
                    Expanded: 0,
                },
            ],
        ]);
    });

    it('should return correct helper', () => {
        const [defaults, customs, labels] = expectedGrouped;
        const helper = useLocationFieldOptions();

        expect(helper.all).toStrictEqual(expectedAll);
        expect(helper.grouped).toStrictEqual(expectedGrouped);

        expect(helper.findItemByValue('highlighted')).toStrictEqual(labels.items[0]);

        expect(isDefaultFolder(defaults.items[0])).toBe(true);
        expect(isDefaultFolder(customs.items[0])).toBe(false);

        expect(isCustomFolder(customs.items[0])).toBe(true);
        expect(isCustomFolder(defaults.items[0])).toBe(false);

        expect(isLabel(labels.items[0])).toBe(true);
        expect(isLabel(customs.items[0])).toBe(false);
    });

    describe('when Almost All Mail is true', () => {
        beforeEach(() => {
            mockUseMailSettings([{ AlmostAllMail: ALMOST_ALL_MAIL.ENABLED }]);
        });

        it('should return specific helper', () => {
            const helper = useLocationFieldOptions();

            expect(helper.all).toStrictEqual([
                {
                    value: '15',
                    text: 'All mail',
                    url: '/almost-all-mail',
                    icon: 'envelopes',
                },
                ...expectedAll.slice(1),
            ]);
        });
    });
});

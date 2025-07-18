import { screen } from '@testing-library/react';

import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { render } from 'proton-mail/helpers/test/helper';

import { CategoriesTabs } from './CategoriesTabs';

describe('CategoriesTabs', () => {
    it.each([
        { label: MAILBOX_LABEL_IDS.CATEGORY_DEFAULT, borderClass: 'border-iris-500' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL, borderClass: 'border-sky-500' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_PROMOTIONS, borderClass: 'border-teal-500' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_NEWSLETTERS, borderClass: 'border-pink-500' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_TRANSACTIONS, borderClass: 'border-blue-500' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_UPDATES, borderClass: 'border-purple-500' },
        { label: MAILBOX_LABEL_IDS.CATEGORY_FORUMS, borderClass: 'border-amber-500' },
    ])('should render the categories with the proper border class', async ({ label, borderClass }) => {
        await render(<CategoriesTabs labelID={label} />);
        const categoryTab = screen.getByTestId(`category-tab-${label}`);
        expect(categoryTab).toHaveClass(borderClass);
    });
});

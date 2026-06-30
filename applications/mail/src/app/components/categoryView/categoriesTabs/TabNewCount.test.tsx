import { render, screen } from '@testing-library/react';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { useMailSelector } from 'proton-mail/store/hooks';

import { TabNewCount } from './TabNewCount';

jest.mock('proton-mail/store/hooks');

const category: CategoryTab = {
    id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    display: true,
    notify: true,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
};

describe('TabNewCount', () => {
    afterEach(() => {
        jest.clearAllMocks();
    });

    it('renders the "N new" count', () => {
        jest.mocked(useMailSelector).mockReturnValue(3);

        render(<TabNewCount category={category} />);
        expect(screen.getByText('3 new')).toBeInTheDocument();
    });

    it('caps the count at "99+ new"', () => {
        jest.mocked(useMailSelector).mockReturnValue(1500);

        render(<TabNewCount category={category} />);
        expect(screen.getByText('99+ new')).toBeInTheDocument();
    });

    it('renders nothing when there is no unread mail', () => {
        jest.mocked(useMailSelector).mockReturnValue(0);

        const { container } = render(<TabNewCount category={category} />);
        expect(container).toBeEmptyDOMElement();
    });
});

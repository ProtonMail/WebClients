import { render, screen } from '@testing-library/react';

import type { CategoryTab } from '@proton/mail/features/categoriesView/categoriesConstants';
import { CATEGORIES_COLOR_SHADES } from '@proton/mail/features/categoriesView/categoriesConstants';
import { useMailSettings } from '@proton/mail/store/mailSettings/hooks';
import { MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';
import { DEFAULT_MAIL_SETTINGS } from '@proton/shared/lib/mail/mailSettings';
import { useFlag } from '@proton/unleash/useFlag';

import { useMailSelector } from 'proton-mail/store/hooks';

import { TabBadge } from './TabBadge';
import { TabState } from './tabsInterface';

jest.mock('@proton/mail/store/mailSettings/hooks');
jest.mock('@proton/unleash/useFlag');
jest.mock('proton-mail/store/hooks');

const category: CategoryTab = {
    id: MAILBOX_LABEL_IDS.CATEGORY_SOCIAL,
    display: true,
    notify: true,
    colorShade: CATEGORIES_COLOR_SHADES.IRIS,
};

describe('TabBadge', () => {
    beforeEach(() => {
        jest.mocked(useMailSettings).mockReturnValue([DEFAULT_MAIL_SETTINGS, false]);
        jest.mocked(useFlag).mockReturnValue(true);
        jest.mocked(useMailSelector).mockReturnValue(0);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    describe('when the feature flag is off (legacy behaviour)', () => {
        beforeEach(() => {
            jest.mocked(useFlag).mockReturnValue(false);
        });

        it('renders the raw unread count', () => {
            jest.mocked(useMailSelector).mockReturnValue(5);

            render(
                <TabBadge
                    category={category}
                    tabState={TabState.INACTIVE}
                    shouldShowCounter={false}
                    shouldShowNewBadge={false}
                />
            );
            expect(screen.getByText('5')).toBeInTheDocument();
        });

        it('renders nothing when there are no unread messages', () => {
            jest.mocked(useMailSelector).mockReturnValue(0);

            const { container } = render(
                <TabBadge
                    category={category}
                    tabState={TabState.INACTIVE}
                    shouldShowCounter={false}
                    shouldShowNewBadge={false}
                />
            );
            expect(container).toBeEmptyDOMElement();
        });
    });

    it('renders the New badge and takes precedence over the counter', () => {
        jest.mocked(useMailSelector).mockReturnValue(5);

        render(
            <TabBadge
                category={category}
                tabState={TabState.INACTIVE}
                shouldShowCounter={true}
                shouldShowNewBadge={true}
            />
        );
        expect(screen.getByText('New')).toBeInTheDocument();
        expect(screen.queryByText('5')).not.toBeInTheDocument();
    });

    it('renders the counter when enabled and there are unread messages', () => {
        jest.mocked(useMailSelector).mockReturnValue(5);

        render(
            <TabBadge
                category={category}
                tabState={TabState.INACTIVE}
                shouldShowCounter={true}
                shouldShowNewBadge={false}
            />
        );
        expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('caps the displayed count at 999+', () => {
        jest.mocked(useMailSelector).mockReturnValue(1500);

        render(
            <TabBadge
                category={category}
                tabState={TabState.INACTIVE}
                shouldShowCounter={true}
                shouldShowNewBadge={false}
            />
        );
        expect(screen.getByText('999+')).toBeInTheDocument();
    });

    it('renders nothing when the counter is enabled but there are no unread messages', () => {
        jest.mocked(useMailSelector).mockReturnValue(0);

        const { container } = render(
            <TabBadge
                category={category}
                tabState={TabState.INACTIVE}
                shouldShowCounter={true}
                shouldShowNewBadge={false}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });

    it('renders nothing when neither badge nor counter should be shown', () => {
        jest.mocked(useMailSelector).mockReturnValue(5);

        const { container } = render(
            <TabBadge
                category={category}
                tabState={TabState.INACTIVE}
                shouldShowCounter={false}
                shouldShowNewBadge={false}
            />
        );
        expect(container).toBeEmptyDOMElement();
    });
});

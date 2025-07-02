import { fireEvent, screen } from '@testing-library/react';

import { render } from 'proton-mail/helpers/test/render';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import * as mailboxSelectors from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { generateSubscriptionList } from '../testData';
import { NewsletterSubscriptionList } from './NewsletterSubscriptionList';

jest.mock('proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector', () => ({
    ...jest.requireActual('proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector'),
    selectedTab: jest.fn(),
    selectSubscriptionsCount: jest.fn(),
    selectTabSubscriptionsList: jest.fn(),
    selectTabSubscriptionPaginationQueryString: jest.fn(),
    selectedTabSubscriptionsCount: jest.fn(),
}));

const mockedSelectedTab = mailboxSelectors.selectedTab as jest.Mock;
const mockedSelectSubscriptionsCount = mailboxSelectors.selectSubscriptionsCount as jest.Mock;
const mockedSelectTabSubscriptionsList = mailboxSelectors.selectTabSubscriptionsList as unknown as jest.Mock;
const mockedSelectTabSubscriptionPaginationQueryString =
    mailboxSelectors.selectTabSubscriptionPaginationQueryString as unknown as jest.Mock;
const mockedSelectedTabSubscriptionsCount = mailboxSelectors.selectedTabSubscriptionsCount as unknown as jest.Mock;

describe('NewsletterSubscriptionList', () => {
    beforeEach(() => {
        mockedSelectedTab.mockReturnValue(SubscriptionTabs.Active);
        mockedSelectSubscriptionsCount.mockReturnValue({
            active: 10,
            unsubscribe: 5,
        });
        mockedSelectTabSubscriptionsList.mockReturnValue([]);
        mockedSelectedTabSubscriptionsCount.mockReturnValue(10);
        jest.spyOn(newsletterSubscriptionsActions, 'setSelectedTab');
        jest.spyOn(newsletterSubscriptionsActions, 'setSortingOrder');
    });

    describe('Placeholder', () => {
        it('should render a placeholder when the list is empty', async () => {
            await render(<NewsletterSubscriptionList />);

            const title = screen.getByText('No mail subscriptions');
            expect(title).toBeInTheDocument();
        });

        it('should render the unsubscribe placeholder when the tab is unsubscribed', async () => {
            mockedSelectedTab.mockReturnValue(SubscriptionTabs.Unsubscribe);

            await render(<NewsletterSubscriptionList />);

            const title = screen.getByText('No unsubscribed newsletters');
            expect(title).toBeInTheDocument();
        });
    });

    describe('Header', () => {
        it('should contain the correct count of subscriptions when value is not 0', async () => {
            await render(<NewsletterSubscriptionList />);

            const activeCount = screen.getByTestId('newsletter-subscription-list-header--active-count');
            expect(activeCount).toHaveTextContent('10');

            const unsubscribedCount = screen.getByTestId('newsletter-subscription-list-header--unsubscribed-count');
            expect(unsubscribedCount).toHaveTextContent('5');
        });

        it('should not display the count when the value is 0', async () => {
            mockedSelectSubscriptionsCount.mockReturnValue({
                active: 0,
                unsubscribe: 0,
            });

            await render(<NewsletterSubscriptionList />);

            const activeCount = screen.queryByTestId('newsletter-subscription-list-header--active-count');
            expect(activeCount).not.toBeInTheDocument();

            const unsubscribedCount = screen.queryByTestId('newsletter-subscription-list-header--unsubscribed-count');
            expect(unsubscribedCount).not.toBeInTheDocument();
        });

        it('should set state with active tab when the active tab is clicked', async () => {
            await render(<NewsletterSubscriptionList />);

            const activeTab = screen.getByTestId('newsletter-subscription-list-header--active');
            expect(activeTab).toBeInTheDocument();

            fireEvent.click(activeTab);
            expect(newsletterSubscriptionsActions.setSelectedTab).toHaveBeenCalledWith(SubscriptionTabs.Active);
        });

        it('should set state with unsubscribe tab when the unsubscribe tab is clicked', async () => {
            await render(<NewsletterSubscriptionList />);

            const unsubscribeTab = screen.getByTestId('newsletter-subscription-list-header--unsubscribed');
            expect(unsubscribeTab).toBeInTheDocument();

            fireEvent.click(unsubscribeTab);
            expect(newsletterSubscriptionsActions.setSelectedTab).toHaveBeenCalledWith(SubscriptionTabs.Unsubscribe);
        });

        it('should display the selected sorting option when there is subscriptions on the tab', async () => {
            await render(<NewsletterSubscriptionList />);

            const sortingDropdown = screen.getByTestId('dropdown-button');
            expect(sortingDropdown).toBeInTheDocument();
            fireEvent.click(sortingDropdown);

            const recentlyReceivedOption = screen.getByTestId('dropdown-item-inbox');
            expect(recentlyReceivedOption).toBeInTheDocument();
            expect(recentlyReceivedOption).toHaveClass('dropdown-item--is-selected');
        });

        it('should have a disabled sorting dropdown when there are no subscriptions on the tab', async () => {
            mockedSelectedTabSubscriptionsCount.mockReturnValue(0);

            await render(<NewsletterSubscriptionList />);

            const sortingDropdown = screen.getByTestId('dropdown-button');
            expect(sortingDropdown).toBeInTheDocument();
            expect(sortingDropdown).toBeDisabled();
        });
    });

    describe('List', () => {
        it('should display the list of subscriptions', async () => {
            mockedSelectTabSubscriptionsList.mockReturnValue(generateSubscriptionList(10));
            await render(<NewsletterSubscriptionList />);

            const subscriptionCards = screen.getAllByTestId('subscription-card');
            expect(subscriptionCards).toHaveLength(10);
            expect(screen.queryByTestId('load-more-button')).not.toBeInTheDocument();
        });

        it('should show the load more button when there are more subscriptions', async () => {
            mockedSelectTabSubscriptionPaginationQueryString.mockReturnValue('?page=2');
            mockedSelectTabSubscriptionsList.mockReturnValue(generateSubscriptionList(10));
            await render(<NewsletterSubscriptionList />);

            const loadMoreButton = screen.getByTestId('load-more-button');
            expect(loadMoreButton).toBeInTheDocument();
        });
    });
});

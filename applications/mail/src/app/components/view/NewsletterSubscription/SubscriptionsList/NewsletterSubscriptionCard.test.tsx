import { fireEvent, screen } from '@testing-library/react';

import { mailTestRender } from 'proton-mail/helpers/test/render';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import * as mailboxSelectors from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';
import { newsletterSubscriptionsActions } from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSlice';

import { activeSubscription, unsubscribedSubscription } from '../testData';
import { NewsletterSubscriptionCard } from './NewsletterSubscriptionCard';

jest.mock('proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector', () => ({
    ...jest.requireActual('proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector'),
    selectedTab: jest.fn(),
}));
const mockedSelectedTab = mailboxSelectors.selectedTab as jest.Mock;

describe('NewsletterSubscriptionCard', () => {
    beforeEach(() => {
        mockedSelectedTab.mockReturnValue(SubscriptionTabs.Active);
        jest.spyOn(newsletterSubscriptionsActions, 'setSelectedSubscription');
    });

    afterEach(() => {
        jest.restoreAllMocks();
    });

    it('should show the active subscription data', async () => {
        await mailTestRender(<NewsletterSubscriptionCard subscription={activeSubscription} />);

        const title = screen.getByTestId('subscription-card-title');
        expect(title).toHaveTextContent(activeSubscription.Name);

        const sender = screen.getByTestId('subscription-card-sender');
        expect(sender).toHaveTextContent(activeSubscription.SenderAddress);

        const unsubscribeButton = screen.getByRole('button', { name: 'Unsubscribe' });
        expect(unsubscribeButton).toBeInTheDocument();

        const moveToFolderButton = screen.getByRole('button', { name: 'Move to folder' });
        expect(moveToFolderButton).toBeInTheDocument();

        const stats = screen.getByTestId('subscription-card-stats');
        expect(stats).toHaveTextContent('5 unread');
        expect(stats).toHaveTextContent('5 emails last month');

        const filterDropdown = screen.getByTestId('subscription-card-dropdown');
        expect(filterDropdown).toBeInTheDocument();
    });

    it('should hide the stats when in the unsubscribed tab', async () => {
        mockedSelectedTab.mockReturnValue(SubscriptionTabs.Unsubscribe);
        await mailTestRender(<NewsletterSubscriptionCard subscription={unsubscribedSubscription} />);

        const stats = screen.queryByTestId('subscription-card-stats');
        expect(stats).not.toBeInTheDocument();
    });

    it('should show the trash button when in the unsubscribed tab', async () => {
        mockedSelectedTab.mockReturnValue(SubscriptionTabs.Unsubscribe);
        await mailTestRender(<NewsletterSubscriptionCard subscription={unsubscribedSubscription} />);

        const trashButton = screen.getByRole('button', { name: 'Move to Trash' });
        expect(trashButton).toBeInTheDocument();
    });

    it('should call setSelectedSubscription with the correct data when isDeleting is false', async () => {
        await mailTestRender(<NewsletterSubscriptionCard subscription={activeSubscription} />);

        const card = screen.getByTestId('subscription-card');
        fireEvent.click(card);

        expect(newsletterSubscriptionsActions.setSelectedSubscription).toHaveBeenCalledWith(activeSubscription);
    });

    it('should not call setSelectedSubscription when isDeleting is true', async () => {
        await mailTestRender(<NewsletterSubscriptionCard subscription={activeSubscription} isDeleting />);

        const card = screen.getByTestId('subscription-card');
        fireEvent.click(card);

        expect(newsletterSubscriptionsActions.setSelectedSubscription).not.toHaveBeenCalled();
    });
});

import { fireEvent, screen } from '@testing-library/react';

import { mailTestRender } from 'proton-mail/helpers/test/render';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';
import * as mailboxSelectors from 'proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector';

import { unsubscribedSubscription } from '../testData';
import { SubscriptionCardButtons } from './NewsletterSubscriptionCardComponents';

jest.mock('proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector', () => ({
    ...jest.requireActual('proton-mail/store/newsletterSubscriptions/newsletterSubscriptionsSelector'),
    selectedTab: jest.fn(),
}));
const mockedSelectedTab = mailboxSelectors.selectedTab as jest.Mock;

const handleFilterClick = jest.fn();

describe('SubscriptionCardButtons', () => {
    beforeEach(() => {
        mockedSelectedTab.mockReturnValue(SubscriptionTabs.Active);
    });

    it('should call handleFilterClick with the correct filter type when the unsubscribe button is clicked', async () => {
        mockedSelectedTab.mockReturnValue(SubscriptionTabs.Unsubscribe);

        await mailTestRender(
            <SubscriptionCardButtons subscription={unsubscribedSubscription} handleFilterClick={handleFilterClick} />
        );

        const unsubscribeButton = screen.getByText('Move to Trash');
        fireEvent.click(unsubscribeButton);

        expect(handleFilterClick).toHaveBeenCalledWith('MoveToTrash');
    });
});

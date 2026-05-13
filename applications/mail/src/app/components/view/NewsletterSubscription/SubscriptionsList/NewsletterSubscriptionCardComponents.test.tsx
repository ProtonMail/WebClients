import { fireEvent, render, screen } from '@testing-library/react';

import { useMailSelector } from 'proton-mail/store/hooks';
import { SubscriptionTabs } from 'proton-mail/store/newsletterSubscriptions/interface';

import { unsubscribedSubscription } from '../testData';
import { SubscriptionCardButtons } from './NewsletterSubscriptionCardComponents';

jest.mock('proton-mail/store/hooks');
jest.mocked(useMailSelector).mockReturnValue(SubscriptionTabs.Unsubscribe);

const handleFilterClick = jest.fn();

describe('SubscriptionCardButtons', () => {
    it('should call handleFilterClick with the correct filter type when the unsubscribe button is clicked', async () => {
        render(
            <SubscriptionCardButtons subscription={unsubscribedSubscription} handleFilterClick={handleFilterClick} />
        );

        const unsubscribeButton = screen.getByTestId('move-to-trash');
        fireEvent.click(unsubscribeButton);

        expect(handleFilterClick).toHaveBeenCalledWith('MoveToTrash');
    });
});

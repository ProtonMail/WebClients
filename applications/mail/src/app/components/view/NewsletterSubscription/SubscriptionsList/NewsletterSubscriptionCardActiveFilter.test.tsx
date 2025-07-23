import { screen } from '@testing-library/react';

import { useFilters } from '@proton/mail/store/filters/hooks';
import { FILTER_STATUS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { render } from 'proton-mail/helpers/test/render';

import { activeSubscription, unsubscribedSubscription } from '../testData';
import { NewsletterSubscriptionCardActiveFilter } from './NewsletterSubscriptionCardActiveFilter';

jest.mock('@proton/mail/store/labels/hooks', () => ({
    useFolders: () => [[{ ID: 'custom-folder-1', Name: 'Custom Folder 1' }], false],
}));

jest.mock('@proton/mail/store/filters/hooks');
const mockedUseFilters = useFilters as jest.Mock;

describe('NewsletterSubscriptionCardActiveFilter', () => {
    beforeEach(() => {
        mockedUseFilters.mockReturnValue([[], false]);
    });

    it('should return null if the subscription has no filter', async () => {
        await render(<NewsletterSubscriptionCardActiveFilter subscription={activeSubscription} />);
        const filter = screen.queryByTestId('subscription-filter-wrapper');
        expect(filter).not.toBeInTheDocument();
    });

    it('should show the MarkAsRead filter', async () => {
        const subscription = {
            ...activeSubscription,
            MarkAsRead: true,
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const markAsReadFilter = screen.getByTestId('subscription-filter-wrapper');
        expect(markAsReadFilter).toBeInTheDocument();
        expect(markAsReadFilter).toHaveTextContent('Active filter: Mark all messages as read');
    });

    it('should not show the MoveToFolder filter when only current messages are moved to trash', async () => {
        const subscription = {
            ...activeSubscription,
            MoveToFolder: MAILBOX_LABEL_IDS.TRASH,
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const moveToFolderFilter = screen.queryByTestId('subscription-filter-wrapper');
        expect(moveToFolderFilter).not.toBeInTheDocument();
    });

    it('should not show the MoveToFolder filter when future messages are moved to trash', async () => {
        const subscription = {
            ...activeSubscription,
            MoveToFolder: MAILBOX_LABEL_IDS.TRASH,
            FilterID: 'temporaryFilterID',
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const moveToFolderFilter = screen.getByTestId('subscription-filter-wrapper');
        expect(moveToFolderFilter).toBeInTheDocument();
        expect(moveToFolderFilter).toHaveTextContent('Active filter: Move all messages to Trash');
    });

    it('should not show the MoveToFolder filter when only current messages are moved to archive', async () => {
        const subscription = {
            ...activeSubscription,
            MoveToFolder: MAILBOX_LABEL_IDS.ARCHIVE,
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const moveToFolderFilter = screen.queryByTestId('subscription-filter-wrapper');
        expect(moveToFolderFilter).not.toBeInTheDocument();
    });

    it('should not show the MoveToFolder filter when future messages are moved to archive', async () => {
        const subscription = {
            ...activeSubscription,
            MoveToFolder: MAILBOX_LABEL_IDS.ARCHIVE,
            FilterID: 'temporaryFilterID',
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const moveToFolderFilter = screen.getByTestId('subscription-filter-wrapper');
        expect(moveToFolderFilter).toBeInTheDocument();
        expect(moveToFolderFilter).toHaveTextContent('Active filter: Move all messages to Archive');
    });

    it('should not show the MoveToFolder filter when the current messages are moved to a custom folder', async () => {
        const subscription = {
            ...activeSubscription,
            MoveToFolder: 'custom-folder-1',
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const moveToFolderFilter = screen.queryByTestId('subscription-filter-wrapper');
        expect(moveToFolderFilter).not.toBeInTheDocument();
    });

    it('should show the MoveToFolder filter when the future messages are moved to a custom folder', async () => {
        const subscription = {
            ...activeSubscription,
            MoveToFolder: 'custom-folder-1',
            FilterID: 'temporaryFilterID',
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const moveToFolderFilter = screen.getByTestId('subscription-filter-wrapper');
        expect(moveToFolderFilter).toBeInTheDocument();
        expect(moveToFolderFilter).toHaveTextContent('Active filter: Move all messages to Custom Folder 1');
    });

    it('should show the disabled filter status', async () => {
        mockedUseFilters.mockReturnValue([
            [
                {
                    ID: 'filter-1',
                    Status: FILTER_STATUS.DISABLED,
                },
            ],
            false,
        ]);

        const subscription = {
            ...activeSubscription,
            FilterID: 'filter-1',
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const filterStatus = screen.getByTestId('subscription-filter-wrapper');
        expect(filterStatus).toHaveTextContent('The filter is disabled.');
    });

    it('should show the filter on unsubscribed subscription', async () => {
        const subscription = {
            ...unsubscribedSubscription,
            MarkAsRead: true,
        };

        await render(<NewsletterSubscriptionCardActiveFilter subscription={subscription} />);

        const markAsReadFilter = screen.getByTestId('subscription-filter-wrapper');
        expect(markAsReadFilter).toBeInTheDocument();
        expect(markAsReadFilter).toHaveTextContent('Active filter: Mark all messages as read');
    });
});

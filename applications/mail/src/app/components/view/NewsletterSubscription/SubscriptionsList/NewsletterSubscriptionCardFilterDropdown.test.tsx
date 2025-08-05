import { fireEvent, screen } from '@testing-library/react';

import { useFilters } from '@proton/mail/store/filters/hooks';
import { FILTER_STATUS, MAILBOX_LABEL_IDS } from '@proton/shared/lib/constants';

import { mailTestRender } from 'proton-mail/helpers/test/render';

import { activeSubscription } from '../testData';
import { NewsletterSubscriptionCardFilterDropdown } from './NewsletterSubscriptionCardFilterDropdown';

jest.mock('@proton/mail/store/filters/hooks');
const mockedUseFilters = useFilters as jest.Mock;

const handleSubscriptionFilter = jest.fn();

describe('NewsletterSubscriptionCardFilterDropdown', () => {
    beforeEach(() => {
        mockedUseFilters.mockReturnValue([[], false]);
    });

    it('should call the handleSubscriptionFilter when the mark as read item is clicked', async () => {
        await mailTestRender(
            <NewsletterSubscriptionCardFilterDropdown
                subscription={activeSubscription}
                handleSubscriptionFilter={handleSubscriptionFilter}
            />
        );

        const button = screen.getByTestId('dropdown-button');
        expect(button).toBeInTheDocument();
        fireEvent.click(button);

        const markAsReadItem = screen.getByTestId('dropdown-item-MarkAsRead');
        expect(markAsReadItem).toBeInTheDocument();
        fireEvent.click(markAsReadItem);

        expect(handleSubscriptionFilter).toHaveBeenCalledWith('MarkAsRead');
    });

    it('should call the handleSubscriptionFilter when the move to archive item is clicked', async () => {
        await mailTestRender(
            <NewsletterSubscriptionCardFilterDropdown
                subscription={activeSubscription}
                handleSubscriptionFilter={handleSubscriptionFilter}
            />
        );

        const button = screen.getByTestId('dropdown-button');
        expect(button).toBeInTheDocument();
        fireEvent.click(button);

        const moveToArchiveItem = screen.getByTestId('dropdown-item-MoveToArchive');
        expect(moveToArchiveItem).toBeInTheDocument();
        fireEvent.click(moveToArchiveItem);

        expect(handleSubscriptionFilter).toHaveBeenCalledWith('MoveToArchive');
    });

    describe('Copy change when the filter is enabled', () => {
        beforeEach(() => {
            mockedUseFilters.mockReturnValue([
                [
                    {
                        ID: 'filter-1',
                        Status: FILTER_STATUS.ENABLED,
                    },
                ],
                false,
            ]);
        });

        it('should change the copy if the newsletter has mark as read', async () => {
            const subscription = {
                ...activeSubscription,
                FilterID: 'filter-1',
                MarkAsRead: true,
            };

            await mailTestRender(
                <NewsletterSubscriptionCardFilterDropdown
                    subscription={subscription}
                    handleSubscriptionFilter={handleSubscriptionFilter}
                />
            );

            const button = screen.getByTestId('dropdown-button');
            expect(button).toBeInTheDocument();
            fireEvent.click(button);

            const markAsReadItem = screen.getByTestId('dropdown-item-MarkAsRead');
            expect(markAsReadItem).toBeInTheDocument();
            expect(markAsReadItem).toHaveTextContent('Stop marking as read');
        });

        it('should change the copy if the newsletter has move to archive', async () => {
            const subscription = {
                ...activeSubscription,
                FilterID: 'filter-1',
                MoveToFolder: MAILBOX_LABEL_IDS.ARCHIVE,
            };

            await mailTestRender(
                <NewsletterSubscriptionCardFilterDropdown
                    subscription={subscription}
                    handleSubscriptionFilter={handleSubscriptionFilter}
                />
            );

            const button = screen.getByTestId('dropdown-button');
            expect(button).toBeInTheDocument();
            fireEvent.click(button);

            const markAsReadItem = screen.getByTestId('dropdown-item-MoveToArchive');
            expect(markAsReadItem).toBeInTheDocument();
            expect(markAsReadItem).toHaveTextContent('Stop moving to Archive');
        });

        it('should change the copy if the newsletter has move to trash', async () => {
            const subscription = {
                ...activeSubscription,
                FilterID: 'filter-1',
                MoveToFolder: MAILBOX_LABEL_IDS.TRASH,
            };

            await mailTestRender(
                <NewsletterSubscriptionCardFilterDropdown
                    subscription={subscription}
                    handleSubscriptionFilter={handleSubscriptionFilter}
                />
            );

            const button = screen.getByTestId('dropdown-button');
            expect(button).toBeInTheDocument();
            fireEvent.click(button);

            const markAsReadItem = screen.getByTestId('dropdown-item-MoveToTrash');
            expect(markAsReadItem).toBeInTheDocument();
            expect(markAsReadItem).toHaveTextContent('Stop moving to Trash');
        });
    });
});

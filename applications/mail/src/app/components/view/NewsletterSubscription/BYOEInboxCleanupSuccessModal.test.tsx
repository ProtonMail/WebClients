import { fireEvent, screen } from '@testing-library/react';

import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { mailTestRender } from '../../../helpers/tests/render';
import { initialState } from '../../../store/newsletterSubscriptions/constants';
import { SubscriptionTabs } from '../../../store/newsletterSubscriptions/interface';
import { newsletterSubscriptionName } from '../../../store/newsletterSubscriptions/newsletterSubscriptionsSlice';
import { BYOEInboxCleanupSuccessModal } from './BYOEInboxCleanupSuccessModal';
import { generateSubscriptionList } from './testData';

const NEWSLETTERS_PATH = '/views/newsletters';

const getSenders = (last30Days: number[]): NewsletterSubscription[] => {
    return generateSubscriptionList(last30Days.length).map((subscription, index) => ({
        ...subscription,
        Name: `Sender ${index + 1}`,
        ReceivedMessages: { ...subscription.ReceivedMessages, Last30Days: last30Days[index] },
    }));
};

const renderSuccessModal = async (unsubscribed: NewsletterSubscription[]) => {
    const onClose = vi.fn();
    const { store, history } = await mailTestRender(
        <BYOEInboxCleanupSuccessModal open onClose={onClose} onExit={vi.fn()} unsubscribed={unsubscribed} />,
        {
            preloadedState: { [newsletterSubscriptionName]: initialState },
            initialEntries: [NEWSLETTERS_PATH],
        }
    );

    const getSelectedTab = () => {
        return store.getState()[newsletterSubscriptionName].value?.selectedTab;
    };

    return { onClose, history, getSelectedTab };
};

describe('BYOEInboxCleanupSuccessModal', () => {
    it('shows the illustration, the title, the Unsubscribed line and Go to my inbox, labelled by its title', async () => {
        await renderSuccessModal(getSenders([30]));

        const title = screen.getByRole('heading', { name: 'Your inbox just got lighter' });
        expect(document.querySelector('dialog')).toHaveAttribute('aria-labelledby', title.id);
        expect(document.querySelector('img[alt=""]')).toBeInTheDocument();
        expect(screen.getByText(/Changed your mind\? Find it under/)).toHaveTextContent(
            'Changed your mind? Find it under Unsubscribed.'
        );
        expect(screen.getByRole('button', { name: 'Unsubscribed' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Go to my inbox' })).toBeInTheDocument();
        expect(screen.getByTestId('modal:close')).toBeInTheDocument();
    });

    it("names the sender and gives about n fewer emails a month, keeping 'past emails stay right here'", async () => {
        await renderSuccessModal(getSenders([30]));

        expect(
            screen.getByText(
                "You've unsubscribed from Sender 1. That's about 30 fewer emails a month, and past emails stay right here."
            )
        ).toBeInTheDocument();
    });

    it('gives the number of mailing lists for several senders and adds up their emails in the last 30 days', async () => {
        await renderSuccessModal(getSenders([12, 0, 7]));

        expect(
            screen.getByText(
                "You've unsubscribed from 3 mailing lists. That's about 19 fewer emails a month, and past emails stay right here."
            )
        ).toBeInTheDocument();
    });

    it("reads 'about 1 fewer email a month' for a total of 1", async () => {
        await renderSuccessModal(getSenders([1, 0]));

        expect(
            screen.getByText(
                "You've unsubscribed from 2 mailing lists. That's about 1 fewer email a month, and past emails stay right here."
            )
        ).toBeInTheDocument();
    });

    it.each([
        { senders: [0], text: "You've unsubscribed from Sender 1, and past emails stay right here." },
        { senders: [0, 0, 0], text: "You've unsubscribed from 3 mailing lists, and past emails stay right here." },
    ])('leaves out the middle sentence when the total is 0 ($senders.length senders)', async ({ senders, text }) => {
        await renderSuccessModal(getSenders(senders));

        expect(screen.getByText(text)).toBeInTheDocument();
    });

    it.each([
        {
            name: 'Go to my inbox',
            close: () => fireEvent.click(screen.getByRole('button', { name: 'Go to my inbox' })),
        },
        { name: 'the close button', close: () => fireEvent.click(screen.getByTestId('modal:close')) },
        {
            name: 'Escape',
            close: () => fireEvent.keyDown(screen.getByRole('button', { name: 'Go to my inbox' }), { key: 'Escape' }),
        },
    ])('$name closes it without changing the Mailing lists tab or the page address', async ({ close }) => {
        const { onClose, history, getSelectedTab } = await renderSuccessModal(getSenders([30]));

        close();

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getSelectedTab()).toBe(SubscriptionTabs.Active);
        expect(history.location.pathname).toBe(NEWSLETTERS_PATH);
    });

    it('Unsubscribed closes it and switches Mailing lists to the Unsubscribed tab', async () => {
        const { onClose, history, getSelectedTab } = await renderSuccessModal(getSenders([30]));

        fireEvent.click(screen.getByRole('button', { name: 'Unsubscribed' }));

        expect(onClose).toHaveBeenCalledTimes(1);
        expect(getSelectedTab()).toBe(SubscriptionTabs.Unsubscribe);
        expect(history.location.pathname).toBe(NEWSLETTERS_PATH);
    });
});

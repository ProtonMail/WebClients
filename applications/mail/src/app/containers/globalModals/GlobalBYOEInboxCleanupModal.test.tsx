import { act, fireEvent, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { generateSubscriptionList } from '../../components/view/NewsletterSubscription/testData';
import { mailTestRender } from '../../helpers/tests/render';
import { GlobalBYOEInboxCleanupModal } from './GlobalBYOEInboxCleanupModal';
import { GlobalModalContext } from './globalModalContext';
import type { BYOEInboxCleanupChoice, ModalListener, ModalPayload } from './inteface';
import { ModalType } from './inteface';

const TITLE = 'Start with a cleaner Inbox';
const DESCRIPTION = "We found some mailing lists that you don't read. You can unsubscribe from them in one click.";

const defaultSubscriptions = generateSubscriptionList(3).map((subscription, index) => ({
    ...subscription,
    Name: `Sender ${index + 1}`,
    SenderAddress: `sender-${index + 1}@example.com`,
}));

interface RenderModalOptions {
    type?: ModalType;
    subscriptions?: NewsletterSubscription[];
    onConfirm?: (choice: BYOEInboxCleanupChoice) => Promise<void>;
}

const renderModal = async ({
    type = ModalType.BYOEInboxCleanup,
    subscriptions = defaultSubscriptions,
    onConfirm = jest.fn(() => Promise.resolve()),
}: RenderModalOptions = {}) => {
    const onDisplayed = jest.fn();
    const payload = { type, value: { subscriptions, onConfirm, onDisplayed } } as ModalPayload;

    const subscribe = jest.fn((callback: ModalListener) => {
        callback(payload);
        return () => {};
    });

    await mailTestRender(
        <GlobalModalContext.Provider value={{ notify: jest.fn(), subscribe }}>
            <GlobalBYOEInboxCleanupModal />
        </GlobalModalContext.Provider>
    );

    return { onDisplayed, onConfirm };
};

const getDialog = () => {
    return document.querySelector('dialog') as HTMLElement;
};

const isClosing = () => {
    return document.querySelector('.modal-two--out') !== null;
};

const getSenderCheckbox = ({ Name, SenderAddress }: Pick<NewsletterSubscription, 'Name' | 'SenderAddress'>) => {
    return screen.getByRole('checkbox', {
        name: (accessibleName) => accessibleName.includes(Name) && accessibleName.includes(SenderAddress),
    }) as HTMLInputElement;
};

const getSelectAllCheckbox = (count = defaultSubscriptions.length) => {
    return screen.getByRole('checkbox', { name: `Select all ${count} unused senders` }) as HTMLInputElement;
};

const expectEverySenderChecked = (checked: boolean) => {
    defaultSubscriptions.forEach((subscription) => {
        if (checked) {
            expect(getSenderCheckbox(subscription)).toBeChecked();
        } else {
            expect(getSenderCheckbox(subscription)).not.toBeChecked();
        }
    });
};

const finishClosing = () => {
    const closingModal = document.querySelector('.modal-two--out');
    if (closingModal) {
        // Mail's jsdom has no AnimationEvent, so fireEvent.animationEnd would drop the animation name
        const event = new Event('animationend', { bubbles: true });
        Object.assign(event, { animationName: 'anime-modal-two-out' });
        fireEvent(closingModal, event);
    }
};

const getArchiveCheckbox = () => {
    return screen.getByRole('checkbox', { name: 'Archive existing messages' });
};

const getUnsubscribeButton = () => {
    return screen.getByRole('button', { name: /Unsubscribe/ });
};

const createDeferred = () => {
    let resolve: () => void = () => {};
    let reject: (error: Error) => void = () => {};
    const promise = new Promise<void>((promiseResolve, promiseReject) => {
        resolve = promiseResolve;
        reject = promiseReject;
    });
    return { promise, resolve, reject };
};

const closeWith: Record<string, () => void> = {
    Skip: () => {
        fireEvent.click(screen.getByRole('button', { name: 'Skip' }));
    },
    'the close button': () => {
        fireEvent.click(screen.getByTestId('modal:close'));
    },
    Escape: () => {
        fireEvent.keyDown(screen.getByRole('button', { name: 'Skip' }), { key: 'Escape' });
    },
};

describe('GlobalBYOEInboxCleanupModal', () => {
    describe('opening and closing', () => {
        it('opens with the title and description when notified with its type', async () => {
            await renderModal();

            const title = screen.getByRole('heading', { name: TITLE });
            expect(getDialog()).toHaveAttribute('aria-labelledby', title.id);
            expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
            expect(screen.getByTestId('byoe-inbox-cleanup-icon')).toBeInTheDocument();
        });

        it('does not open for another modal type', async () => {
            await renderModal({ type: ModalType.Snooze });

            expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
        });

        it('reports it was shown once when it opens', async () => {
            const { onDisplayed } = await renderModal();

            expect(screen.getByText(TITLE)).toBeInTheDocument();
            expect(onDisplayed).toHaveBeenCalledTimes(1);
        });

        it('Skip closes without confirming', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.click(screen.getByRole('button', { name: 'Skip' }));

            expect(isClosing()).toBe(true);
            expect(onConfirm).not.toHaveBeenCalled();
        });

        it('the close button closes without confirming', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.click(screen.getByTestId('modal:close'));

            expect(isClosing()).toBe(true);
            expect(onConfirm).not.toHaveBeenCalled();
        });

        it('Escape closes without confirming', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.keyDown(screen.getByRole('button', { name: 'Skip' }), { key: 'Escape' });

            expect(isClosing()).toBe(true);
            expect(onConfirm).not.toHaveBeenCalled();
        });

        it('is full screen on small screens', async () => {
            await renderModal();

            expect(document.querySelector('.modal-two--fullscreen-on-mobile')).toBeInTheDocument();
        });
    });

    describe('senders', () => {
        it("lists one tick box per sender, named with the sender's name and address", async () => {
            await renderModal();

            defaultSubscriptions.forEach((subscription) => {
                expect(getSenderCheckbox(subscription)).toBeInTheDocument();
                expect(screen.getByText(subscription.Name)).toBeInTheDocument();
                expect(screen.getByText(subscription.SenderAddress)).toBeInTheDocument();
            });
            expect(screen.getAllByRole('checkbox', { name: /sender-\d@example\.com/ })).toHaveLength(3);
        });

        it("shows the sender's logo, or the initials when there is no logo", async () => {
            await renderModal();

            const logos = screen.getAllByTestId('contact-image');
            expect(logos).toHaveLength(3);

            fireEvent.error(logos[0]);

            expect(screen.getByTestId('contact-initials')).toHaveTextContent('S1');
            expect(screen.getAllByTestId('contact-image')).toHaveLength(2);
        });

        it('keeps the initials out of the tick box name', async () => {
            await renderModal();

            fireEvent.error(screen.getAllByTestId('contact-image')[0]);

            expect(getSenderCheckbox(defaultSubscriptions[0])).not.toHaveAccessibleName(/S1/);
        });

        it('shows no message count', async () => {
            await renderModal();

            expect(getSenderCheckbox(defaultSubscriptions[0])).toBeInTheDocument();
            expect(screen.queryByTestId('subscription-card-stats')).not.toBeInTheDocument();
            expect(screen.queryByText(/unread|last month/i)).not.toBeInTheDocument();
        });

        it("reads 'Select all 3 unused senders'", async () => {
            await renderModal();

            expect(getSelectAllCheckbox(3)).toBeInTheDocument();
        });

        it('reads the singular for one sender', async () => {
            await renderModal({ subscriptions: defaultSubscriptions.slice(0, 1) });

            expect(screen.getByRole('checkbox', { name: 'Select all 1 unused sender' })).toBeInTheDocument();
        });

        it('every sender starts selected', async () => {
            await renderModal();

            expectEverySenderChecked(true);
            expect(getSelectAllCheckbox()).toBeChecked();
            expect(getSelectAllCheckbox().indeterminate).toBe(false);
        });

        it('unticking a sender deselects only that sender', async () => {
            await renderModal();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[1]));

            expect(getSenderCheckbox(defaultSubscriptions[0])).toBeChecked();
            expect(getSenderCheckbox(defaultSubscriptions[1])).not.toBeChecked();
            expect(getSenderCheckbox(defaultSubscriptions[2])).toBeChecked();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[1]));

            expect(getSenderCheckbox(defaultSubscriptions[1])).toBeChecked();
        });

        it('select all unticks every sender when all are ticked, and ticks every sender otherwise', async () => {
            await renderModal();

            fireEvent.click(getSelectAllCheckbox());
            expectEverySenderChecked(false);
            expect(getSelectAllCheckbox()).not.toBeChecked();

            fireEvent.click(getSelectAllCheckbox());
            expectEverySenderChecked(true);

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getSelectAllCheckbox());
            expectEverySenderChecked(true);
        });

        it('select all is partly ticked when only some senders are ticked', async () => {
            await renderModal();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));

            expect(getSelectAllCheckbox().indeterminate).toBe(true);
            expect(getSelectAllCheckbox()).toBePartiallyChecked();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));

            expect(getSelectAllCheckbox().indeterminate).toBe(false);
        });

        it('long names and addresses have the full text as their title', async () => {
            const longSender = {
                ...defaultSubscriptions[0],
                Name: 'A very long newsletter name that will not fit on one line in the window',
                SenderAddress: 'a-very-long-newsletter-address-that-will-not-fit@newsletters.example.com',
            };
            await renderModal({ subscriptions: [longSender] });

            const name = screen.getByText(longSender.Name);
            const address = screen.getByText(longSender.SenderAddress);
            expect(name).toHaveAttribute('title', longSender.Name);
            expect(name).toHaveClass('text-ellipsis');
            expect(address).toHaveAttribute('title', longSender.SenderAddress);
            expect(address).toHaveClass('text-ellipsis');
        });

        it('the sender list is inside the scroll area and the title is not', async () => {
            await renderModal();

            const title = screen.getByRole('heading', { name: TITLE });
            const scrollArea = document.getElementById(`${title.id}-description`) as HTMLElement;

            expect(scrollArea).toContainElement(getSelectAllCheckbox());
            defaultSubscriptions.forEach((subscription) => {
                expect(scrollArea).toContainElement(getSenderCheckbox(subscription));
            });
            expect(scrollArea).not.toContainElement(title);
            expect(scrollArea).not.toContainElement(screen.getByText(DESCRIPTION));
        });

        it("a sender's tick box is in the Tab order and toggles with Space", async () => {
            await renderModal();
            const senderCheckbox = getSenderCheckbox(defaultSubscriptions[0]);

            // jsdom has no layout, so the modal's focus trap can't walk the Tab order: check the input is tabbable instead
            expect(senderCheckbox.tabIndex).toBeGreaterThanOrEqual(0);
            expect(senderCheckbox).toBeEnabled();

            act(() => {
                senderCheckbox.focus();
            });
            await userEvent.keyboard(' ');

            expect(senderCheckbox).toHaveFocus();
            expect(senderCheckbox).not.toBeChecked();

            await userEvent.keyboard(' ');

            expect(senderCheckbox).toBeChecked();
        });
    });

    describe('archive choice and Unsubscribe', () => {
        it('Archive existing messages starts ticked and can be unticked and ticked again', async () => {
            await renderModal();

            expect(getArchiveCheckbox()).toBeChecked();

            fireEvent.click(getArchiveCheckbox());
            expect(getArchiveCheckbox()).not.toBeChecked();

            fireEvent.click(getArchiveCheckbox());
            expect(getArchiveCheckbox()).toBeChecked();
        });

        it('the archive tick box sits outside the scroll area, above the buttons', async () => {
            await renderModal();

            const title = screen.getByRole('heading', { name: TITLE });
            const scrollArea = document.getElementById(`${title.id}-description`) as HTMLElement;
            const archiveCheckbox = getArchiveCheckbox();

            expect(scrollArea).not.toContainElement(archiveCheckbox);
            expect(
                archiveCheckbox.compareDocumentPosition(getUnsubscribeButton()) & Node.DOCUMENT_POSITION_FOLLOWING
            ).toBeTruthy();
        });

        it('Unsubscribe passes the selected senders and the archive choice', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[1]));
            fireEvent.click(getArchiveCheckbox());
            fireEvent.click(getUnsubscribeButton());

            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(onConfirm).toHaveBeenCalledWith({
                subscriptions: [defaultSubscriptions[0], defaultSubscriptions[2]],
                archive: false,
            });
        });

        it('Unsubscribe passes every sender and archiving when nothing was changed', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.click(getUnsubscribeButton());

            expect(onConfirm).toHaveBeenCalledWith({ subscriptions: defaultSubscriptions, archive: true });
        });

        it('Unsubscribe is disabled when no sender is selected', async () => {
            await renderModal();

            expect(getUnsubscribeButton()).toBeEnabled();

            fireEvent.click(getSelectAllCheckbox());

            expect(getUnsubscribeButton()).toBeDisabled();
        });

        it('Unsubscribe shows a spinner until the answer comes', async () => {
            const deferred = createDeferred();
            await renderModal({ onConfirm: jest.fn(() => deferred.promise) });

            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'false');

            fireEvent.click(getUnsubscribeButton());

            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'true');
            expect(isClosing()).toBe(false);

            await act(async () => {
                deferred.resolve();
            });

            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'false');
        });

        it('closes when the answer succeeds', async () => {
            await renderModal();

            await act(async () => {
                fireEvent.click(getUnsubscribeButton());
            });

            expect(isClosing()).toBe(true);
        });

        it('stays open with the same choices when the answer fails, and Unsubscribe can be pressed again with the current selection', async () => {
            const onConfirm = jest.fn(() => Promise.reject(new Error('Cleanup failed')));
            await renderModal({ onConfirm });

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[1]));
            fireEvent.click(getArchiveCheckbox());
            await act(async () => {
                fireEvent.click(getUnsubscribeButton());
            });

            expect(isClosing()).toBe(false);
            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'false');
            expect(getUnsubscribeButton()).toBeEnabled();
            expect(getSenderCheckbox(defaultSubscriptions[0])).toBeChecked();
            expect(getSenderCheckbox(defaultSubscriptions[1])).not.toBeChecked();
            expect(getSenderCheckbox(defaultSubscriptions[2])).toBeChecked();
            expect(getArchiveCheckbox()).not.toBeChecked();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            await act(async () => {
                fireEvent.click(getUnsubscribeButton());
            });

            expect(onConfirm).toHaveBeenCalledTimes(2);
            expect(onConfirm).toHaveBeenLastCalledWith({ subscriptions: [defaultSubscriptions[2]], archive: false });
        });

        it('tick boxes, select all and the archive tick box are disabled while waiting', async () => {
            const deferred = createDeferred();
            await renderModal({ onConfirm: jest.fn(() => deferred.promise) });

            fireEvent.click(getUnsubscribeButton());

            defaultSubscriptions.forEach((subscription) => {
                expect(getSenderCheckbox(subscription)).toBeDisabled();
            });
            expect(getSelectAllCheckbox()).toBeDisabled();
            expect(getArchiveCheckbox()).toBeDisabled();
            expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled();
            expect(screen.getByTestId('modal:close')).toBeEnabled();

            await act(async () => {
                deferred.reject(new Error('Cleanup failed'));
            });

            defaultSubscriptions.forEach((subscription) => {
                expect(getSenderCheckbox(subscription)).toBeEnabled();
            });
            expect(getSelectAllCheckbox()).toBeEnabled();
            expect(getArchiveCheckbox()).toBeEnabled();
        });

        describe.each(Object.keys(closeWith))('closing with %s while waiting', (closeMethod) => {
            const unhandledRejection = jest.fn();

            beforeEach(() => {
                unhandledRejection.mockClear();
                process.on('unhandledRejection', unhandledRejection);
            });

            afterEach(() => {
                process.off('unhandledRejection', unhandledRejection);
            });

            it.each(['succeeds', 'fails'])(
                'closes the window, and a late answer that %s leaves it closed, with the choice passed on once and no unhandled rejection',
                async (outcome) => {
                    const deferred = createDeferred();
                    const { onConfirm } = await renderModal({ onConfirm: jest.fn(() => deferred.promise) });

                    fireEvent.click(getUnsubscribeButton());
                    closeWith[closeMethod]();

                    expect(isClosing()).toBe(true);

                    await act(async () => {
                        if (outcome === 'succeeds') {
                            deferred.resolve();
                        } else {
                            deferred.reject(new Error('Cleanup failed'));
                        }
                    });
                    await new Promise((resolve) => setTimeout(resolve, 0));

                    expect(isClosing()).toBe(true);
                    finishClosing();
                    expect(screen.queryByText(TITLE)).not.toBeInTheDocument();
                    expect(onConfirm).toHaveBeenCalledTimes(1);
                    expect(unhandledRejection).not.toHaveBeenCalled();
                }
            );
        });
    });
});

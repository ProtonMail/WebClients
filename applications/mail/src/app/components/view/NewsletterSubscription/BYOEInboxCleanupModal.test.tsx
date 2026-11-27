import { useEffect } from 'react';

import { act, fireEvent, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

import { useModalStateObject } from '@proton/components/components/modalTwo/useModalState';
import { FeatureCode } from '@proton/features/interface';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';

import { clearBYOEFeature } from '../../../helpers/byoeInboxCleanup';
import { mailTestRender } from '../../../helpers/tests/render';
import useBYOEInboxCleanupConfirm from '../../../hooks/useBYOEInboxCleanupConfirm';
import { BYOEInboxCleanupModal } from './BYOEInboxCleanupModal';
import type { BYOEInboxCleanupChoice, BYOEInboxCleanupOutcome } from './interface';
import { generateSubscriptionList } from './testData';

vi.mock('../../../hooks/useBYOEInboxCleanupConfirm', () => ({ __esModule: true, default: vi.fn() }));
vi.mock('../../../helpers/byoeInboxCleanup', async () => ({
    ...(await vi.importActual('../../../helpers/byoeInboxCleanup')),
    clearBYOEFeature: vi.fn(),
}));

const TITLE = 'Your Gmail newsletters, now easier to manage';
const getDescription = (newsletters: string) => {
    return `We brought over ${newsletters} and grouped them by sender. See how often each one emails you, then keep, move or unsubscribe with a click.`;
};
const DESCRIPTION = getDescription('3 newsletters');

const NEVER_OPENED = 'Not opened in a while';
const OPENED_SOMETIMES = 'You open these sometimes';
const READ_OFTEN = 'You read these often';

// The fixture's sender has opened 5 of its 10 emails, so these all read often
const defaultSubscriptions = generateSubscriptionList(3).map((subscription, index) => ({
    ...subscription,
    Name: `Sender ${index + 1}`,
    SenderAddress: `sender-${index + 1}@example.com`,
}));

const neverOpened = (subscription: NewsletterSubscription): NewsletterSubscription => ({
    ...subscription,
    LastReadTime: null,
});

const openedSometimes = (subscription: NewsletterSubscription): NewsletterSubscription => ({
    ...subscription,
    ReceivedMessageCount: 10,
    UnreadMessageCount: 9,
});

const withLast30Days = (subscription: NewsletterSubscription, Last30Days: number): NewsletterSubscription => ({
    ...subscription,
    ReceivedMessages: { ...subscription.ReceivedMessages, Last30Days },
});

const toSection: Record<string, (subscription: NewsletterSubscription) => NewsletterSubscription> = {
    never: neverOpened,
    sometimes: openedSometimes,
    often: (subscription) => {
        return subscription;
    },
};

const groupedSubscriptions = [
    neverOpened(defaultSubscriptions[0]),
    defaultSubscriptions[1],
    neverOpened(defaultSubscriptions[2]),
];

interface RenderModalOptions {
    subscriptions?: NewsletterSubscription[];
    onConfirm?: (choice: BYOEInboxCleanupChoice) => Promise<BYOEInboxCleanupOutcome>;
}

interface OpenOnMountProps {
    subscriptions: NewsletterSubscription[];
    onClosedWithUnsubscribed: (outcome: BYOEInboxCleanupOutcome) => void;
}

// Opens the window as the Mailing lists view does
const OpenOnMount = ({ subscriptions, onClosedWithUnsubscribed }: OpenOnMountProps) => {
    const { modalProps, openModal, render } = useModalStateObject();

    useEffect(() => {
        openModal(true);
    }, [openModal]);

    return render ? (
        <BYOEInboxCleanupModal
            subscriptions={subscriptions}
            modalProps={modalProps}
            onClosedWithUnsubscribed={onClosedWithUnsubscribed}
        />
    ) : null;
};

const renderModal = async ({
    subscriptions = defaultSubscriptions,
    onConfirm = vi.fn((choice: BYOEInboxCleanupChoice) => {
        return Promise.resolve({ allDone: true, unsubscribed: choice.subscriptions });
    }),
}: RenderModalOptions = {}) => {
    vi.mocked(clearBYOEFeature).mockClear();
    vi.mocked(useBYOEInboxCleanupConfirm).mockReturnValue(onConfirm);
    const onClosedWithUnsubscribed = vi.fn();
    await mailTestRender(
        <OpenOnMount subscriptions={subscriptions} onClosedWithUnsubscribed={onClosedWithUnsubscribed} />
    );
    await screen.findByRole('heading', { name: TITLE });

    return { onConfirm, onClosedWithUnsubscribed };
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

const getSelectAllCheckbox = () => {
    return screen.getByRole('checkbox', { name: 'Select all' }) as HTMLInputElement;
};

const expectEverySenderChecked = (checked: boolean, subscriptions = defaultSubscriptions) => {
    subscriptions.forEach((subscription) => {
        if (checked) {
            expect(getSenderCheckbox(subscription)).toBeChecked();
        } else {
            expect(getSenderCheckbox(subscription)).not.toBeChecked();
        }
    });
};

const getArchiveCheckbox = () => {
    return screen.getByRole('checkbox', { name: 'Move their past emails to Archive. You can still search them.' });
};

const getUnsubscribeButton = () => {
    return screen.getByRole('button', { name: /^Unsubscribe from/ });
};

const tickAllAndUnsubscribe = async () => {
    fireEvent.click(getSelectAllCheckbox());
    await act(async () => {
        fireEvent.click(getUnsubscribeButton());
    });
};

const createDeferred = () => {
    let resolve: (outcome?: BYOEInboxCleanupOutcome) => void = () => {};
    let reject: (error: Error) => void = () => {};
    const promise = new Promise<BYOEInboxCleanupOutcome>((promiseResolve, promiseReject) => {
        resolve = (outcome = { allDone: true, unsubscribed: defaultSubscriptions }) => {
            promiseResolve(outcome);
        };
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
        fireEvent.keyDown(getDialog(), { key: 'Escape' });
    },
};

describe('BYOEInboxCleanupModal', () => {
    describe('opening and closing', () => {
        it('opens with the new title, the magic wand icon and the number of senders', async () => {
            await renderModal();

            const title = screen.getByRole('heading', { name: TITLE });
            expect(getDialog()).toHaveAttribute('aria-labelledby', title.id);
            expect(screen.getByText(DESCRIPTION)).toBeInTheDocument();
            expect(screen.getByTestId('byoe-inbox-cleanup-icon')).toBeInTheDocument();
        });

        it("reads '1 newsletter' in the text for one sender", async () => {
            await renderModal({ subscriptions: defaultSubscriptions.slice(0, 1) });

            expect(screen.getByText(getDescription('1 newsletter'))).toBeInTheDocument();
        });

        it("doesn't clear the cleanup just by opening, so a reload while it's open shows it again", async () => {
            await renderModal();

            expect(clearBYOEFeature).not.toHaveBeenCalled();
        });

        it.each(Object.keys(closeWith))('%s clears the cleanup, so it never opens again', async (closeMethod) => {
            await renderModal();

            closeWith[closeMethod]();

            expect(clearBYOEFeature).toHaveBeenCalledTimes(1);
            expect(clearBYOEFeature).toHaveBeenCalledWith(expect.anything(), FeatureCode.BYOEInboxCleanupModal);
        });

        it.each(Object.keys(closeWith))('%s closes the window without confirming', async (closeMethod) => {
            const { onConfirm } = await renderModal();

            closeWith[closeMethod]();

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
            expect(
                screen.getAllByRole('checkbox', {
                    name: /sender-\d@example\.com/,
                })
            ).toHaveLength(3);
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

        it('shows each sender under its section, titled for that section', async () => {
            const sometimes = openedSometimes(defaultSubscriptions[2]);
            await renderModal({
                subscriptions: [defaultSubscriptions[0], neverOpened(defaultSubscriptions[1]), sometimes],
            });

            const headings = screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent);
            expect(headings).toEqual([NEVER_OPENED, OPENED_SOMETIMES, READ_OFTEN]);
            expect(
                within(screen.getByRole('list', { name: NEVER_OPENED })).getByRole('checkbox', { name: /Sender 2/ })
            ).toBeInTheDocument();
            expect(
                within(screen.getByRole('list', { name: OPENED_SOMETIMES })).getByRole('checkbox', { name: /Sender 3/ })
            ).toBeInTheDocument();
            expect(
                within(screen.getByRole('list', { name: READ_OFTEN })).getByRole('checkbox', { name: /Sender 1/ })
            ).toBeInTheDocument();
            expect(screen.getAllByRole('checkbox', { name: /sender-\d@example\.com/ })).toHaveLength(3);
        });

        it('hides a section with no senders', async () => {
            await renderModal({ subscriptions: groupedSubscriptions });

            expect(screen.getByRole('heading', { name: NEVER_OPENED })).toBeInTheDocument();
            expect(screen.getByRole('heading', { name: READ_OFTEN })).toBeInTheDocument();
            expect(screen.queryByRole('heading', { name: OPENED_SOMETIMES })).not.toBeInTheDocument();
        });

        it('starts with no sender ticked', async () => {
            await renderModal();

            expectEverySenderChecked(false);
            expect(getSelectAllCheckbox()).not.toBeChecked();
            expect(getSelectAllCheckbox().indeterminate).toBe(false);
        });

        it.each([
            { section: 'never', count: 0, line: 'No emails in the last 30 days.' },
            { section: 'never', count: 1, line: '1 email in the last 30 days. Not opened.' },
            { section: 'never', count: 7, line: '7 emails in the last 30 days. Not opened.' },
            { section: 'sometimes', count: 0, line: 'No emails in the last 30 days.' },
            { section: 'sometimes', count: 1, line: '1 email in the last 30 days. Opened sometimes.' },
            { section: 'sometimes', count: 7, line: '7 emails in the last 30 days. Opened sometimes.' },
            { section: 'often', count: 0, line: 'No emails in the last 30 days.' },
            { section: 'often', count: 1, line: '1 email in the last 30 days. Opened often.' },
            { section: 'often', count: 22, line: '22 emails in the last 30 days. Opened often.' },
        ])(
            'shows "$line" for a $section sender with $count emails in the last 30 days',
            async ({ section, count, line }) => {
                await renderModal({
                    subscriptions: [withLast30Days(toSection[section](defaultSubscriptions[0]), count)],
                });

                expect(screen.getByText(line)).toBeInTheDocument();
            }
        );

        it('keeps the last-30-days line out of the tick box name', async () => {
            await renderModal();

            expect(getSenderCheckbox(defaultSubscriptions[0])).not.toHaveAccessibleName(/last 30 days/);
        });

        it('ticking a sender selects only that sender', async () => {
            await renderModal();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[1]));

            expect(getSenderCheckbox(defaultSubscriptions[0])).not.toBeChecked();
            expect(getSenderCheckbox(defaultSubscriptions[1])).toBeChecked();
            expect(getSenderCheckbox(defaultSubscriptions[2])).not.toBeChecked();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[1]));

            expect(getSenderCheckbox(defaultSubscriptions[1])).not.toBeChecked();
        });

        it('select all sits in the first section shown and ticks or unticks every sender, partly ticked when some are', async () => {
            await renderModal({ subscriptions: groupedSubscriptions });

            expect(screen.getAllByRole('checkbox', { name: 'Select all' })).toHaveLength(1);
            const firstSection = screen.getByRole('region', { name: NEVER_OPENED });
            expect(firstSection).toContainElement(getSelectAllCheckbox());

            fireEvent.click(getSelectAllCheckbox());
            expectEverySenderChecked(true, groupedSubscriptions);
            expect(getSelectAllCheckbox()).toBeChecked();

            fireEvent.click(getSelectAllCheckbox());
            expectEverySenderChecked(false, groupedSubscriptions);

            fireEvent.click(getSenderCheckbox(groupedSubscriptions[1]));
            expect(getSelectAllCheckbox()).toBePartiallyChecked();

            fireEvent.click(getSelectAllCheckbox());
            expectEverySenderChecked(true, groupedSubscriptions);
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
            expect(senderCheckbox).toBeChecked();

            await userEvent.keyboard(' ');

            expect(senderCheckbox).not.toBeChecked();
        });
    });

    describe('archive choice and Unsubscribe', () => {
        it('the archive tick box starts ticked and can be unticked and ticked again', async () => {
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

        it('Unsubscribe passes the ticked senders and the archive choice', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getSenderCheckbox(defaultSubscriptions[2]));
            fireEvent.click(getArchiveCheckbox());
            fireEvent.click(getUnsubscribeButton());

            expect(onConfirm).toHaveBeenCalledTimes(1);
            expect(onConfirm).toHaveBeenCalledWith({
                subscriptions: [defaultSubscriptions[0], defaultSubscriptions[2]],
                archive: false,
            });
        });

        it('Unsubscribe passes every sender and archiving after select all', async () => {
            const { onConfirm } = await renderModal();

            fireEvent.click(getSelectAllCheckbox());
            fireEvent.click(getUnsubscribeButton());

            expect(onConfirm).toHaveBeenCalledWith({
                subscriptions: defaultSubscriptions,
                archive: true,
            });
        });

        it('the main button counts the ticked senders and is disabled at 0', async () => {
            await renderModal();

            expect(screen.getByRole('button', { name: 'Unsubscribe from 0' })).toBeDisabled();

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getSenderCheckbox(defaultSubscriptions[2]));

            expect(screen.getByRole('button', { name: 'Unsubscribe from 2' })).toBeEnabled();
        });

        it('Unsubscribe shows a spinner until the answer comes', async () => {
            const deferred = createDeferred();
            await renderModal({ onConfirm: vi.fn(() => deferred.promise) });

            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'false');

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getUnsubscribeButton());

            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'true');
            expect(isClosing()).toBe(false);

            await act(async () => {
                deferred.resolve();
            });

            expect(getUnsubscribeButton()).toHaveAttribute('aria-busy', 'false');
        });

        it('when every ticked sender is done, the window closes and hands over the outcome with exactly the unsubscribed senders, once', async () => {
            const unsubscribed = defaultSubscriptions.slice(1);
            const { onClosedWithUnsubscribed } = await renderModal({
                onConfirm: vi.fn(() => {
                    return Promise.resolve({ allDone: true, unsubscribed });
                }),
            });

            await tickAllAndUnsubscribe();

            expect(isClosing()).toBe(true);
            expect(clearBYOEFeature).toHaveBeenCalledTimes(1);
            expect(clearBYOEFeature).toHaveBeenCalledWith(expect.anything(), FeatureCode.BYOEInboxCleanupModal);
            expect(onClosedWithUnsubscribed).toHaveBeenCalledTimes(1);
            expect(onClosedWithUnsubscribed).toHaveBeenCalledWith({ allDone: true, unsubscribed });
        });

        it('when some fail, the window stays open and hands over nothing', async () => {
            const { onClosedWithUnsubscribed } = await renderModal({
                onConfirm: vi.fn(() => {
                    return Promise.resolve({ allDone: false, unsubscribed: defaultSubscriptions.slice(0, 2) });
                }),
            });

            await tickAllAndUnsubscribe();

            expect(isClosing()).toBe(false);
            expect(onClosedWithUnsubscribed).not.toHaveBeenCalled();
        });

        it("while unsubscribing, Skip and the close button are disabled and Escape doesn't close it", async () => {
            const deferred = createDeferred();
            await renderModal({ onConfirm: vi.fn(() => deferred.promise) });

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getUnsubscribeButton());

            expect(screen.getByRole('button', { name: 'Skip' })).toBeDisabled();
            expect(screen.getByTestId('modal:close')).toBeDisabled();
            closeWith.Escape();
            expect(isClosing()).toBe(false);

            await act(async () => {
                deferred.resolve({ allDone: false, unsubscribed: [] });
            });

            expect(screen.getByRole('button', { name: 'Skip' })).toBeEnabled();
            expect(screen.getByTestId('modal:close')).toBeEnabled();
        });

        it('stays open with the same choices when the answer fails, and Unsubscribe can be pressed again with the current selection', async () => {
            const onConfirm = vi.fn(() => Promise.reject(new Error('Cleanup failed')));
            await renderModal({ onConfirm });

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getSenderCheckbox(defaultSubscriptions[2]));
            fireEvent.click(getArchiveCheckbox());
            await act(async () => {
                fireEvent.click(getUnsubscribeButton());
            });

            expect(isClosing()).toBe(false);
            expect(clearBYOEFeature).not.toHaveBeenCalled();
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
            expect(onConfirm).toHaveBeenLastCalledWith({
                subscriptions: [defaultSubscriptions[2]],
                archive: false,
            });
        });

        it('tick boxes, select all and the archive tick box are disabled while waiting', async () => {
            const deferred = createDeferred();
            await renderModal({ onConfirm: vi.fn(() => deferred.promise) });

            fireEvent.click(getSenderCheckbox(defaultSubscriptions[0]));
            fireEvent.click(getUnsubscribeButton());

            defaultSubscriptions.forEach((subscription) => {
                expect(getSenderCheckbox(subscription)).toBeDisabled();
            });
            expect(getSelectAllCheckbox()).toBeDisabled();
            expect(getArchiveCheckbox()).toBeDisabled();

            await act(async () => {
                deferred.reject(new Error('Cleanup failed'));
            });

            defaultSubscriptions.forEach((subscription) => {
                expect(getSenderCheckbox(subscription)).toBeEnabled();
            });
            expect(getSelectAllCheckbox()).toBeEnabled();
            expect(getArchiveCheckbox()).toBeEnabled();
        });

        it('closing after a run where some worked hands over those senders, with the outcome not all done', async () => {
            const unsubscribed = defaultSubscriptions.slice(0, 2);
            const { onClosedWithUnsubscribed } = await renderModal({
                onConfirm: vi.fn(() => {
                    return Promise.resolve({ allDone: false, unsubscribed });
                }),
            });
            await tickAllAndUnsubscribe();

            closeWith.Skip();

            expect(isClosing()).toBe(true);
            expect(onClosedWithUnsubscribed).toHaveBeenCalledTimes(1);
            expect(onClosedWithUnsubscribed).toHaveBeenCalledWith({ allDone: false, unsubscribed });
        });

        it('closing again while it fades out clears the cleanup and hands them over only once', async () => {
            const { onClosedWithUnsubscribed } = await renderModal({
                onConfirm: vi.fn(() => {
                    return Promise.resolve({ allDone: false, unsubscribed: defaultSubscriptions.slice(0, 2) });
                }),
            });
            await tickAllAndUnsubscribe();

            closeWith.Skip();
            closeWith.Skip();

            expect(clearBYOEFeature).toHaveBeenCalledTimes(1);
            expect(clearBYOEFeature).toHaveBeenCalledWith(expect.anything(), FeatureCode.BYOEInboxCleanupModal);
            expect(onClosedWithUnsubscribed).toHaveBeenCalledTimes(1);
        });

        it('closing after a run where none worked hands over nothing', async () => {
            const { onClosedWithUnsubscribed } = await renderModal({
                onConfirm: vi.fn(() => {
                    return Promise.resolve({ allDone: false, unsubscribed: [] });
                }),
            });
            await tickAllAndUnsubscribe();

            closeWith.Skip();

            expect(isClosing()).toBe(true);
            expect(onClosedWithUnsubscribed).not.toHaveBeenCalled();
        });
    });
});

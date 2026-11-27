import { useContext, useMemo, useRef, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import ContactImage from '@proton/components/containers/contacts/ContactImage';
import { FeatureCode } from '@proton/features/interface';
import useLoading from '@proton/hooks/useLoading';
import { IcMagicWand } from '@proton/icons/icons/IcMagicWand';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import type { BYOEInboxCleanupSection } from '../../../helpers/byoeInboxCleanup';
import { clearBYOEFeature, groupBYOEInboxCleanupSenders } from '../../../helpers/byoeInboxCleanup';
import useBYOEInboxCleanupConfirm from '../../../hooks/useBYOEInboxCleanupConfirm';
import { useMailDispatch } from '../../../store/hooks';
import { ModalCheckboxWithLabel } from './SubscriptionsList/ModalBlockSender/ModalSharedComponents';
import { getReceivedMessagesCount } from './helper';
import type { BYOEInboxCleanupChoice, BYOEInboxCleanupOutcome } from './interface';

interface InboxCleanupHeaderProps {
    count: number;
    closeDisabled: boolean;
}

const InboxCleanupHeader = ({ count, closeDisabled }: InboxCleanupHeaderProps) => {
    const { id } = useContext(ModalContext);

    return (
        <div className="modal-two-header flex flex-nowrap items-start gap-3">
            <div className="flex-1">
                <span
                    className="flex items-center justify-center rounded-full w-custom h-custom mb-2"
                    style={{
                        '--w-custom': '2.5rem',
                        '--h-custom': '2.5rem',
                        backgroundColor: 'var(--primary-minor-1)',
                    }}
                >
                    <IcMagicWand size={5} className="color-primary" data-testid="byoe-inbox-cleanup-icon" />
                </span>
                <h1 id={id} className="text-2xl text-bold mb-2">
                    {c('Title').t`Your Gmail newsletters, now easier to manage`}
                </h1>
                <p className="m-0 color-weak">
                    {c('Info').ngettext(
                        msgid`We brought over ${count} newsletter and grouped them by sender. See how often each one emails you, then keep, move or unsubscribe with a click.`,
                        `We brought over ${count} newsletters and grouped them by sender. See how often each one emails you, then keep, move or unsubscribe with a click.`,
                        count
                    )}
                </p>
            </div>
            <ModalHeaderCloseButton
                buttonProps={{ className: 'shrink-0 modal-two-header-actions', disabled: closeDisabled }}
            />
        </div>
    );
};

const getSectionTitle = (section: BYOEInboxCleanupSection) => {
    switch (section) {
        case 'never':
            return c('Title').t`Not opened in a while`;
        case 'sometimes':
            return c('Title').t`You open these sometimes`;
        case 'often':
            return c('Title').t`You read these often`;
    }
};

const getSenderStatsText = (section: BYOEInboxCleanupSection, count: number) => {
    if (count === 0) {
        return c('Newsletter sender stats').t`No emails in the last 30 days.`;
    }

    switch (section) {
        case 'never':
            return c('Newsletter sender stats').ngettext(
                msgid`${count} email in the last 30 days. Not opened.`,
                `${count} emails in the last 30 days. Not opened.`,
                count
            );
        case 'sometimes':
            return c('Newsletter sender stats').ngettext(
                msgid`${count} email in the last 30 days. Opened sometimes.`,
                `${count} emails in the last 30 days. Opened sometimes.`,
                count
            );
        case 'often':
            return c('Newsletter sender stats').ngettext(
                msgid`${count} email in the last 30 days. Opened often.`,
                `${count} emails in the last 30 days. Opened often.`,
                count
            );
    }
};

interface SenderRowProps {
    subscription: NewsletterSubscription;
    section: BYOEInboxCleanupSection;
    checked: boolean;
    disabled: boolean;
    onToggle: (id: string) => void;
}

const SenderRow = ({ subscription, section, checked, disabled, onToggle }: SenderRowProps) => {
    const checkboxId = `byoe-inbox-cleanup-sender-${subscription.ID}`;
    const stats = getSenderStatsText(section, getReceivedMessagesCount(subscription));

    return (
        <li className="flex flex-nowrap items-center gap-3 px-4 py-2 border-top border-weak">
            <Checkbox
                id={checkboxId}
                checked={checked}
                disabled={disabled}
                onChange={() => onToggle(subscription.ID)}
            />
            <span className="shrink-0 w-custom" style={{ '--w-custom': '2.25rem' }}>
                <ContactImage
                    email={subscription.SenderAddress}
                    name={subscription.Name}
                    variant="large"
                    className="rounded relative"
                    displaySenderImage
                    initialsStyle={{ '--h-custom': '2.25rem' }}
                    initialsClassName="bg-strong text-no-bold flex h-custom items-center justify-center rounded w-full"
                    overrideSize={36}
                />
            </span>
            <label htmlFor={checkboxId} className="flex-1 min-w-0 flex flex-column">
                <span className="w-full text-ellipsis" title={subscription.Name}>
                    {subscription.Name}
                </span>
                <span className="w-full text-sm color-weak text-ellipsis" title={subscription.SenderAddress}>
                    {subscription.SenderAddress}
                </span>
            </label>
            <span className="shrink-0 text-sm color-weak text-nowrap">{stats}</span>
        </li>
    );
};

interface InboxCleanupModalProps {
    modalProps: ModalStateProps;
    subscriptions: NewsletterSubscription[];
    onConfirm: (choice: BYOEInboxCleanupChoice) => Promise<BYOEInboxCleanupOutcome>;
}

const InboxCleanupModal = ({ modalProps, subscriptions, onConfirm }: InboxCleanupModalProps) => {
    const [selectedIDs, setSelectedIDs] = useState<string[]>([]);
    const [archive, setArchive] = useState(true);
    const [loading, withLoading] = useLoading();

    const count = subscriptions.length;
    const senderSections = useMemo(() => {
        return groupBYOEInboxCleanupSenders(subscriptions);
    }, [subscriptions]);
    const allSelected = count > 0 && selectedIDs.length === count;
    const someSelected = selectedIDs.length > 0 && !allSelected;
    const selectedCount = selectedIDs.length;

    const handleToggleSender = (id: string) => {
        setSelectedIDs((previous) =>
            previous.includes(id) ? previous.filter((selectedID) => selectedID !== id) : [...previous, id]
        );
    };

    const handleToggleAll = () => {
        setSelectedIDs(allSelected ? [] : subscriptions.map(({ ID }) => ID));
    };

    const handleUnsubscribe = () => {
        const selectedSubscriptions = subscriptions.filter(({ ID }) => selectedIDs.includes(ID));
        void withLoading(onConfirm({ subscriptions: selectedSubscriptions, archive }))
            .then(modalProps.onClose)
            // The caller shows its own error; the window stays open so the person can try again or skip
            .catch(noop);
    };

    return (
        <ModalTwo {...modalProps} size="large" fullscreenOnMobile disableCloseOnEscape={loading}>
            <InboxCleanupHeader count={count} closeDisabled={loading} />
            <ModalTwoContent>
                <div className="border border-weak rounded-lg overflow-hidden">
                    {senderSections.map(({ section, subscriptions: sectionSubscriptions }, index) => {
                        const headingID = `byoe-inbox-cleanup-section-${section}`;
                        const isFirst = index === 0;

                        return (
                            <section key={section} aria-labelledby={headingID}>
                                <div
                                    className={clsx(
                                        'flex flex-nowrap items-center justify-space-between gap-2 px-4 py-2 bg-weak',
                                        !isFirst && 'border-top border-weak'
                                    )}
                                >
                                    <h2 id={headingID} className="m-0 text-sm text-semibold color-weak">
                                        {getSectionTitle(section)}
                                    </h2>
                                    {isFirst && (
                                        <Checkbox
                                            id="byoe-inbox-cleanup-select-all"
                                            checked={allSelected}
                                            indeterminate={someSelected}
                                            disabled={loading}
                                            onChange={handleToggleAll}
                                            className="shrink-0 text-sm color-weak"
                                        >
                                            {c('Action').t`Select all`}
                                        </Checkbox>
                                    )}
                                </div>
                                <ul className="unstyled m-0" aria-labelledby={headingID}>
                                    {sectionSubscriptions.map((subscription) => (
                                        <SenderRow
                                            key={subscription.ID}
                                            subscription={subscription}
                                            section={section}
                                            checked={selectedIDs.includes(subscription.ID)}
                                            disabled={loading}
                                            onToggle={handleToggleSender}
                                        />
                                    ))}
                                </ul>
                            </section>
                        );
                    })}
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {/* A single child, so the footer's wrap-reverse and phone column-reverse can't put the tick box below the buttons */}
                <div className="flex flex-column w-full">
                    <ModalCheckboxWithLabel
                        label={c('Info').t`Move their past emails to Archive. You can still search them.`}
                        id="byoe-inbox-cleanup-archive"
                        checked={archive}
                        onChange={() => setArchive((previous) => !previous)}
                        disabled={loading}
                        dataTestId="byoe-inbox-cleanup-archive"
                    />
                    <p className="m-0 mb-3 text-sm color-weak">{c('Info')
                        .t`Based only on which emails you've opened.`}</p>
                    <div className="flex flex-nowrap items-center justify-end gap-2">
                        <Button onClick={modalProps.onClose} disabled={loading}>
                            {c('Action').t`Skip`}
                        </Button>
                        <Button color="norm" loading={loading} disabled={!selectedCount} onClick={handleUnsubscribe}>
                            {c('Action').ngettext(
                                msgid`Unsubscribe from ${selectedCount}`,
                                `Unsubscribe from ${selectedCount}`,
                                selectedCount
                            )}
                        </Button>
                    </div>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

interface BYOEInboxCleanupModalProps {
    subscriptions: NewsletterSubscription[];
    modalProps: ModalStateProps;
    onClosedWithUnsubscribed: (outcome: BYOEInboxCleanupOutcome) => void;
}

export const BYOEInboxCleanupModal = ({
    subscriptions,
    modalProps,
    onClosedWithUnsubscribed,
}: BYOEInboxCleanupModalProps) => {
    const onConfirm = useBYOEInboxCleanupConfirm();
    const dispatch = useMailDispatch();
    // A ref, not state: Unsubscribe closes the window with the `onClose` from the render it was pressed in,
    // which would still hold the outcome from before that run
    const outcomeRef = useRef<BYOEInboxCleanupOutcome>({ allDone: false, unsubscribed: [] });

    // However it's closed, it doesn't open again; a reload while it's open leaves it due for the next visit.
    // Whether it closes itself after a full success or the person closes it after some failed, it hands over
    // the last outcome (the senders it unsubscribed, and whether every ticked one is done) so the success window can open.
    const handleClose = () => {
        // Its buttons and Escape still work while it fades out, which would clear it and hand the senders over twice
        if (!modalProps.open) {
            return;
        }
        clearBYOEFeature(dispatch, FeatureCode.BYOEInboxCleanupModal);
        modalProps.onClose();
        if (outcomeRef.current.unsubscribed.length > 0) {
            onClosedWithUnsubscribed(outcomeRef.current);
        }
    };

    const handleConfirm = async (choice: BYOEInboxCleanupChoice) => {
        const outcome = await onConfirm(choice);
        outcomeRef.current = outcome;
        if (!outcome.allDone) {
            // The caller has shown its error; failing keeps the window open so the person can try again
            throw new Error('Some BYOE inbox cleanup senders are not done');
        }
        return outcome;
    };

    return (
        <InboxCleanupModal
            modalProps={{ ...modalProps, onClose: handleClose }}
            subscriptions={subscriptions}
            onConfirm={handleConfirm}
        />
    );
};

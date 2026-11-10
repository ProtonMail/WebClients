import { useContext, useEffect, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Checkbox from '@proton/components/components/input/Checkbox';
import ModalTwo, { ModalContext } from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import { ModalHeaderCloseButton } from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import ContactImage from '@proton/components/containers/contacts/ContactImage';
import useLoading from '@proton/hooks/useLoading';
import { IcArchiveBox } from '@proton/icons/icons/IcArchiveBox';
import type { NewsletterSubscription } from '@proton/shared/lib/interfaces/NewsletterSubscription';
import noop from '@proton/utils/noop';

import { ModalCheckboxWithLabel } from '../../components/view/NewsletterSubscription/SubscriptionsList/ModalBlockSender/ModalSharedComponents';
import { useMailGlobalModals } from './globalModalContext';
import type { BYOEInboxCleanupModalPayload } from './inteface';
import { ModalType } from './inteface';

const InboxCleanupHeader = () => {
    const { id } = useContext(ModalContext);

    return (
        <div className="modal-two-header flex flex-nowrap items-start gap-3">
            <IcArchiveBox size={6} className="shrink-0 mt-1" data-testid="byoe-inbox-cleanup-icon" />
            <div className="flex-1">
                <h1 id={id} className="text-2xl text-bold mb-2">{c('Title').t`Start with a cleaner Inbox`}</h1>
                <p className="m-0 color-weak">
                    {c('Info')
                        .t`We found some mailing lists that you don't read. You can unsubscribe from them in one click.`}
                </p>
            </div>
            <ModalHeaderCloseButton buttonProps={{ className: 'shrink-0 modal-two-header-actions' }} />
        </div>
    );
};

interface SenderRowProps {
    subscription: NewsletterSubscription;
    checked: boolean;
    disabled: boolean;
    onToggle: (id: string) => void;
}

const SenderRow = ({ subscription, checked, disabled, onToggle }: SenderRowProps) => {
    const checkboxId = `byoe-inbox-cleanup-sender-${subscription.ID}`;

    return (
        <li className="flex flex-nowrap items-center gap-3 px-4 py-3 border-top border-weak">
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
        </li>
    );
};

interface InboxCleanupModalProps {
    modalProps: ModalStateProps;
    subscriptions: NewsletterSubscription[];
    onConfirm: BYOEInboxCleanupModalPayload['value']['onConfirm'];
}

const InboxCleanupModal = ({ modalProps, subscriptions, onConfirm }: InboxCleanupModalProps) => {
    const [selectedIDs, setSelectedIDs] = useState(() => subscriptions.map(({ ID }) => ID));
    const [archive, setArchive] = useState(true);
    const [loading, withLoading] = useLoading();

    const count = subscriptions.length;
    const allSelected = count > 0 && selectedIDs.length === count;
    const someSelected = selectedIDs.length > 0 && !allSelected;

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
        <ModalTwo {...modalProps} size="large" fullscreenOnMobile>
            <InboxCleanupHeader />
            <ModalTwoContent>
                <div className="border border-weak rounded-lg">
                    <div className="px-4 py-3">
                        <Checkbox
                            id="byoe-inbox-cleanup-select-all"
                            checked={allSelected}
                            indeterminate={someSelected}
                            disabled={loading}
                            onChange={handleToggleAll}
                            className="text-bold"
                            gap="gap-3"
                        >
                            {c('Label').ngettext(
                                msgid`Select all ${count} unused sender`,
                                `Select all ${count} unused senders`,
                                count
                            )}
                        </Checkbox>
                    </div>
                    <ul className="unstyled m-0">
                        {subscriptions.map((subscription) => (
                            <SenderRow
                                key={subscription.ID}
                                subscription={subscription}
                                checked={selectedIDs.includes(subscription.ID)}
                                disabled={loading}
                                onToggle={handleToggleSender}
                            />
                        ))}
                    </ul>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                {/* A single child, so the footer's wrap-reverse and phone column-reverse can't put the tick box below the buttons */}
                <div className="flex flex-column items-end w-full">
                    <ModalCheckboxWithLabel
                        label={c('Info').t`Archive existing messages`}
                        id="byoe-inbox-cleanup-archive"
                        checked={archive}
                        onChange={() => setArchive((previous) => !previous)}
                        disabled={loading}
                        dataTestId="byoe-inbox-cleanup-archive"
                    />
                    <div className="flex gap-2">
                        <Button onClick={modalProps.onClose}>{c('Action').t`Skip`}</Button>
                        <Button
                            color="norm"
                            loading={loading}
                            disabled={!selectedIDs.length}
                            onClick={handleUnsubscribe}
                        >
                            {c('Action').t`Unsubscribe`}
                        </Button>
                    </div>
                </div>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export const GlobalBYOEInboxCleanupModal = () => {
    const { subscribe } = useMailGlobalModals();

    const [modalProps, setOpen, shouldRender] = useModalState();
    const [modalValue, setModalValue] = useState<BYOEInboxCleanupModalPayload['value'] | null>(null);

    useEffect(() => {
        const unsubscribe = subscribe((payload) => {
            if (payload.type === ModalType.BYOEInboxCleanup) {
                setModalValue(payload.value);
                setOpen(true);
            }
        });
        return unsubscribe;
    }, [subscribe, setOpen]);

    const onDisplayed = modalValue?.onDisplayed;
    useEffect(() => {
        if (shouldRender) {
            onDisplayed?.();
        }
    }, [shouldRender, onDisplayed]);

    if (!shouldRender || !modalValue) {
        return null;
    }

    return (
        <InboxCleanupModal
            modalProps={modalProps}
            subscriptions={modalValue.subscriptions}
            onConfirm={modalValue.onConfirm}
        />
    );
};

import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { InvoiceDocument } from '@proton/payments/core/api/api';
import { InvoiceOwner, InvoiceState } from '@proton/payments/core/constants';
import { useEditBillingAddressModal } from '@proton/payments/ui/billing-address/containers/useEditBillingAddressModal';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';
import noop from '@proton/utils/noop';

import Alert from '../../components/alert/Alert';
import { ButtonGroup } from '../../components/button/ButtonGroup';
import DropdownMenu from '../../components/dropdown/DropdownMenu';
import DropdownMenuButton from '../../components/dropdown/DropdownMenuButton';
import SimpleDropdown from '../../components/dropdown/SimpleDropdown';
import Icon from '../../components/icon/Icon';
import useModalState from '../../components/modalTwo/useModalState';
import Pagination from '../../components/pagination/Pagination';
import { Tabs } from '../../components/tabs/Tabs';
import useEventManager from '../../hooks/useEventManager';
import SettingsParagraph from '../account/SettingsParagraph';
import SettingsSectionWide from '../account/SettingsSectionWide';
import { useEventManagerV6 } from '../eventManager/EventManagerV6Provider';
import { useEditInvoiceModal } from './EditBillingAddress/useEditInvoiceModal';
import InvoiceGroup from './InvoiceGroup';
import InvoiceTextModal from './InvoiceTextModal';
import { InvoiceEmailBouncedBanner } from './SetInvoiceEmail/InvoiceEmailBouncedBanner';
import { useSetInvoiceEmailModal } from './SetInvoiceEmail/useSetInvoiceEmailModal';
import TransactionGroup from './TransactionGroup';
import useInvoices, { ELEMENTS_PER_PAGE, type InvoicesHook } from './useInvoices';
import useTransactions, { type TransactionsHook } from './useTransactions';

enum DocumentType {
    Invoice = InvoiceDocument.Invoice,
    CreditNote = InvoiceDocument.CreditNote,
    CurrencyConversion = InvoiceDocument.CurrencyConversion,
    Transactions = 'Transactions',
}

const InvoicesSection = ({ app }: { app: APP_NAMES }) => {
    const [user] = useUser();
    const [subscription] = useSubscription();

    const [owner, setOwner] = useState(InvoiceOwner.User);

    const [invoiceModalProps, setInvoiceModalOpen, renderInvoiceModal] = useModalState();
    const { openEditInvoiceModal, editInvoiceModal, loading: loadingEditInvoiceModal } = useEditInvoiceModal();
    const { openBillingAddressModal, editBillingAddressModal, loadingByKey } = useEditBillingAddressModal();

    const {
        openSetInvoiceEmailModal,
        setInvoiceEmailModal,
        canSetInvoiceEmail,
        sendEmailInvoice,
        invoiceEmailBounced,
        loading: loadingSetInvoiceEmailModal,
    } = useSetInvoiceEmailModal();

    const invoicesHook = useInvoices({ owner, Document: InvoiceDocument.Invoice });
    const creditNotesHook = useInvoices({ owner, Document: InvoiceDocument.CreditNote });
    const currencyConversionsHook = useInvoices({ owner, Document: InvoiceDocument.CurrencyConversion });

    const transactionsHook = useTransactions({ owner });

    const [document, setDocument] = useState<DocumentType>(DocumentType.Invoice);
    const hook = {
        [DocumentType.Invoice]: invoicesHook,
        [DocumentType.CreditNote]: creditNotesHook,
        [DocumentType.CurrencyConversion]: currencyConversionsHook,
        [DocumentType.Transactions]: transactionsHook,
    }[document];

    const handleOwner = (own = InvoiceOwner.User) => {
        setOwner(own);
        invoicesHook.onSelect(1);
        setDocument(DocumentType.Invoice);
    };

    const ownerTabs = [
        { owner: InvoiceOwner.User, title: c('Action').t`User` },
        user.isAdmin && { owner: InvoiceOwner.Organization, title: c('Action').t`Organization` },
    ].filter(isTruthy);

    const hasUnpaid = invoicesHook.invoices.find(({ State }) => State === InvoiceState.Unpaid);

    const hasOwnerTabs = user.isPaid;

    const { subscribe } = useEventManager();
    const { coreEventV6Manager } = useEventManagerV6();

    useEffect(() => {
        const handler = (event: { Invoices?: /*TODO*/ any[] | null }) => {
            if (!event?.Invoices?.length) {
                return;
            }

            void invoicesHook.request();
            setDocument(DocumentType.Invoice);
        };

        const unsubscribe = subscribe((event) => {
            handler(event);
        });

        const unsubscribeV6 = coreEventV6Manager?.subscribe(({ Invoices }) => {
            handler({ Invoices });
        });

        return () => {
            unsubscribe();
            unsubscribeV6?.();
        };
    }, [invoicesHook.request]);

    useEffect(() => {
        void hook.request();
    }, [document, owner]);

    const editBillingAddressLoadingKey = 'editBillingAddress';

    const invoiceEditButtons = (
        <SimpleDropdown
            as={Button}
            size="medium"
            shape="outline"
            originalPlacement="bottom-end"
            className="shrink-0"
            content={c('Action').t`Invoice options`}
            data-testid="invoiceOptions"
        >
            <DropdownMenu>
                {[
                    {
                        text: c('Action').t`Edit billing address`,
                        'data-testid': 'editBillingAddress',
                        key: 'editBillingAddress',
                        onClick: () =>
                            openBillingAddressModal({
                                loadingKey: editBillingAddressLoadingKey,
                                subscription,
                            }).catch(noop),
                        loading: loadingByKey[editBillingAddressLoadingKey],
                    },
                    hook.type === 'invoices' &&
                        hook.invoices.length > 0 && {
                            text: c('Action').t`Edit invoice note`,
                            'data-testid': 'editInvoiceNote',
                            key: 'editInvoiceNote',
                            onClick: () => setInvoiceModalOpen(true),
                            loading: loadingEditInvoiceModal,
                        },
                    canSetInvoiceEmail && {
                        text: c('Action').t`Set invoice email`,
                        'data-testid': 'setInvoiceEmail',
                        key: 'setInvoiceEmail',
                        onClick: () => openSetInvoiceEmailModal(),
                        loading: loadingSetInvoiceEmailModal,
                        isSelected: sendEmailInvoice,
                    },
                ]
                    .filter(isTruthy)
                    .map(({ text, key, isSelected, ...rest }) => (
                        <DropdownMenuButton
                            className="flex items-center flex-nowrap justify-space-between gap-2 text-left"
                            key={key}
                            {...rest}
                        >
                            <span>{text}</span>
                            {isSelected && (
                                <Icon
                                    name="checkmark"
                                    className="shrink-0 color-primary ml-2"
                                    data-testid={`${key}Selected`}
                                />
                            )}
                        </DropdownMenuButton>
                    ))}
            </DropdownMenu>
        </SimpleDropdown>
    );

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`View, download, and manage your invoices.`}</SettingsParagraph>
                {canSetInvoiceEmail && invoiceEmailBounced ? (
                    <InvoiceEmailBouncedBanner
                        className="mb-4 p-1"
                        onUpdateEmail={() => openSetInvoiceEmailModal()}
                        loading={loadingSetInvoiceEmailModal}
                    />
                ) : null}
                {hasUnpaid ? (
                    <Alert className="mb-4" type="error" data-testid="overdue-alert">
                        {c('Error')
                            .t`Your account or organization has an overdue invoice. Please pay all unpaid invoices.`}
                    </Alert>
                ) : null}
                {hasOwnerTabs ? (
                    <Tabs
                        className="mb-4"
                        tabs={ownerTabs}
                        value={ownerTabs.findIndex(({ owner: tabOwner }) => tabOwner === owner)}
                        onChange={(index) => handleOwner(ownerTabs[index].owner)}
                    />
                ) : null}
                <div className={clsx('mb-4 flex items-start', hasOwnerTabs && 'justify-space-between')}>
                    <ButtonGroup className="mr-4 mb-2">
                        <Button
                            className={document === DocumentType.Invoice ? 'is-selected' : ''}
                            onClick={() => setDocument(DocumentType.Invoice)}
                            data-testid="invoices-tab"
                        >
                            {c('Select invoice document').t`Invoice`}
                        </Button>
                        <Button
                            className={document === DocumentType.CreditNote ? 'is-selected' : ''}
                            onClick={() => setDocument(DocumentType.CreditNote)}
                            data-testid="credit-note-tab"
                        >
                            {c('Select invoice document').t`Credit note`}
                        </Button>
                        <Button
                            className={document === DocumentType.CurrencyConversion ? 'is-selected' : ''}
                            onClick={() => setDocument(DocumentType.CurrencyConversion)}
                            data-testid="currency-conversion-tab"
                        >
                            {c('Select invoice document').t`Currency conversion`}
                        </Button>
                        <Button
                            className={document === DocumentType.Transactions ? 'is-selected' : ''}
                            onClick={() => setDocument(DocumentType.Transactions)}
                            data-testid="transactions-tab"
                        >
                            {c('Select invoice document').t`Transactions`}
                        </Button>
                    </ButtonGroup>
                    <div className="flex gap-4 items-center">
                        <Pagination
                            page={hook.page}
                            total={hook.total}
                            limit={ELEMENTS_PER_PAGE}
                            onNext={hook.onNext}
                            onPrevious={hook.onPrevious}
                            onSelect={hook.onSelect}
                        />
                        {invoiceEditButtons}
                    </div>
                </div>
                {document === DocumentType.Transactions ? (
                    <TransactionGroup {...(hook as TransactionsHook)} />
                ) : (
                    <InvoiceGroup
                        {...(hook as InvoicesHook)}
                        app={app}
                        onEdit={(invoice) => openEditInvoiceModal({ invoice })}
                    />
                )}
            </SettingsSectionWide>

            {renderInvoiceModal && <InvoiceTextModal {...invoiceModalProps} />}

            {editInvoiceModal}
            {editBillingAddressModal}
            {setInvoiceEmailModal}
        </>
    );
};

export default InvoicesSection;

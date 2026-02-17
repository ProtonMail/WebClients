import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Alert from '@proton/components/components/alert/Alert';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import DropdownActions from '@proton/components/components/dropdown/DropdownActions';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Pagination from '@proton/components/components/pagination/Pagination';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useEventManagerV6 } from '@proton/components/containers/eventManager/EventManagerV6Provider';
import useEventManager from '@proton/components/hooks/useEventManager';
import { InvoiceDocument, InvoiceOwner, InvoiceState } from '@proton/payments';
import { useEditBillingAddressModal } from '@proton/payments/ui/containers/EditBillingAddress/useEditBillingAddressModal';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { useFlag } from '@proton/unleash';
import isTruthy from '@proton/utils/isTruthy';

import { useEditInvoiceModal } from './EditBillingAddress/useEditInvoiceModal';
import InvoiceGroup from './InvoiceGroup';
import InvoiceTextModal from './InvoiceTextModal';
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
    const enableTransactions = useFlag('TransactionsView');

    const [user] = useUser();

    const [owner, setOwner] = useState(InvoiceOwner.User);

    const [invoiceModalProps, setInvoiceModalOpen, renderInvoiceModal] = useModalState();
    const { openEditInvoiceModal, editInvoiceModal, loading: loadingEditInvoiceModal } = useEditInvoiceModal();
    const { openBillingAddressModal, editBillingAddressModal, loadingByKey } = useEditBillingAddressModal();

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

    const handleOwner =
        (own = InvoiceOwner.User) =>
        () => {
            setOwner(own);
            invoicesHook.onSelect(1);
            setDocument(DocumentType.Invoice);
        };

    const hasUnpaid = invoicesHook.invoices.find(({ State }) => State === InvoiceState.Unpaid);

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

    const invoiceEditButtons = hook.type === 'invoices' && hook.invoices.length > 0 && (
        <DropdownActions
            size="medium"
            list={[
                {
                    text: c('Action').t`Edit billing address`,
                    'data-testid': 'editBillingAddress',
                    key: 'editBillingAddress',
                    onClick: () => openBillingAddressModal({ loadingKey: editBillingAddressLoadingKey }),
                    loading: loadingByKey[editBillingAddressLoadingKey],
                },
                {
                    text: c('Action').t`Edit invoice note`,
                    'data-testid': 'editInvoiceNote',
                    key: 'editInvoiceNote',
                    onClick: () => setInvoiceModalOpen(true),
                    loading: loadingEditInvoiceModal,
                },
            ].filter(isTruthy)}
        />
    );

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info').t`View, download, and manage your invoices.`}</SettingsParagraph>
                {hasUnpaid ? (
                    <Alert className="mb-4" type="error" data-testid="overdue-alert">
                        {c('Error')
                            .t`Your account or organization has an overdue invoice. Please pay all unpaid invoices.`}
                    </Alert>
                ) : null}
                {user.isPaid ? (
                    <ButtonGroup className="mr-4 mb-2">
                        <Button
                            className={owner === InvoiceOwner.User ? 'is-selected' : ''}
                            onClick={handleOwner(InvoiceOwner.User)}
                        >
                            {c('Action').t`User`}
                        </Button>
                        {user.isAdmin && (
                            <Button
                                className={owner === InvoiceOwner.Organization ? 'is-selected' : ''}
                                onClick={handleOwner(InvoiceOwner.Organization)}
                            >
                                {c('Action').t`Organization`}
                            </Button>
                        )}
                    </ButtonGroup>
                ) : null}
                <div className="mb-4 flex justify-space-between">
                    <div>
                        <div className="flex items-start">
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
                                {enableTransactions && (
                                    <Button
                                        className={document === DocumentType.Transactions ? 'is-selected' : ''}
                                        onClick={() => setDocument(DocumentType.Transactions)}
                                        data-testid="transactions-tab"
                                    >
                                        {c('Select invoice document').t`Transactions`}
                                    </Button>
                                )}
                            </ButtonGroup>
                            {invoiceEditButtons}
                        </div>
                    </div>
                    <Pagination
                        page={hook.page}
                        total={hook.total}
                        limit={ELEMENTS_PER_PAGE}
                        onNext={hook.onNext}
                        onPrevious={hook.onPrevious}
                        onSelect={hook.onSelect}
                    />
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
        </>
    );
};

export default InvoicesSection;

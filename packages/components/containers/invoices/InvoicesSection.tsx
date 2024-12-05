import { useEffect, useState } from 'react';

import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import ButtonGroup from '@proton/components/components/button/ButtonGroup';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Pagination from '@proton/components/components/pagination/Pagination';
import MozillaInfoPanel from '@proton/components/containers/account/MozillaInfoPanel';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useSubscribeEventManager } from '@proton/components/hooks/useHandler';
import { INVOICE_STATE } from '@proton/payments';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { InvoiceDocument } from '@proton/shared/lib/api/payments';
import { INVOICE_OWNER } from '@proton/shared/lib/constants';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';
import { useFlag } from '@proton/unleash';

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

const InvoicesSection = () => {
    const enableTransactions = useFlag('TransactionsView');

    const [user] = useUser();

    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const [{ isManagedByMozilla } = { isManagedByMozilla: false }] = useSubscription();

    const [invoiceModalProps, setInvoiceModalOpen, renderInvoiceModal] = useModalState();

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
        (own = USER) =>
        () => {
            setOwner(own);
            invoicesHook.onSelect(1);
            setDocument(DocumentType.Invoice);
        };

    const hasUnpaid = invoicesHook.invoices.find(({ State }) => State === INVOICE_STATE.UNPAID);

    useSubscribeEventManager(({ Invoices, User } = {}) => {
        if (Invoices && Invoices.length > 0) {
            // it helps with rare routing issue when user pays in one tab but then
            // the invoices are queried in another tab with the old v4 version.
            // Aparanently there is a concurrency isue between setting the global payments version and the invoices request.
            const paymentsVersion: PaymentsVersion | undefined =
                User?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED ? 'v5' : undefined;

            void invoicesHook.request(paymentsVersion);
            setDocument(DocumentType.Invoice);
        }
    });

    useEffect(() => {
        void hook.request();
    }, [document, owner]);

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

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
                        <Button className={owner === USER ? 'is-selected' : ''} onClick={handleOwner(USER)}>
                            {c('Action').t`User`}
                        </Button>
                        {user.isAdmin && (
                            <Button
                                className={owner === ORGANIZATION ? 'is-selected' : ''}
                                onClick={handleOwner(ORGANIZATION)}
                            >
                                {c('Action').t`Organization`}
                            </Button>
                        )}
                    </ButtonGroup>
                ) : null}
                <div className="mb-4 flex justify-space-between">
                    <div>
                        <div className="flex items-center">
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
                            {hook.type === 'invoices' && hook.invoices.length > 0 && (
                                <Button className="mb-2" onClick={() => setInvoiceModalOpen(true)}>
                                    {c('Action').t`Edit invoice details`}
                                </Button>
                            )}
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
                    <InvoiceGroup {...(hook as InvoicesHook)} />
                )}
            </SettingsSectionWide>

            {renderInvoiceModal && <InvoiceTextModal {...invoiceModalProps} />}
        </>
    );
};

export default InvoicesSection;

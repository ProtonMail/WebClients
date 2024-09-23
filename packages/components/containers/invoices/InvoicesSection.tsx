import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Alert from '@proton/components/components/alert/Alert';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Pagination from '@proton/components/components/pagination/Pagination';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import MozillaInfoPanel from '@proton/components/containers/account/MozillaInfoPanel';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import type { Invoice } from '@proton/payments';
import { INVOICE_STATE } from '@proton/payments';
import type { PaymentsVersion } from '@proton/shared/lib/api/payments';
import { InvoiceDocument, getInvoice } from '@proton/shared/lib/api/payments';
import { INVOICE_OWNER, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';
import { ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { ButtonGroup } from '../../components';
import { useApi, useSubscribeEventManager, useSubscription, useUser } from '../../hooks';
import { useChargebeeUserStatusTracker } from '../../payments/client-extensions/useChargebeeContext';
import InvoiceActions from './InvoiceActions';
import InvoiceAmount from './InvoiceAmount';
import InvoiceState from './InvoiceState';
import InvoiceTextModal from './InvoiceTextModal';
import InvoiceType from './InvoiceType';
import type { InvoicesPreviewControls } from './InvoicesPreview';
import InvoicesPreview from './InvoicesPreview';
import { getInvoicePaymentsVersion } from './helpers';
import useInvoices, { ELEMENTS_PER_PAGE } from './useInvoices';

type InvoicesHook = ReturnType<typeof useInvoices>;

const InvoiceGroup = ({ invoices, loading, error, page, requestInvoices }: InvoicesHook) => {
    const previewRef = useRef<InvoicesPreviewControls | undefined>();
    const api = useApi();

    const showError = !!error;
    const isEmpty = page === 1 && !loading && invoices.length === 0 && !showError;
    const showContent = !isEmpty && !showError;

    const getFilename = (invoice: Invoice) =>
        `${c('Title for PDF file').t`${MAIL_APP_NAME} invoice`} ${invoice.ID}.pdf`;

    const handleDownload = async (invoice: Invoice) => {
        const buffer = await api(getInvoice(invoice.ID, getInvoicePaymentsVersion(invoice)));
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadFile(blob, getFilename(invoice));
    };

    return (
        <>
            {showError && c('Error').t`Couldn't load invoices. Please try again later.`}
            {isEmpty && c('Info').t`You have no invoices.`}
            {showContent && (
                <div style={{ overflow: 'auto' }}>
                    <Table hasActions responsive="cards">
                        <TableHeader>
                            <TableRow>
                                <TableCell type="header">ID</TableCell>
                                <TableCell type="header">{c('Title').t`Amount`}</TableCell>
                                <TableCell type="header">{c('Title').t`Type`}</TableCell>
                                <TableCell type="header">{c('Title').t`Status`}</TableCell>
                                <TableCell type="header">{c('Title').t`Date`}</TableCell>
                                <TableCell type="header">{c('Title').t`Action`}</TableCell>
                            </TableRow>
                        </TableHeader>
                        <TableBody loading={loading} colSpan={6}>
                            {invoices.map((invoice, index) => {
                                const key = index.toString();
                                return (
                                    <TableRow
                                        key={key}
                                        labels={[
                                            'ID',
                                            c('Title').t`Amount`,
                                            c('Title').t`Type`,
                                            c('Title').t`Status`,
                                            c('Title').t`Date`,
                                            '',
                                        ]}
                                        cells={[
                                            invoice.ID,
                                            <InvoiceAmount key={key} invoice={invoice} />,
                                            <InvoiceType key={key} invoice={invoice} />,
                                            <InvoiceState key={key} invoice={invoice} />,
                                            <Time key={key} sameDayFormat={false}>
                                                {invoice.CreateTime}
                                            </Time>,
                                            <InvoiceActions
                                                key={key}
                                                invoice={invoice}
                                                fetchInvoices={requestInvoices}
                                                onPreview={previewRef.current?.preview}
                                                onDownload={handleDownload}
                                            />,
                                        ]}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
            <InvoicesPreview
                ref={previewRef}
                invoices={invoices}
                onDownload={handleDownload}
                getFilename={getFilename}
            />
        </>
    );
};

const InvoicesSection = () => {
    const [user] = useUser();

    // There are cases when we don't have the tracker in the current context.
    // For example, if user upgrades to CB in one tab and has the second tab open, then the invoices request
    // will go to v4 instead of v5 leading to an error. This hook tracks chargebee for the invoices section.
    useChargebeeUserStatusTracker();

    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const [{ isManagedByMozilla } = { isManagedByMozilla: false }] = useSubscription();

    const [invoiceModalProps, setInvoiceModalOpen, renderInvoiceModal] = useModalState();

    const invoicesHook = useInvoices({ owner, Document: InvoiceDocument.Invoice });
    const creditNotesHook = useInvoices({ owner, Document: InvoiceDocument.CreditNote });
    const currencyConversionsHook = useInvoices({ owner, Document: InvoiceDocument.CurrencyConversion });

    const [document, setDocument] = useState<InvoiceDocument>(InvoiceDocument.Invoice);
    const hook: InvoicesHook = {
        [InvoiceDocument.Invoice]: invoicesHook,
        [InvoiceDocument.CreditNote]: creditNotesHook,
        [InvoiceDocument.CurrencyConversion]: currencyConversionsHook,
    }[document];

    const handleOwner =
        (own = USER) =>
        () => {
            setOwner(own);
            invoicesHook.onSelect(1);
            setDocument(InvoiceDocument.Invoice);
        };

    const hasUnpaid = invoicesHook.invoices.find(({ State }) => State === INVOICE_STATE.UNPAID);

    useSubscribeEventManager(({ Invoices, User } = {}) => {
        if (Invoices && Invoices.length > 0) {
            // it helps with rare routing issue when user pays in one tab but then
            // the invoices are queried in another tab with the old v4 version.
            // Aparanently there is a concurrency isue between setting the global payments version and the invoices request.
            const paymentsVersion: PaymentsVersion | undefined =
                User?.ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED ? 'v5' : undefined;

            void invoicesHook.requestInvoices(paymentsVersion);
            setDocument(InvoiceDocument.Invoice);
        }
    });

    useEffect(() => {
        void hook.requestInvoices();
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
                                    className={document === InvoiceDocument.Invoice ? 'is-selected' : ''}
                                    onClick={() => setDocument(InvoiceDocument.Invoice)}
                                    data-testid="invoices-tab"
                                >
                                    {c('Select invoice document').t`Invoice`}
                                </Button>
                                <Button
                                    className={document === InvoiceDocument.CreditNote ? 'is-selected' : ''}
                                    onClick={() => setDocument(InvoiceDocument.CreditNote)}
                                    data-testid="credit-note-tab"
                                >
                                    {c('Select invoice document').t`Credit note`}
                                </Button>
                                <Button
                                    className={document === InvoiceDocument.CurrencyConversion ? 'is-selected' : ''}
                                    onClick={() => setDocument(InvoiceDocument.CurrencyConversion)}
                                    data-testid="currency-conversion-tab"
                                >
                                    {c('Select invoice document').t`Currency conversion`}
                                </Button>
                            </ButtonGroup>
                            {hook.invoices.length > 0 && (
                                <Button className="mb-2" onClick={() => setInvoiceModalOpen(true)}>{c('Action')
                                    .t`Edit invoice details`}</Button>
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
                <InvoiceGroup {...hook} />
            </SettingsSectionWide>

            {renderInvoiceModal && <InvoiceTextModal {...invoiceModalProps} />}
        </>
    );
};

export default InvoicesSection;

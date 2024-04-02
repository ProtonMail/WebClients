import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { useChargebeeUserStatusTracker } from '@proton/components/payments/client-extensions/useChargebeeContext';
import { useReportRoutingError } from '@proton/components/payments/react-extensions/usePaymentsApi';
import { getInvoice, queryInvoices } from '@proton/shared/lib/api/payments';
import { ELEMENTS_PER_PAGE, INVOICE_OWNER, INVOICE_STATE, MAIL_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import {
    Alert,
    Block,
    ButtonGroup,
    Pagination,
    Table,
    TableBody,
    TableCell,
    TableHeader,
    TableRow,
    Time,
    useModalState,
    usePaginationAsync,
} from '../../components';
import { useApi, useApiResult, useSubscribeEventManager, useSubscription, useUser } from '../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../account';
import MozillaInfoPanel from '../account/MozillaInfoPanel';
import InvoiceActions from './InvoiceActions';
import InvoiceAmount from './InvoiceAmount';
import InvoiceState from './InvoiceState';
import InvoiceTextModal from './InvoiceTextModal';
import InvoiceType from './InvoiceType';
import InvoicesPreview, { InvoicesPreviewControls } from './InvoicesPreview';
import { Invoice, InvoiceResponse } from './interface';

const InvoicesSection = () => {
    const previewRef = useRef<InvoicesPreviewControls | undefined>();
    const api = useApi();
    const [user] = useUser();

    // There are cases when we don't have the tracker in the current context.
    // For example, if user upgrades to CB in one tab and has the second tab open, then the invoices request
    // will go to v4 instead of v5 leading to an error. This hook tracks chargebee for the invoices section.
    useChargebeeUserStatusTracker();

    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const [{ isManagedByMozilla } = { isManagedByMozilla: false }] = useSubscription();

    const [invoiceModalProps, setInvoiceModalOpen, renderInvoiceModal] = useModalState();

    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);

    const handleOwner =
        (own = USER) =>
        () => {
            setOwner(own);
            onSelect(1);
        };

    const query = () =>
        queryInvoices({
            Page: page - 1,
            PageSize: ELEMENTS_PER_PAGE,
            Owner: owner,
        });

    const {
        result = {
            Invoices: [] as Invoice[],
            Total: 0,
        },
        loading,
        request: requestInvoices,
        error,
    } = useApiResult<InvoiceResponse, typeof query>(query, [page, owner], false);

    const reportRoutingError = useReportRoutingError();
    useEffect(
        () =>
            reportRoutingError(error, {
                flow: 'invoices',
            }),
        [error]
    );

    const { Invoices: invoices, Total: total } = result;
    const hasUnpaid = invoices.find(({ State }) => State === INVOICE_STATE.UNPAID);

    useSubscribeEventManager(({ Invoices } = {}) => {
        if (Invoices && Invoices.length > 0) {
            requestInvoices();
        }
    });

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const getFilename = (invoice: Invoice) =>
        `${c('Title for PDF file').t`${MAIL_APP_NAME} invoice`} ${invoice.ID}.pdf`;

    const handleDownload = async (invoice: Invoice) => {
        const buffer = await api(getInvoice(invoice.ID));
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadFile(blob, getFilename(invoice));
    };

    const showError = !!error;
    const isEmpty = page === 1 && !loading && invoices.length === 0 && !showError;
    const showContent = !isEmpty && !showError;

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
                <Block className="flex justify-space-between">
                    <div className="flex items-center">
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
                        {invoices.length > 0 && (
                            <Button className="mb-2" onClick={() => setInvoiceModalOpen(true)}>{c('Action')
                                .t`Edit invoice details`}</Button>
                        )}
                    </div>
                    <Pagination
                        page={page}
                        total={total}
                        limit={ELEMENTS_PER_PAGE}
                        onNext={onNext}
                        onPrevious={onPrevious}
                        onSelect={onSelect}
                    />
                </Block>
                {showError && c('Error').t`Coudn't load invoices. Please try again later.`}
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
            </SettingsSectionWide>
            <InvoicesPreview
                ref={previewRef}
                invoices={invoices}
                onDownload={handleDownload}
                getFilename={getFilename}
            />
            {renderInvoiceModal && <InvoiceTextModal {...invoiceModalProps} />}
        </>
    );
};

export default InvoicesSection;

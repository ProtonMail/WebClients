import { useRef } from 'react';

import { c } from 'ttag';

import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import useApi from '@proton/components/hooks/useApi';
import { getInvoicePDF } from '@proton/payments';
import type { Invoice } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import InvoiceActions from './InvoiceActions';
import InvoiceAmount from './InvoiceAmount';
import InvoiceStateBadge from './InvoiceStateBadge';
import InvoiceTypeTitle from './InvoiceTypeTitle';
import type { PdfPreviewControls } from './PaymentsPdfPreview';
import PaymentsPdfPreview from './PaymentsPdfPreview';
import { getInvoicePaymentsVersion } from './helpers';
import { type InvoicesHook } from './useInvoices';

type Props = InvoicesHook & {
    onEdit: (invoice: Invoice) => Promise<void>;
};

const InvoiceGroup = ({ invoices, loading, error, page, request, onEdit }: Props) => {
    const previewRef = useRef<PdfPreviewControls>(null);
    const api = useApi();

    const showError = !!error;
    const isEmpty = page === 1 && !loading && invoices.length === 0 && !showError;
    const showContent = !isEmpty && !showError;

    const getFilename = (invoice: Invoice) =>
        `${c('Title for PDF file').t`${MAIL_APP_NAME} invoice`} ${invoice.ID}.pdf`;

    const handleDownload = async (invoice: Invoice) => {
        const buffer = await api(getInvoicePDF(invoice.ID, getInvoicePaymentsVersion(invoice)));
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
                                            <InvoiceTypeTitle key={key} invoice={invoice} />,
                                            <InvoiceStateBadge key={key} invoice={invoice} />,
                                            <Time key={key} sameDayFormat={false}>
                                                {invoice.CreateTime}
                                            </Time>,
                                            <InvoiceActions
                                                key={key}
                                                invoice={invoice}
                                                fetchInvoices={request}
                                                onPreview={previewRef.current?.preview}
                                                onDownload={handleDownload}
                                                onEdit={onEdit}
                                            />,
                                        ]}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
            )}
            <PaymentsPdfPreview
                type="invoice"
                ref={previewRef}
                items={invoices}
                onDownload={handleDownload}
                getFilename={getFilename}
            />
        </>
    );
};

export default InvoiceGroup;

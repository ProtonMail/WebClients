import { useRef } from 'react';

import { c } from 'ttag';

import Price from '@proton/components/components/price/Price';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import useApi from '@proton/components/hooks/useApi';
import { type Transaction, getTransactionPDF } from '@proton/payments';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import downloadFile from '@proton/shared/lib/helpers/downloadFile';

import PaymentsPdfPreview, { type PdfPreviewControls } from './PaymentsPdfPreview';
import TransactionActions from './TransactionActions';
import TransactionState from './TransactionState';
import TransactionType from './TransactionType';
import type { TransactionsHook } from './useTransactions';

const TransactionGroup = ({ transactions, loading, error, page }: TransactionsHook) => {
    const previewRef = useRef<PdfPreviewControls>(null);
    const api = useApi();
    const showError = !!error;
    const isEmpty = page === 1 && !loading && transactions.length === 0 && !showError;
    const showContent = !isEmpty && !showError;

    const getFilename = (transaction: Transaction) =>
        `${c('Title for PDF file').t`${MAIL_APP_NAME} transaction`} ${transaction.TransactionID}.pdf`;

    const handleDownload = async (transaction: Transaction) => {
        const buffer = await api(getTransactionPDF(transaction.TransactionID));
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadFile(blob, getFilename(transaction));
    };

    return (
        <>
            {showError && c('Error').t`Couldn't load transactions. Please try again later.`}
            {isEmpty && c('Info').t`You have no transactions.`}
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
                            {transactions.map((transaction, index) => {
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
                                            transaction.TransactionID,
                                            <Price currency={transaction.CurrencyCode}>{transaction.Amount}</Price>,
                                            <TransactionType key={key} type={transaction.Type} />,
                                            <TransactionState key={key} state={transaction.State} />,
                                            <Time key={key} sameDayFormat={false}>
                                                {transaction.CreatedAt}
                                            </Time>,
                                            <TransactionActions
                                                key={key}
                                                transaction={transaction}
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
            <PaymentsPdfPreview
                type="transaction"
                ref={previewRef}
                items={transactions}
                onDownload={handleDownload}
                getFilename={getFilename}
            />
        </>
    );
};

export default TransactionGroup;

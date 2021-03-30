import React, { useState } from 'react';
import { c } from 'ttag';
import { queryInvoices } from 'proton-shared/lib/api/payments';
import { ELEMENTS_PER_PAGE, INVOICE_OWNER, INVOICE_STATE } from 'proton-shared/lib/constants';
import {
    Alert,
    ButtonGroup,
    Block,
    Button,
    Table,
    TableCell,
    TableBody,
    Pagination,
    usePaginationAsync,
    TableRow,
    Time,
} from '../../components';
import { useModals, useSubscription, useUser } from '../../hooks';

import MozillaInfoPanel from '../account/MozillaInfoPanel';
import useApiResult from '../../hooks/useApiResult';
import InvoiceAmount from './InvoiceAmount';
import InvoiceType from './InvoiceType';
import InvoiceState from './InvoiceState';
import InvoiceActions from './InvoiceActions';
import InvoiceTextModal from './InvoiceTextModal';

const InvoicesSection = () => {
    const [user] = useUser();
    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const { createModal } = useModals();
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);

    const handleOwner = (own = USER) => () => {
        setOwner(own);
        onSelect(1);
    };

    const query = () =>
        queryInvoices({
            Page: page - 1,
            PageSize: ELEMENTS_PER_PAGE,
            Owner: owner,
        });

    const { result = {}, loading, request } = useApiResult(query, [page, owner]);
    const { Invoices: invoices = [], Total: total = 0 } = result;
    const hasUnpaid = invoices.find(({ State }) => State === INVOICE_STATE.UNPAID);

    if (isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const handleOpenModal = () => {
        createModal(<InvoiceTextModal />);
    };

    if (page === 1 && !loading && invoices.length === 0) {
        return <Alert>{c('Error').t`You have no invoices.`}</Alert>;
    }
    const headerCells = [
        { node: 'ID', className: 'text-ellipsis' },
        { node: c('Title').t`Amount` },
        { node: c('Title').t`Type`, className: 'no-tablet no-mobile' },
        { node: c('Title').t`Status`, className: 'no-mobile' },
        { node: c('Title').t`Date`, className: 'no-mobile' },
        { node: c('Title').t`Action` },
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <>
            <Alert>{c('Info').t`You can customize and download your invoices for accounting purposes.`}</Alert>
            {hasUnpaid ? (
                <Alert type="error">{c('Error')
                    .t`Your account or organization currently has an overdue invoice. Please pay all unpaid invoices.`}</Alert>
            ) : null}
            <Block className="flex flex-justify-space-between">
                <div className="flex flex-align-items-center">
                    {user.isPaid ? (
                        <ButtonGroup className="mr1">
                            <Button group className={owner === USER ? 'is-active' : ''} onClick={handleOwner(USER)}>{c(
                                'Action'
                            ).t`User`}</Button>
                            <Button
                                group
                                className={owner === ORGANIZATION ? 'is-active' : ''}
                                onClick={handleOwner(ORGANIZATION)}
                            >{c('Action').t`Organization`}</Button>
                        </ButtonGroup>
                    ) : null}
                    <Button onClick={handleOpenModal}>{c('Action').t`Customize`}</Button>
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
            <Table className="simple-table--has-actions">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody loading={loading} colSpan={6}>
                    {invoices.map((invoice, index) => {
                        const key = index.toString();
                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    invoice.ID,
                                    <InvoiceAmount key={key} invoice={invoice} />,
                                    <InvoiceType key={key} invoice={invoice} />,
                                    <InvoiceState key={key} invoice={invoice} />,
                                    <Time key={key}>{invoice.CreateTime}</Time>,
                                    <InvoiceActions key={key} invoice={invoice} fetchInvoices={request} />,
                                ]}
                                className="on-tablet-hide-td3 on-mobile-hide-td4 on-mobile-hide-td5"
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default InvoicesSection;

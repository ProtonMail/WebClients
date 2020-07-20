import React, { useState } from 'react';
import { c } from 'ttag';
import {
    Alert,
    Group,
    ButtonGroup,
    Block,
    Button,
    Table,
    MozillaInfoPanel,
    TableCell,
    TableBody,
    Pagination,
    usePaginationAsync,
    TableRow,
    Time,
    useModals,
    useSubscription,
    useUser,
} from 'react-components';
import { queryInvoices } from 'proton-shared/lib/api/payments';
import { ELEMENTS_PER_PAGE, INVOICE_OWNER, INVOICE_STATE } from 'proton-shared/lib/constants';

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
        { node: 'ID', className: 'ellipsis' },
        { node: c('Title').t`Amount` },
        { node: c('Title').t`Type`, className: 'notablet nomobile' },
        { node: c('Title').t`Status`, className: 'nomobile' },
        { node: c('Title').t`Date`, className: 'nomobile' },
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
            <Block className="flex flex-spacebetween">
                <div>
                    {user.isPaid ? (
                        <Group className="mr1">
                            <ButtonGroup className={owner === USER ? 'is-active' : ''} onClick={handleOwner(USER)}>{c(
                                'Action'
                            ).t`User`}</ButtonGroup>
                            <ButtonGroup
                                className={owner === ORGANIZATION ? 'is-active' : ''}
                                onClick={handleOwner(ORGANIZATION)}
                            >{c('Action').t`Organization`}</ButtonGroup>
                        </Group>
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
            <Table className="pm-simple-table--has-actions">
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
                                className="ontablet-hideTd3 onmobile-hideTd4 onmobile-hideTd5"
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default InvoicesSection;

import React, { useState } from 'react';
import { c } from 'ttag';
import {
    Alert,
    SubTitle,
    Group,
    ButtonGroup,
    Block,
    Button,
    Table,
    MozillaInfoPanel,
    TableHeader,
    TableBody,
    Pagination,
    usePaginationAsync,
    TableRow,
    Time,
    useModals,
    useSubscription
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
    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const [{ isManagedByMozilla } = {}] = useSubscription();
    const { createModal } = useModals();
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const handleOwner = (own = USER) => () => setOwner(own);

    const query = () =>
        queryInvoices({
            Page: page,
            PageSize: ELEMENTS_PER_PAGE,
            Owner: owner
        });

    const { result = {}, loading, request } = useApiResult(query, [page, owner]);
    const { Invoices: invoices = [], Total: total = 0 } = result;
    const hasUnpaid = invoices.find(({ State }) => State === INVOICE_STATE.UNPAID);

    if (isManagedByMozilla) {
        return (
            <>
                <SubTitle>{c('Title').t`Invoices`}</SubTitle>
                <MozillaInfoPanel />
            </>
        );
    }

    const handleOpenModal = () => {
        createModal(<InvoiceTextModal />);
    };

    return (
        <>
            <SubTitle>{c('Title').t`Invoices`}</SubTitle>
            <Alert learnMore="todo">
                {c('Info')
                    .t`Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`}
            </Alert>
            {hasUnpaid ? (
                <Alert>{c('Error')
                    .t`Your account or organization currently has an overdue invoice. Please pay all unpaid invoices.`}</Alert>
            ) : null}
            <Block className="flex flex-spacebetween">
                <div>
                    <Group className="mr1">
                        <ButtonGroup className={owner === USER ? 'is-active' : ''} onClick={handleOwner(USER)}>{c(
                            'Action'
                        ).t`User`}</ButtonGroup>
                        <ButtonGroup
                            className={owner === ORGANIZATION ? 'is-active' : ''}
                            onClick={handleOwner(ORGANIZATION)}
                        >{c('Action').t`Organization`}</ButtonGroup>
                    </Group>
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
            <Table>
                <TableHeader
                    cells={[
                        'ID',
                        c('Title').t`Amount`,
                        c('Title').t`Type`,
                        c('Title').t`Status`,
                        c('Title').t`Date`,
                        c('Title').t`Action`
                    ]}
                />
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
                                    <InvoiceActions key={key} invoice={invoice} fetchInvoices={request} />
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default InvoicesSection;

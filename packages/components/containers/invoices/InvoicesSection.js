import React, { useState, useEffect, useContext } from 'react';
import { t } from 'ttag';
import { Alert, SubTitle, Group, ButtonGroup, Block, Button, Table, TableHeader, TableBody, Pagination, usePaginationAsync, TableRow, Time, LearnMore, useModal, useLoading } from 'react-components';
import ContextApi from 'proton-shared/lib/context/api';
import { queryInvoices } from 'proton-shared/lib/api/payments';
import { ELEMENTS_PER_PAGE, INVOICE_OWNER } from 'proton-shared/lib/constants';

import InvoiceAmount from './InvoiceAmount';
import InvoiceType from './InvoiceType';
import InvoiceState from './InvoiceState';
import InvoiceActions from './InvoiceActions';
import InvoiceTextModal from './InvoiceTextModal';

const InvoicesSection = () => {
    const { api } = useContext(ContextApi);
    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const {loading, loaded} = useLoading();
    const [table, setTable] = useState({ invoices: [], total: 0 });
    const { isOpen, open, close } = useModal();
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const handleOwner = (own = USER) => () => setOwner(own);

    const fetchInvoices = async () => {
        const { Total: total, Invoices: invoices } = await api(queryInvoices({ Page: page, PageSize: ELEMENTS_PER_PAGE, Owner: owner }));
        setTable({ invoices, total });
        loaded();
    };

    useEffect(() => {
        fetchInvoices();
    }, [page, owner]);

    return (
        <>
            <SubTitle>{t`Invoices`}</SubTitle>
            <Alert>
                {t`Neque porro quisquam est qui dolorem ipsum quia dolor sit amet, consectetur, adipisci velit.`}
                <br />
                <LearnMore url="todo" />
            </Alert>
            <Block className="flex flex-spacebetween">
                <div>
                    <Group>
                        <ButtonGroup className={owner === USER ? 'is-active' : ''} onClick={handleOwner(USER)}>{t`User`}</ButtonGroup>
                        <ButtonGroup className={owner === ORGANIZATION ? 'is-active' : ''} onClick={handleOwner(ORGANIZATION)}>{t`Organization`}</ButtonGroup>
                    </Group>
                    <Button onClick={open}>{t`Customize`}</Button>
                    <InvoiceTextModal show={isOpen} onClose={close} />
                </div>
                <Pagination
                    page={page}
                    total={table.total}
                    limit={ELEMENTS_PER_PAGE}
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect} />
            </Block>
            <Table>
                <TableHeader cells={[
                    'ID',
                    t`Amount`,
                    t`Type`,
                    t`Status`,
                    t`Date`,
                    t`Action`
                ]} />
                <TableBody loading={loading}>
                    {table.invoices.map((invoice, index) => {
                        const key = index.toString();
                        return <TableRow key={key} cells={[
                            invoice.ID,
                            <InvoiceAmount key={key} invoice={invoice} />,
                            <InvoiceType key={key} invoice={invoice} />,
                            <InvoiceState key={key} invoice={invoice} />,
                            <Time key={key}>{invoice.CreateTime}</Time>,
                            <InvoiceActions key={key} invoice={invoice} />
                        ]} />;
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default InvoicesSection;
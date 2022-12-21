import { useRef, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
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
    usePaginationAsync,
} from '../../components';
import { useApi, useModals, useSubscribeEventManager, useSubscription, useUser } from '../../hooks';
import useApiResult from '../../hooks/useApiResult';
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
    const { ORGANIZATION, USER } = INVOICE_OWNER;
    const [owner, setOwner] = useState(USER);
    const [subscription] = useSubscription();
    const { createModal } = useModals();
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
        } as any);

    const {
        result = {
            Invoices: [] as Invoice[],
            Total: 0,
        },
        loading,
        request: requestInvoices,
    } = useApiResult<InvoiceResponse, any>(query, [page, owner]);
    const { Invoices: invoices, Total: total } = result;
    const hasUnpaid = invoices.find(({ State }) => State === INVOICE_STATE.UNPAID);

    useSubscribeEventManager(({ Invoices }) => {
        if (Invoices && Invoices.length > 0) {
            requestInvoices();
        }
    });

    if (!subscription) {
        return null;
    }

    if (subscription.isManagedByMozilla) {
        return <MozillaInfoPanel />;
    }

    const handleOpenModal = () => {
        createModal(<InvoiceTextModal />);
    };

    const getFilename = (invoice: Invoice) =>
        `${c('Title for PDF file').t`${MAIL_APP_NAME} invoice`} ${invoice.ID}.pdf`;

    const handleDownload = async (invoice: Invoice) => {
        const buffer = await api(getInvoice(invoice.ID));
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadFile(blob, getFilename(invoice));
    };

    const isEmpty = page === 1 && !loading && invoices.length === 0;

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info')
                    .t`You can customize and download your invoices for accounting purposes.`}</SettingsParagraph>
                {hasUnpaid ? (
                    <Alert className="mb1" type="error">
                        {c('Error')
                            .t`Your account or organization has an overdue invoice. Please pay all unpaid invoices.`}
                    </Alert>
                ) : null}
                <Block className="flex flex-justify-space-between">
                    <div className="flex flex-align-items-center">
                        {user.isPaid ? (
                            <ButtonGroup className="mr1">
                                <Button className={owner === USER ? 'is-selected' : ''} onClick={handleOwner(USER)}>
                                    {c('Action').t`User`}
                                </Button>
                                <Button
                                    className={owner === ORGANIZATION ? 'is-selected' : ''}
                                    onClick={handleOwner(ORGANIZATION)}
                                >
                                    {c('Action').t`Organization`}
                                </Button>
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
                {isEmpty ? (
                    c('Error').t`You have no invoices.`
                ) : (
                    <div style={{ overflow: 'auto' }}>
                        <Table className="simple-table--has-actions">
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
                                            cells={[
                                                invoice.ID,
                                                <InvoiceAmount key={key} invoice={invoice} />,
                                                <InvoiceType key={key} invoice={invoice} />,
                                                <InvoiceState key={key} invoice={invoice} />,
                                                <Time key={key}>{invoice.CreateTime}</Time>,
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
        </>
    );
};

export default InvoicesSection;

import React, { useState, useRef } from 'react';
import { c } from 'ttag';

import { queryInvoices, getInvoice } from 'proton-shared/lib/api/payments';
import { ELEMENTS_PER_PAGE, INVOICE_OWNER, INVOICE_STATE } from 'proton-shared/lib/constants';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';

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
    TableHeader,
} from '../../components';
import { useModals, useSubscription, useUser, useApi } from '../../hooks';

import MozillaInfoPanel from '../account/MozillaInfoPanel';
import useApiResult from '../../hooks/useApiResult';

import InvoiceAmount from './InvoiceAmount';
import InvoiceType from './InvoiceType';
import InvoiceState from './InvoiceState';
import InvoiceActions from './InvoiceActions';
import InvoiceTextModal from './InvoiceTextModal';
import InvoicesPreview from './InvoicesPreview';

import { SettingsParagraph, SettingsSection, SettingsSectionWide } from '../account';

const InvoicesSection = () => {
    const previewRef = useRef();
    const api = useApi();
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
        return (
            <SettingsSection>
                <SettingsParagraph>{c('Error').t`You have no invoices.`}</SettingsParagraph>
            </SettingsSection>
        );
    }

    const getFilename = (invoice) => `${c('Title for PDF file').t`ProtonMail invoice`} ${invoice.ID}.pdf`;

    const handleDownload = async (invoice) => {
        const buffer = await api(getInvoice(invoice.ID));
        const blob = new Blob([buffer], { type: 'application/pdf' });
        downloadFile(blob, getFilename(invoice));
    };

    return (
        <>
            <SettingsSectionWide>
                <SettingsParagraph>{c('Info')
                    .t`You can customize and download your invoices for accounting purposes.`}</SettingsParagraph>
                {hasUnpaid ? (
                    <Alert type="error">
                        {c('Error')
                            .t`Your account or organization currently has an overdue invoice. Please pay all unpaid invoices.`}
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
                                                fetchInvoices={request}
                                                onPreview={previewRef.current.preview}
                                                onDownload={handleDownload}
                                            />,
                                        ]}
                                    />
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>
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

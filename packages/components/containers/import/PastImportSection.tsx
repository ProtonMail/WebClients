import React from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { deleteMailImportReport } from 'proton-shared/lib/api/mailImport';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { useApi, useLoading, useEventManager, useNotifications, useModals, useImportHistory } from '../../hooks';
import { Button, Loader, Alert, Table, TableCell, TableBody, TableRow, Badge, ErrorButton } from '../../components';

import { ConfirmModal } from '../../components/modal';

import { ImportHistory, ImportMailReportStatus } from './interfaces';

interface ImportStatusProps {
    status: ImportMailReportStatus;
}

const ImportStatus = ({ status }: ImportStatusProps) => {
    switch (status) {
        case ImportMailReportStatus.PAUSED:
            return <Badge type="warning" className="m0">{c('Import status').t`Paused`}</Badge>;
        case ImportMailReportStatus.CANCELED:
            return <Badge type="error" className="m0">{c('Import status').t`Canceled`}</Badge>;
        case ImportMailReportStatus.DONE:
            return <Badge type="success" className="m0">{c('Import status').t`Completed`}</Badge>;
        case ImportMailReportStatus.FAILED:
            return <Badge type="error" className="m0">{c('Import status').t`Failed`}</Badge>;
        default:
            return null;
    }
};

interface DeleteButtonProps {
    ID: string;
}

const DeleteButton = ({ ID }: DeleteButtonProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();

    const [loadingActions, withLoadingActions] = useLoading();
    const { createNotification } = useNotifications();

    const handleDelete = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Remove from the list?`}
                    cancel={c('Action').t`Keep`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Remove`}</ErrorButton>}
                >
                    <Alert type="error">
                        {c('Warning').t`You will not see this import record in the list anymore.`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(deleteMailImportReport(ID));
        await call();
        createNotification({ text: c('Success').t`Import record deleted` });
    };

    return (
        <Button
            loading={loadingActions}
            className="button--small"
            onClick={() => withLoadingActions(handleDelete())}
        >{c('Action').t`Delete record`}</Button>
    );
};

const sortByDate = (a: ImportHistory, b: ImportHistory) => (a.EndTime > b.EndTime ? -1 : 1);

const PastImportsSection = () => {
    const [imports, loading] = useImportHistory();

    if (loading) {
        return <Loader />;
    }

    if (!imports.length) {
        return <Alert>{c('Info').t`No past imports.`}</Alert>;
    }

    const headerCells = [
        { node: c('Title header').t`Import` },
        { node: c('Title header').t`Status`, className: 'on-mobile-w33 on-mobile-text-center' },
        { node: c('Title header').t`Date`, className: 'no-mobile' },
        { node: c('Title header').t`Size`, className: 'no-mobile' },
        { node: c('Title header').t`Actions`, className: 'no-mobile' },
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <>
            <Alert>{c('Info').t`Check the records of your past imports.`}</Alert>
            <Table className="on-mobile-hide-td3 on-mobile-hide-td4 on-mobile-hide-td5 simple-table--has-actions">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody>
                    {imports.sort(sortByDate).map(({ State, Email, ID, TotalSize, EndTime }) => {
                        return (
                            <TableRow
                                key={ID}
                                cells={[
                                    <>
                                        <div key="email" className="w100 text-ellipsis">
                                            {Email}
                                        </div>
                                        <time key="importDate" className="no-desktop no-tablet">
                                            {format(EndTime * 1000, 'PPp')}
                                        </time>
                                    </>,
                                    <div className="on-mobile-text-center">
                                        <ImportStatus key="status" status={State} />
                                    </div>,
                                    <time key="importDate">{format(EndTime * 1000, 'PPp')}</time>,
                                    humanSize(TotalSize),
                                    <DeleteButton key="button" ID={ID} />,
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default PastImportsSection;

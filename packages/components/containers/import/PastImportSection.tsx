import React from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { deleteMailImportReport } from 'proton-shared/lib/api/mailImport';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { useApi, useLoading, useEventManager, useNotifications, useModals, useImportHistory } from '../../hooks';
import { Button, Loader, Alert, Table, TableCell, TableBody, TableRow, Badge, ErrorButton } from '../../components';

import { ConfirmModal } from '../../components/modal';

import { ImportMailReportStatus } from './interfaces';

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
        await new Promise((resolve, reject) => {
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
            className="pm-button--small"
            onClick={() => {
                withLoadingActions(handleDelete());
            }}
        >{c('Action').t`Delete record`}</Button>
    );
};

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
        { node: c('Title header').t`Status`, className: 'onmobile-w33 onmobile-aligncenter' },
        { node: c('Title header').t`Date`, className: 'nomobile' },
        { node: c('Title header').t`Size`, className: 'nomobile' },
        { node: c('Title header').t`Actions`, className: 'nomobile' },
    ].map(({ node, className = '' }, i) => {
        return (
            <TableCell key={i.toString()} className={className} type="header">
                {node}
            </TableCell>
        );
    });

    return (
        <>
            <Alert>{c('Info').t`Check records of already processed imports`}</Alert>
            <Table className="onmobile-hideTd3 onmobile-hideTd4 onmobile-hideTd5">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody>
                    {imports.map(({ State, Email, ID, TotalSize, EndTime }, index) => {
                        return (
                            <TableRow
                                key={index}
                                cells={[
                                    <>
                                        <div key="email" className="w100 ellipsis">
                                            {Email}
                                        </div>
                                        <time key="importDate" className="nodesktop notablet">
                                            {format(EndTime * 1000, 'PPp')}
                                        </time>
                                    </>,
                                    <div className="onmobile-aligncenter">
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

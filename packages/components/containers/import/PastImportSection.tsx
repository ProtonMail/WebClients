import React from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { deleteMailImportReport, deleteSource } from 'proton-shared/lib/api/mailImport';
import humanSize from 'proton-shared/lib/helpers/humanSize';
import isTruthy from 'proton-shared/lib/helpers/isTruthy';

import { useApi, useLoading, useEventManager, useNotifications, useModals, useImportHistory } from '../../hooks';
import {
    Loader,
    Alert,
    Table,
    TableCell,
    TableBody,
    TableRow,
    Badge,
    ErrorButton,
    DropdownActions,
    ConfirmModal,
} from '../../components';

import { ImportHistory, ImportMailReportStatus } from './interfaces';
import DeleteAllMessagesModal from './modals/DeleteAllMessagesModal';

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
    email: string;
    showDeleteSource: number;
}

const DeleteButton = ({ ID, email, showDeleteSource }: DeleteButtonProps) => {
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();

    const [loadingDeleteRecord, withLoadingDeleteRecord] = useLoading();
    const [loadingDeleteOriginal, withLoadingDeleteOriginal] = useLoading();

    const handleDeleteRecord = async () => {
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
        await withLoadingDeleteRecord(api(deleteMailImportReport(ID)));
        await call();
        createNotification({ text: c('Success').t`Import record deleted` });
    };

    const handleDeleteOriginal = async () => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <DeleteAllMessagesModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Delete all messages`}
                    cancel={c('Action').t`Cancel`}
                    email={email}
                />
            );
        });

        await withLoadingDeleteOriginal(api(deleteSource(ID)));
        await call();

        createNotification({ text: c('Success').t`Deleting original messages` });
    };

    const list = [
        {
            text: c('Action').t`Delete record`,
            onClick: handleDeleteRecord,
            loading: loadingDeleteRecord,
        },
        showDeleteSource &&
            ({
                text: c('Action').t`Delete original messages`,
                onClick: handleDeleteOriginal,
                loading: loadingDeleteOriginal,
                actionType: 'delete',
            } as const),
    ].filter(isTruthy);

    return <DropdownActions size="small" list={list} />;
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
        {
            node: c('Title header').t`Status`,
            className: 'on-mobile-w33 on-mobile-text-center',
        },
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
                    {imports.sort(sortByDate).map(({ State, Email, ID, TotalSize, EndTime, CanDeleteSource }) => {
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
                                    <DeleteButton
                                        key="button"
                                        email={Email}
                                        ID={ID}
                                        showDeleteSource={CanDeleteSource}
                                    />,
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

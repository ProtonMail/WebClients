import React, { useState, useEffect } from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { queryMailImportHistory, deleteMailImportReport } from 'proton-shared/lib/api/mailImport';
import humanSize from 'proton-shared/lib/helpers/humanSize';

import { useApi, useLoading, useNotifications, useModals } from '../../hooks';
import { Button, Loader, Alert, Table, TableHeader, TableBody, TableRow, Badge, ErrorButton } from '../../components';

import { ConfirmModal } from '../../components/modal';

import { ImportMailReport, ImportMailReportStatus } from './interfaces';

interface ImportStatusProps {
    status: ImportMailReportStatus;
}

const ImportStatus = ({ status }: ImportStatusProps) => {
    switch (status) {
        case ImportMailReportStatus.PAUSED:
            return <Badge type="warning">{c('Import status').t`Paused`}</Badge>;
        case ImportMailReportStatus.CANCELED:
            return <Badge type="error">{c('Import status').t`Canceled`}</Badge>;
        case ImportMailReportStatus.DONE:
            return <Badge type="success">{c('Import status').t`Completed`}</Badge>;
        case ImportMailReportStatus.FAILED:
            return <Badge type="error">{c('Import status').t`Failed`}</Badge>;
        default:
            return null;
    }
};

interface DeleteButtonProps {
    ID: string;
    callback: () => void;
}

const DeleteButton = ({ ID, callback }: DeleteButtonProps) => {
    const api = useApi();
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
        await callback();
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
    const api = useApi();
    const [imports, setImports] = useState<ImportMailReport[]>([]);
    const [loading, withLoading] = useLoading();

    const fetch = async () => {
        const { Imports = [] } = await api(queryMailImportHistory());
        setImports(Imports);
    };

    useEffect(() => {
        withLoading(fetch());

        const intervalID = setInterval(() => {
            fetch();
        }, 10 * 1000);

        return () => {
            clearTimeout(intervalID);
        };
    }, []);

    if (loading) {
        return <Loader />;
    }

    if (!imports.length) {
        return <Alert>{c('Info').t`No previous imports`}</Alert>;
    }

    return (
        <>
            <Alert>{c('Info').t`Check records of already processed imports`}</Alert>
            <Table>
                <TableHeader
                    cells={[
                        c('Title header').t`Import`,
                        c('Title header').t`Status`,
                        c('Title header').t`Date`,
                        c('Title header').t`Size`,
                        c('Title header').t`Actions`,
                    ]}
                />
                <TableBody>
                    {imports.map(({ State, Email, ID, TotalSize, EndTime }, index) => {
                        return (
                            <TableRow
                                key={index}
                                cells={[
                                    <div key="email" className="w100 ellipsis">
                                        {Email}
                                    </div>,
                                    <ImportStatus key="status" status={State} />,
                                    <time key="importDate">{format(EndTime * 1000, 'PPp')}</time>,
                                    humanSize(TotalSize),
                                    <DeleteButton key="button" ID={ID} callback={fetch} />,
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

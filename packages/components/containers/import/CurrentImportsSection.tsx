import React, { useEffect, useState, forwardRef, useImperativeHandle } from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { queryMailImport, resumeMailImport, cancelMailImport } from 'proton-shared/lib/api/mailImport';

import { useApi, useLoading, useNotifications, useModals } from '../../hooks';
import {
    Loader,
    Alert,
    Table,
    TableBody,
    TableRow,
    TableCell,
    DropdownActions,
    Badge,
    ConfirmModal,
    Tooltip,
    Icon,
    ErrorButton,
} from '../../components';

import { ImportMail, ImportMailStatus, ImportMailError } from './interfaces';
import ImportMailModal from './modals/ImportMailModal';

interface ImportsFromServer {
    Active: ImportMail;
    Email: string;
    ID: string;
    ImapHost: string;
    ImapPort: number;
    Sasl: string;
}

interface RowActionsProps {
    currentImport: ImportMail;
    fetchCurrentImports: () => void;
    fetchPastImports: () => void;
}

const RowActions = ({ currentImport, fetchCurrentImports, fetchPastImports }: RowActionsProps) => {
    const { ID, State, ErrorCode } = currentImport;
    const api = useApi();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const handleResume = async (importID: string) => {
        await api(resumeMailImport(importID));
        fetchCurrentImports();
        createNotification({ text: c('Success').t`Import resumed` });
    };

    const handleReconnect = async () => {
        await createModal(<ImportMailModal currentImport={currentImport} onImportComplete={fetchCurrentImports} />);
        fetchCurrentImports();
    };

    const handleCancel = async (importID: string) => {
        await new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={
                        ErrorCode
                            ? c('Confirm modal title').t`Import is incomplete!`
                            : c('Confirm modal title').t`Import is not finished. Cancel anyway?`
                    }
                    cancel={ErrorCode ? c('Action').t`Continue import` : c('Action').t`Back to import`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Cancel import`}</ErrorButton>}
                >
                    <Alert type="error">
                        {ErrorCode
                            ? c('Warning')
                                  .t`If you quit, you will not be able to resume this import. All progress has been saved in your Proton account. Quit anyway?`
                            : c('Warning')
                                  .t`To finish importing, you will have to start over. All progress so far was saved in your Proton account.`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(cancelMailImport(importID));
        fetchPastImports();
        fetchCurrentImports();
        createNotification({ text: c('Success').t`Import canceled` });
    };

    const list = [];

    if (State === ImportMailStatus.PAUSED) {
        const isAuthError = ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;

        list.push({
            text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
            onClick: () => {
                if (isAuthError) {
                    withLoadingSecondaryAction(handleReconnect());
                } else {
                    withLoadingSecondaryAction(handleResume(ID));
                }
            },
            loading: loadingSecondaryAction,
        });
    }

    if (State !== ImportMailStatus.CANCELED) {
        list.push({
            text: c('Action').t`Cancel`,
            onClick: () => {
                withLoadingPrimaryAction(handleCancel(ID));
            },
            loading: loadingPrimaryAction,
        });
    }

    return <DropdownActions key="actions" className="pm-button--small" list={list} />;
};

interface Props {
    fetchPastImports: () => void;
}

const CurrentImportsSection = forwardRef(({ fetchPastImports }: Props, ref) => {
    const api = useApi();
    const [imports, setImports] = useState<ImportMail[]>([]);
    const [loading, withLoading] = useLoading();

    const fetch = async () => {
        const data: { Importers: ImportsFromServer[] } = await api(queryMailImport());
        const imports = data.Importers || [];
        setImports(
            imports
                .filter((i) => i.Active)
                .map((i) => ({
                    ...i.Active,
                    ID: i.ID,
                    Email: i.Email,
                    ImapHost: i.ImapHost,
                    ImapPort: `${i.ImapPort}`,
                }))
        );
    };

    useImperativeHandle(ref, () => ({
        fetch,
    }));

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
        return <Alert>{c('Info').t`No imports in progress`}</Alert>;
    }

    const hasStoragePausedImports = imports.some(({ State, ErrorCode }: ImportMail) => {
        return State === ImportMailStatus.PAUSED && ErrorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT;
    });
    const hasAuthPausedImports = imports.some(({ State, ErrorCode }: ImportMail) => {
        return State === ImportMailStatus.PAUSED && ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;
    });

    const headerCells = [
        { node: c('Title header').t`Import` },
        { node: c('Title header').t`Progress`, className: 'onmobile-w33 onmobile-aligncenter' },
        { node: c('Title header').t`Started`, className: 'nomobile' },
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
            {!hasAuthPausedImports && <Alert>{c('Info').t`Check the status of your imports in progress`}</Alert>}
            {hasStoragePausedImports && (
                <Alert type="warning">
                    {c('Info').t`Proton paused an import because your account is running low on space. You can:`}
                    <ul className="m0">
                        <li>{c('Info').t`free up space by deleting older messages or other data`}</li>
                        <li>{c('Info').t`purchase additional storage`}</li>
                    </ul>
                </Alert>
            )}
            {hasAuthPausedImports && (
                <Alert type="warning">
                    {c('Info')
                        .t`Proton paused an import because it lost the connection with your other email provider. Please reconnect.`}
                </Alert>
            )}
            <Table className="onmobile-hideTd3 onmobile-hideTd4">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody>
                    {imports.map((currentImport, index) => {
                        const { Email, State, ErrorCode, CreateTime, Mapping = [] } = currentImport;
                        const { total, processed } = Mapping.reduce(
                            (acc, { Total = 0, Processed = 0 }) => {
                                acc.total += Total;
                                acc.processed += Processed;
                                return acc;
                            },
                            { total: 0, processed: 0 }
                        );

                        const badgeRenderer = () => {
                            const percentage = (processed * 100) / total;
                            const percentageValue = Number.isNaN(percentage) ? 0 : Math.round(percentage);

                            if (State === ImportMailStatus.PAUSED) {
                                return (
                                    <div className="onmobile-aligncenter">
                                        <Badge type="warning">{c('Import status').t`${percentageValue}% paused`}</Badge>

                                        {ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION && (
                                            <Tooltip title={c('Tooltip').t`Account is disconnected`}>
                                                <Icon name="attention-plain" />
                                            </Tooltip>
                                        )}
                                        {ErrorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT && (
                                            <Tooltip title={c('Tooltip').t`Your ProtonMail inbox is almost full`}>
                                                <Icon name="attention-plain" />
                                            </Tooltip>
                                        )}
                                    </div>
                                );
                            }

                            return (
                                <div className="onmobile-aligncenter">
                                    <Badge className="m0">{c('Import status').t`${percentageValue}% imported`}</Badge>
                                </div>
                            );
                        };

                        return (
                            <TableRow
                                key={index}
                                cells={[
                                    <>
                                        <div key="email" className="w100 ellipsis">
                                            {Email}
                                        </div>
                                        <time key="importDate" className="nodesktop notablet">
                                            {format(CreateTime * 1000, 'PPp')}
                                        </time>
                                    </>,
                                    badgeRenderer(),
                                    <time key="importDate">{format(CreateTime * 1000, 'PPp')}</time>,
                                    <RowActions
                                        key="actions"
                                        currentImport={currentImport}
                                        fetchCurrentImports={fetch}
                                        fetchPastImports={fetchPastImports}
                                    />,
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
});

export default CurrentImportsSection;

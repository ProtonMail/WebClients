import React, { useMemo } from 'react';
import { format } from 'date-fns';
import { c } from 'ttag';

import { resumeMailImport, cancelMailImport } from 'proton-shared/lib/api/mailImport';

import { useApi, useLoading, useNotifications, useEventManager, useModals, useImporters } from '../../hooks';
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
    Href,
} from '../../components';

import { Importer, ImportMailStatus, ImportMailError } from './interfaces';
import ImportMailModal from './modals/ImportMailModal';

interface RowActionsProps {
    currentImport: Importer;
}

const RowActions = ({ currentImport }: RowActionsProps) => {
    const { ID, Active } = currentImport;
    const { State, ErrorCode } = Active || {};
    const api = useApi();
    const { call } = useEventManager();
    const { createModal } = useModals();
    const { createNotification } = useNotifications();
    const [loadingPrimaryAction, withLoadingPrimaryAction] = useLoading();
    const [loadingSecondaryAction, withLoadingSecondaryAction] = useLoading();

    const handleResume = async (importID: string) => {
        await api(resumeMailImport(importID));
        await call();
        createNotification({ text: c('Success').t`Import resumed` });
    };

    const handleReconnect = async () => {
        await createModal(<ImportMailModal currentImport={currentImport} />);
    };

    const handleCancel = async (importID: string) => {
        await new Promise<void>((resolve, reject) => {
            createModal(
                <ConfirmModal
                    onConfirm={resolve}
                    onClose={reject}
                    title={c('Confirm modal title').t`Import is incomplete!`}
                    cancel={c('Action').t`Continue import`}
                    confirm={<ErrorButton type="submit">{c('Action').t`Cancel import`}</ErrorButton>}
                >
                    <Alert type="error">
                        {c('Warning')
                            .t`If you cancel this import, you won't be able to resume it. Proton saved all progress in your account. Cancel anyway?`}
                    </Alert>
                </ConfirmModal>
            );
        });
        await api(cancelMailImport(importID));
        await call();
        createNotification({ text: c('Success').t`Import canceled` });
    };

    const list = [];

    if (State === ImportMailStatus.PAUSED) {
        const isAuthError = ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION;

        list.push({
            text: isAuthError ? c('Action').t`Reconnect` : c('Action').t`Resume`,
            onClick: () => {
                if (isAuthError) {
                    return withLoadingSecondaryAction(handleReconnect());
                }

                return withLoadingSecondaryAction(handleResume(ID));
            },
            loading: loadingSecondaryAction,
        });
    }

    list.push({
        text: c('Action').t`Cancel`,
        onClick: () => withLoadingPrimaryAction(handleCancel(ID)),
        loading: loadingPrimaryAction,
        disabled: State === ImportMailStatus.CANCELED,
    });

    return <DropdownActions key="actions" className="pm-button--small" list={list} />;
};

const sortByDate = (a: Importer, b: Importer) => {
    if (!a.Active || !b.Active) {
        return 0;
    }

    return a.Active.CreateTime > b.Active.CreateTime ? -1 : 1;
};

const CurrentImportsSection = () => {
    const [imports = [], importsLoading] = useImporters();

    const importsToDisplay = useMemo(() => imports.filter(({ Active }) => Active), [imports]);

    if (importsLoading) {
        return <Loader />;
    }

    if (!importsToDisplay.length) {
        return <Alert>{c('Info').t`No imports in progress.`}</Alert>;
    }

    const hasStoragePausedImports = importsToDisplay.some(({ Active }) => {
        return (
            Active &&
            Active.State === ImportMailStatus.PAUSED &&
            Active.ErrorCode === ImportMailError.ERROR_CODE_QUOTA_LIMIT
        );
    });

    const hasAuthPausedImports = importsToDisplay.some(({ Active }) => {
        return (
            Active &&
            Active.State === ImportMailStatus.PAUSED &&
            Active.ErrorCode === ImportMailError.ERROR_CODE_IMAP_CONNECTION
        );
    });

    const delayedImport = importsToDisplay.find(({ Active }) => {
        return Active?.State === ImportMailStatus.DELAYED;
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

    const bandwithLimitLink = (
        <Href
            key="bandwithLimitLink"
            url="https://protonmail.com/support/knowledge-base/import-assistant/#delayed-import"
        >
            {c('Import error link').t`bandwidth limit`}
        </Href>
    );

    // translator: the variable here is a HTML tag, here is the complete sentence: "Proton will try to resume the import as soon as your email provider resets your account’s bandwidth limit. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over."
    const bandwidthMessage = c('Info')
        .jt`Proton will try to resume the import as soon as your email provider resets your account’s ${bandwithLimitLink}. You don’t need to do anything. If you cancel your import, you won't be able to resume it and you will need to start over.`;

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
            {delayedImport && (
                <Alert type="warning">
                    {c('Info').t`Your import from ${delayedImport.Email} is temporarily delayed.`}
                    <br />
                    {bandwidthMessage}
                </Alert>
            )}
            <Table className="onmobile-hideTd3 onmobile-hideTd4 pm-simple-table--has-actions">
                <thead>
                    <tr>{headerCells}</tr>
                </thead>
                <TableBody>
                    {importsToDisplay.sort(sortByDate).map((currentImport) => {
                        const { Email, Active, ID } = currentImport;
                        const { State, ErrorCode, CreateTime = Date.now(), Mapping = [] } = Active || {};

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
                            const percentageValue = Number.isNaN(percentage) ? 0 : Math.floor(percentage);

                            let badge = <Badge>{c('Import status').t`${percentageValue}% processed`}</Badge>;

                            if (State === ImportMailStatus.PAUSED) {
                                badge = (
                                    <>
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
                                    </>
                                );
                            }

                            if (State === ImportMailStatus.QUEUED) {
                                badge = <Badge>{c('Import status').t`Started`}</Badge>;
                            }

                            if (State === ImportMailStatus.CANCELED) {
                                badge = <Badge type="error">{c('Import status').t`Canceling`}</Badge>;
                            }

                            if (State === ImportMailStatus.DELAYED) {
                                badge = (
                                    <>
                                        <Badge type="warning">{c('Import status').t`Delayed`}</Badge>
                                        <Tooltip
                                            title={c('Tooltip')
                                                .t`Your external account may have reached its 24-hour bandwidth limit. Proton will try to resume the import as soon as possible.`}
                                        >
                                            <Icon name="attention-plain" />
                                        </Tooltip>
                                    </>
                                );
                            }

                            return <div className="onmobile-aligncenter">{badge}</div>;
                        };

                        return (
                            <TableRow
                                key={ID}
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
                                    <RowActions key="actions" currentImport={currentImport} />,
                                ]}
                            />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default CurrentImportsSection;

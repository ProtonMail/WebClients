import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import moment from 'moment';
import {
    Button,
    ButtonGroup,
    ConfirmModal,
    Group,
    Alert,
    Block,
    Icon,
    Pagination,
    usePaginationAsync,
    SubTitle,
    useUserSettings,
    useApiResult,
    useApiWithoutResult,
    useModals
} from 'react-components';
import { queryLogs, clearLogs } from 'proton-shared/lib/api/logs';
import { updateLogAuth } from 'proton-shared/lib/api/settings';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { ELEMENTS_PER_PAGE, LOGS_STATE, AUTH_LOG_EVENTS } from 'proton-shared/lib/constants';

import LogsTable from './LogsTable';
import WipeLogsButton from './WipeLogsButton';

const { DISABLE, BASIC, ADVANCED } = LOGS_STATE;
const { LOGIN_FAILURE_PASSWORD, LOGIN_SUCCESS, LOGOUT, LOGIN_FAILURE_2FA, LOGIN_SUCCESS_AWAIT_2FA } = AUTH_LOG_EVENTS;

const getEventsI18N = () => ({
    [LOGIN_FAILURE_PASSWORD]: c('Log event').t`Login failure (password)`,
    [LOGIN_SUCCESS]: c('Log event').t`Login success`,
    [LOGOUT]: c('Log event').t`Logout`,
    [LOGIN_FAILURE_2FA]: c('Log event').t`Login failure (2FA)`,
    [LOGIN_SUCCESS_AWAIT_2FA]: c('Log event').t`Login failure (2FA)`
});

const LogsSection = () => {
    const i18n = getEventsI18N();
    const [settings] = useUserSettings();
    const { createModal } = useModals();
    const [logAuth, setLogAuth] = useState(settings.LogAuth);
    const { page, onNext, onPrevious, onSelect } = usePaginationAsync(1);
    const { result = {}, loading, request: requestQueryLogs } = useApiResult(
        () =>
            queryLogs({
                Page: page - 1,
                PageSize: ELEMENTS_PER_PAGE
            }),
        [page]
    );
    const { Logs: logs = [], Total: total = 0 } = result;
    const { request: requestClearLogs } = useApiWithoutResult(clearLogs);
    const { request: requestUpdateLogAuth } = useApiWithoutResult(updateLogAuth);

    const handleWipe = async () => {
        await requestClearLogs();
        await requestQueryLogs();
    };

    const handleDownload = () => {
        const data = logs.reduce(
            (acc, { Event, Time, IP }) => {
                acc.push(`${i18n[Event]},${moment(Time * 1000).toISOString()},${IP}`);
                return acc;
            },
            [['Event', 'Time', 'IP'].join(',')]
        );

        const filename = 'logs.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        downloadFile(blob, filename);
    };

    const confirmDisable = () => {
        return new Promise((resolve, reject) => {
            createModal(
                <ConfirmModal title={c('Title').t`Clear`} onConfirm={resolve} onClose={reject}>
                    <Alert type="warning">{c('Warning')
                        .t`By disabling the logs, you will also clear your entire logs history. Are you sure you want to disable the logs?`}</Alert>
                </ConfirmModal>
            );
        });
    };

    const handleLogAuth = (LogAuth) => async () => {
        if (total > 0 && LogAuth === DISABLE) {
            await confirmDisable();
        }
        await requestUpdateLogAuth(LogAuth);
        setLogAuth(LogAuth);
    };

    // Handle updates from the event manager
    useEffect(() => {
        setLogAuth(settings.LogAuth);
    }, [settings.LogAuth]);

    useEffect(() => {
        requestQueryLogs();
    }, [logAuth]);

    return (
        <>
            <SubTitle>{c('Title').t`Authentication logs`}</SubTitle>
            <Alert>{c('Info')
                .t`Logs includes authentication attempts for all Proton services that use your Proton credentials.`}</Alert>
            <Block className="flex flex-spacebetween">
                <div>
                    <Group className="mr1">
                        <ButtonGroup
                            className={logAuth === DISABLE ? 'is-active' : ''}
                            onClick={handleLogAuth(DISABLE)}
                        >{c('Log preference').t`Disabled`}</ButtonGroup>
                        <ButtonGroup className={logAuth === BASIC ? 'is-active' : ''} onClick={handleLogAuth(BASIC)}>{c(
                            'Log preference'
                        ).t`Basic`}</ButtonGroup>
                        <ButtonGroup
                            className={logAuth === ADVANCED ? 'is-active' : ''}
                            onClick={handleLogAuth(ADVANCED)}
                        >{c('Log preference').t`Advanced`}</ButtonGroup>
                    </Group>
                    <Button className="mr1" onClick={requestQueryLogs} title={c('Action').t`Refresh`}>
                        <Icon name="reload" />
                    </Button>
                    {logs.length ? <WipeLogsButton className="mr1" onWipe={handleWipe} /> : null}
                    {logs.length ? <Button onClick={handleDownload}>{c('Action').t`Download`}</Button> : null}
                </div>
                <Pagination
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect}
                    total={total}
                    page={page}
                    limit={ELEMENTS_PER_PAGE}
                />
            </Block>
            <LogsTable logs={logs} logAuth={logAuth} loading={loading} />
        </>
    );
};

export default LogsSection;

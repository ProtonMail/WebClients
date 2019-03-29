import React, { useState, useEffect } from 'react';
import { c } from 'ttag';
import dayjs from 'dayjs';
import {
    Button,
    ButtonGroup,
    Group,
    Alert,
    Block,
    Pagination,
    usePagination,
    SubTitle,
    useLoading,
    useUserSettings,
    useApi
} from 'react-components';
import { queryLogs, clearLogs } from 'proton-shared/lib/api/logs';
import { updateLogAuth } from 'proton-shared/lib/api/settings';
import downloadFile from 'proton-shared/lib/helpers/downloadFile';
import { ELEMENTS_PER_PAGE, LOGS_STATE } from 'proton-shared/lib/constants';

import LogsTable from './LogsTable';
import WipeLogsButton from './WipeLogsButton';

const EVENTS = {
    0: c('Log event').t`Login password failure`,
    1: c('Log event').t`Login success`,
    2: c('Log event').t`Logout`,
    3: c('Log event').t`2FA login failure`
};

const { DISABLE, BASIC, ADVANCED } = LOGS_STATE;

const LogsSection = () => {
    const api = useApi();
    const [settings, settingsLoading] = useUserSettings();
    const [logs, setLogs] = useState([]);
    const { loading, loaded, load } = useLoading(settingsLoading);
    const [logAuth, setLogAuth] = useState(settings.LogAuth);
    const { page, list, onNext, onPrevious, onSelect } = usePagination(logs, 1, ELEMENTS_PER_PAGE);

    const fetchLogs = async () => {
        try {
            load();
            const { Logs } = await api(queryLogs());
            setLogs(Logs);
            loaded();
        } catch (error) {
            loaded();
            throw error;
        }
    };

    const handleWipe = async () => {
        await api(clearLogs());
        setLogs([]);
    };

    const handleDownload = () => {
        const data = logs.reduce(
            (acc, { Event, Time, IP }) => {
                acc.push(`${EVENTS[Event]},${dayjs(Time * 1000).toISOString()},${IP}`);
                return acc;
            },
            [['Event', 'Time', 'IP'].join(',')]
        );

        const filename = 'logs.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        downloadFile(blob, filename);
    };

    const handleLogAuth = (LogAuth) => async () => {
        await api(updateLogAuth(LogAuth));
        setLogAuth(LogAuth);
    };

    // Handle updates from the event manager
    useEffect(() => {
        setLogAuth(settings.LogAuth);
    }, [settings.LogAuth]);

    useEffect(() => {
        fetchLogs();
    }, [logAuth]);

    return (
        <>
            <SubTitle>{c('Title').t`Authentication Logs`}</SubTitle>
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
                    <Button className="mr1" onClick={fetchLogs}>{c('Action').t`Refresh`}</Button>
                    {list.length ? <WipeLogsButton className="mr1" onWipe={handleWipe} /> : null}
                    {list.length ? <Button onClick={handleDownload}>{c('Action').t`Download`}</Button> : null}
                </div>
                <Pagination
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect}
                    total={logs.length}
                    page={page}
                    limit={ELEMENTS_PER_PAGE}
                />
            </Block>
            <LogsTable list={list} logAuth={logAuth} loading={loading} />
        </>
    );
};

export default LogsSection;

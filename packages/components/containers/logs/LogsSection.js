import React, { useState, useEffect, useContext } from 'react';
import { t } from 'ttag';
import dayjs from 'dayjs';
import { connect } from 'react-redux';
import { Button, ButtonGroup, Group, Alert, Block, Pagination, usePagination, SubTitle, useLoading } from 'react-components';
import { queryLogs, clearLogs } from 'proton-shared/lib/api/logs';
import { updateLogAuth } from 'proton-shared/lib/api/settings';
import ContextApi from 'proton-shared/lib/context/api';
import { ELEMENTS_PER_PAGE, LOGS_STATE } from 'proton-shared/lib/constants';

import LogsTable from './LogsTable';

const EVENTS = {
    0: t`Login password failure`,
    1: t`Login success`,
    2: t`Logout`,
    3: t`2FA login failure`
};

const { DISABLE, BASIC, ADVANCED } = LOGS_STATE;

const LogsSection = ({ settings }) => {
    const { api } = useContext(ContextApi);
    const [logs, setLogs] = useState([]);
    const {loading, loaded, load} = useLoading(settings.loading);
    const [logAuth, setLogAuth] = useState(settings.data.LogAuth);
    const {
        page,
        list,
        onNext,
        onPrevious,
        onSelect
    } = usePagination(logs, 1, ELEMENTS_PER_PAGE);

    const fetchLogs = async () => {
        load();
        const { Logs } = await api(queryLogs());
        setLogs(Logs);
        loaded();
    };

    const handleWipe = async () => {
        await api(clearLogs());
        setLogs([]);
    };

    const handleDownload = () => {
        const data = logs.reduce((acc, { Event, Time, IP }) => {
            acc.push(`${EVENTS[Event]},${dayjs(Time * 1000)},${IP}`);
            return acc;
        },
        [['Event', 'Time', 'IP'].join(',')]);

        const filename = 'logs.csv';
        const csvString = data.join('\r\n');
        const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });

        downloadFile(blob, filename);
    };

    const handleLogAuth = (LogAuth) => async () => {
        await api(updateLogAuth(LogAuth));
        setLogAuth(LogAuth);
    };

    useEffect(() => {
        fetchLogs();
    }, [logAuth]);

    return (
        <>
            <SubTitle>{t`Authentication Logs`}</SubTitle>
            <Alert>{t`Logs includes authentication attempts for all Proton services that use your Proton credentials.`}</Alert>
            <Block className="pt1 pb1">
                <Group>
                    <ButtonGroup className={logAuth === DISABLE ? 'is-active' : ''} onClick={handleLogAuth(DISABLE)}>{t`Disable`}</ButtonGroup>
                    <ButtonGroup className={logAuth === BASIC ? 'is-active' : ''} onClick={handleLogAuth(BASIC)}>{t`Basic`}</ButtonGroup>
                    <ButtonGroup className={logAuth === ADVANCED ? 'is-active' : ''} onClick={handleLogAuth(ADVANCED)}>{t`Advanced`}</ButtonGroup>
                </Group>
                <Button onClick={fetchLogs}>{t`Refresh`}</Button>
                {list.length ? <Button onClick={handleWipe}>{t`Wipe`}</Button> : null}
                {list.length ? <Button onClick={handleDownload}>{t`Download`}</Button> : null}
                <Pagination
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect}
                    total={logs.length}
                    page={page}
                    limit={ELEMENTS_PER_PAGE} />
            </Block>
            <LogsTable list={list} logAuth={logAuth} loading={loading} />
        </>
    );
};

const mapStateToProps = ({ settings }) => ({ settings });

export default connect(mapStateToProps)(LogsSection);
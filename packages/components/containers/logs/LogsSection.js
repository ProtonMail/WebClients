import React, { useState, useEffect, useContext } from 'react';
import { t } from 'ttag';
import dayjs from 'dayjs';
import { Button, ButtonGroup, Group, Table, TableHeader, TableBody, TableRow, Badge, Time, Alert, Block, Pagination, usePagination, SubTitle, useLoading } from 'react-components';
import { queryLogs, clearLogs } from 'proton-shared/lib/api/logs';
import { updateLogAuth } from 'proton-shared/lib/api/settings';
import ContextApi from 'proton-shared/lib/context/api';
import { ELEMENTS_PER_PAGE } from 'proton-shared/lib/constants';

const DISABLE = 0;
const BASIC = 1;
const ADVANCED = 2;

const EVENTS = {
    0: t`Login password failure`,
    1: t`Login success`,
    2: t`Logout`,
    3: t`2FA login failure`
};

const BADGE_TYPES = {
    0: 'error',
    1: 'success',
    2: 'error',
    3: 'error'
};

const LogsSection = () => {
    const { api } = useContext(ContextApi);
    const [logs, setLogs] = useState([]);
    const {loading, loaded} = useLoading();
    const [logAuth, setLogAuth] = useState(DISABLE);
    const {
        page,
        list,
        onNext,
        onPrevious,
        onSelect
    } = usePagination(logs, 1, ELEMENTS_PER_PAGE);

    const handleRefresh = () => fetchLogs();

    const fetchLogs = async () => {
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
                <Button onClick={handleRefresh}>{t`Refresh`}</Button>
                <Button onClick={handleWipe}>{t`Wipe`}</Button>
                <Button onClick={handleDownload}>{t`Download`}</Button>
                <Pagination
                    onNext={onNext}
                    onPrevious={onPrevious}
                    onSelect={onSelect}
                    total={logs.length}
                    page={page}
                    limit={ELEMENTS_PER_PAGE} />
            </Block>
            <Table>
                <TableHeader cells={[
                    t`Event`,
                    'IP',
                    t`Time`
                ]} />
                <TableBody loading={loading}>
                    {list.map(({ Time: time, Event, IP }, index) => {
                        const key = index.toString();

                        return (
                            <TableRow key={key} cells={[
                                <Badge key={key} type={BADGE_TYPES[Event]}>{EVENTS[Event]}</Badge>,
                                <code key={key}>{IP}</code>,
                                <Time key={key}>{time}</Time>
                            ]} />
                        );
                    })}
                </TableBody>
            </Table>
        </>
    );
};

export default LogsSection;
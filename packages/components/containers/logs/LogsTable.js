import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow, Time, Alert } from 'react-components';
import { LOGS_STATE } from 'proton-shared/lib/constants';

const { DISABLE, ADVANCED } = LOGS_STATE;

const EVENTS = {
    0: c('Logs status').t`Login password failure`,
    1: c('Logs status').t`Login success`,
    2: c('Logs status').t`Logout`,
    3: c('Logs status').t`2FA login failure`
};

const LogsTable = ({ list, logAuth, loading }) => {
    if (logAuth === DISABLE) {
        return (
            <Alert>{c('Info')
                .t`You can enable authentication logging to see when your account is accessed, and from which IP. We will record the IP address that accesses the account and the time, as well as failed attempts.`}</Alert>
        );
    }

    if (!loading && !list.length) {
        return <Alert>{c('Info').t`No logs yet`}</Alert>;
    }

    return (
        <Table>
            <TableHeader cells={[c('Header').t`Event`, logAuth === ADVANCED ? 'IP' : '', c('Header').t`Time`]} />
            <TableBody loading={loading} colSpan={3}>
                {list.map(({ Time: time, Event, IP }, index) => {
                    const key = index.toString();

                    return (
                        <TableRow
                            key={key}
                            cells={[
                                EVENTS[Event],
                                logAuth === ADVANCED ? IP : '',
                                <Time key={key} format="LLL">
                                    {time}
                                </Time>
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

LogsTable.propTypes = {
    list: PropTypes.array.isRequired,
    logAuth: PropTypes.number.isRequired,
    loading: PropTypes.bool.isRequired
};

export default LogsTable;

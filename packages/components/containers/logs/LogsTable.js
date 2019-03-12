import React from 'react';
import { c } from 'ttag';
import PropTypes from 'prop-types';
import { Table, TableHeader, TableBody, TableRow, Time, Alert, Icon } from 'react-components';
import { LOGS_STATE, AUTH_LOG_EVENTS } from 'proton-shared/lib/constants';

const { DISABLE, ADVANCED } = LOGS_STATE;
const { LOGIN_FAILURE_PASSWORD, LOGIN_SUCCESS, LOGOUT, LOGIN_FAILURE_2FA, LOGIN_SUCCESS_AWAIT_2FA } = AUTH_LOG_EVENTS;

const EVENTS = {
    [LOGIN_FAILURE_PASSWORD]: c('Logs status').t`Login failure (Password)`,
    [LOGIN_SUCCESS]: c('Logs status').t`Login success`,
    [LOGOUT]: c('Logs status').t`Logout`,
    [LOGIN_FAILURE_2FA]: c('Logs status').t`Login failure (2FA)`,
    [LOGIN_SUCCESS_AWAIT_2FA]: c('Logs status').t`Login failure (2FA)`
};

const ICONS = {
    [LOGIN_FAILURE_PASSWORD]: <Icon name="off" />,
    [LOGIN_SUCCESS]: <Icon name="on" />,
    [LOGOUT]: <Icon name="on" />,
    [LOGIN_FAILURE_2FA]: <Icon name="off" />,
    [LOGIN_SUCCESS_AWAIT_2FA]: <Icon name="off" />
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
                                <>
                                    {ICONS[Event]} {EVENTS[Event]}
                                </>,
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

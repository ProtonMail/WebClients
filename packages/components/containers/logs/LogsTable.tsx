import { c } from 'ttag';

import { AUTH_LOG_EVENTS, AuthLog } from '@proton/shared/lib/authlog';
import { SETTINGS_LOG_AUTH_STATE } from '@proton/shared/lib/interfaces';

import { Alert, Icon, Table, TableBody, TableCell, TableHeader, TableRow, Time } from '../../components';

const { ADVANCED, DISABLE } = SETTINGS_LOG_AUTH_STATE;

const getIcon = (event: AUTH_LOG_EVENTS) => {
    if (
        [
            AUTH_LOG_EVENTS.LOGIN_FAILURE_PASSWORD,
            AUTH_LOG_EVENTS.LOGIN_FAILURE_2FA,
            AUTH_LOG_EVENTS.REAUTH_FAILURE_2FA,
            AUTH_LOG_EVENTS.REAUTH_FAILURE_PASSWORD,
        ].includes(event)
    ) {
        return <Icon className="align-text-bottom color-danger" name="cross-circle-filled" />;
    }

    return <Icon className="align-text-bottom color-success" name="checkmark-circle-filled" />;
};

interface Props {
    logs: AuthLog[];
    logAuth: SETTINGS_LOG_AUTH_STATE;
    loading: boolean;
    error: boolean;
}

const LogsTable = ({ logs, logAuth, loading, error }: Props) => {
    if (logAuth === DISABLE) {
        return (
            <Alert className="mb1">{c('Info')
                .t`You can enable authentication sign in to see when your account is accessed, and from which IP. We will record the IP address that accesses the account and the time, as well as failed attempts.`}</Alert>
        );
    }

    if (!loading && !logs.length) {
        return <Alert className="mb1">{c('Info').t`No logs yet.`}</Alert>;
    }

    if (!loading && error) {
        return <Alert className="mb1" type="error">{c('Info').t`Failed to fetch logs.`}</Alert>;
    }

    return (
        <Table responsive="cards">
            <TableHeader>
                <tr>
                    <TableCell type="header">{c('Header').t`Event`}</TableCell>
                    {logAuth === ADVANCED && <TableCell type="header">{logAuth === ADVANCED ? 'IP' : ''}</TableCell>}
                    <TableCell className="text-right" type="header">{c('Header').t`App version`}</TableCell>
                    <TableCell className="text-right" type="header">{c('Header').t`Time`}</TableCell>
                </tr>
            </TableHeader>
            <TableBody loading={loading} colSpan={3}>
                {logs.map(({ Time: time, AppVersion, Event, Description, IP }, index) => {
                    const key = index.toString();

                    return (
                        <TableRow key={key}>
                            <TableCell label={c('Header').t`Event`}>
                                <div className="inline-flex">
                                    <span className="flex-item-noshrink mr-2">{getIcon(Event)}</span>
                                    <span className="flex-item-fluid">{Description}</span>
                                </div>
                            </TableCell>
                            {logAuth === ADVANCED && (
                                <TableCell label="IP">
                                    <code>{IP || '-'}</code>
                                </TableCell>
                            )}
                            <TableCell label={c('Header').t`App version`} className="on-tablet-text-left text-right">
                                <span className="flex-item-fluid">{AppVersion}</span>
                            </TableCell>
                            <TableCell label={c('Header').t`Time`} className="on-tablet-text-left text-right">
                                <Time key={key} format="PPp">
                                    {time}
                                </Time>
                            </TableCell>
                        </TableRow>
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default LogsTable;

import { c } from 'ttag';

import { AuthLog, AuthLogStatus, ProtectionType } from '@proton/shared/lib/authlog';
import { PROTON_SENTINEL_NAME } from '@proton/shared/lib/constants';
import { SETTINGS_LOG_AUTH_STATE, SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';

import { Alert, Icon, Table, TableBody, TableCell, TableHeader, TableRow, Time, Tooltip } from '../../components';

const { ADVANCED, DISABLE } = SETTINGS_LOG_AUTH_STATE;
const { ENABLED } = SETTINGS_PROTON_SENTINEL_STATE;

const getIcon = (status: AuthLogStatus) => {
    switch (status) {
        case AuthLogStatus.Attempt:
            return <Icon className="align-text-bottom color-warning" name="exclamation-circle-filled" />;
        case AuthLogStatus.Failure:
            return <Icon className="align-text-bottom color-danger" name="cross-circle-filled" />;
    }
    return <Icon className="align-text-bottom color-success" name="checkmark-circle-filled" />;
};

const getProtectionIcon = () => {
    return <Icon className="align-text-bottom color-primary" name="shield-filled" />;
};

type ProtectionProps = {
    protection?: ProtectionType | null;
    protectionDesc?: string | null;
};

const buildProtectionTooltips = () => (
    <Tooltip title={PROTON_SENTINEL_NAME} openDelay={0} closeDelay={150} longTapDelay={0}>
        {getProtectionIcon()}
    </Tooltip>
);

const getProtection = ({ protection, protectionDesc }: ProtectionProps) => {
    const protectionTooltip = protection && buildProtectionTooltips();
    if (protection === ProtectionType.OK) {
        return protectionTooltip;
    }
    return (
        <>
            <span className="flex-item-noshrink mr-2">{protectionTooltip}</span>
            <span className="flex-item-fluid">{protectionDesc || '-'}</span>
        </>
    );
};

interface Props {
    logs: AuthLog[];
    logAuth: SETTINGS_LOG_AUTH_STATE;
    protonSentinel: SETTINGS_PROTON_SENTINEL_STATE;
    loading: boolean;
    error: boolean;
}

const LogsTable = ({ logs, logAuth, protonSentinel, loading, error }: Props) => {
    if (logAuth === DISABLE) {
        return (
            <Alert className="mb-4">{c('Info')
                .t`You can enable authentication sign in to see when your account is accessed, and from which IP. We will record the IP address that accesses the account and the time, as well as failed attempts.`}</Alert>
        );
    }

    if (!loading && !logs.length) {
        return <Alert className="mb-4">{c('Info').t`No logs yet.`}</Alert>;
    }

    if (!loading && error) {
        return <Alert className="mb-4" type="error">{c('Info').t`Failed to fetch logs.`}</Alert>;
    }

    return (
        <Table responsive="cards">
            <TableHeader>
                <tr>
                    <TableCell type="header">{c('Header').t`Event`}</TableCell>
                    {logAuth === ADVANCED && <TableCell type="header">{logAuth === ADVANCED ? 'IP' : ''}</TableCell>}
                    {protonSentinel === ENABLED && (
                        <TableCell type="header">
                            {protonSentinel === ENABLED ? c('Header').t`Protection` : ''}
                        </TableCell>
                    )}
                    {protonSentinel === ENABLED && (
                        <TableCell type="header">{protonSentinel === ENABLED ? c('Header').t`Device` : ''}</TableCell>
                    )}
                    <TableCell className="text-right" type="header">{c('Header').t`App version`}</TableCell>
                    <TableCell className="text-right" type="header">{c('Header').t`Time`}</TableCell>
                </tr>
            </TableHeader>
            <TableBody loading={loading} colSpan={3}>
                {logs.map(
                    (
                        { Time: time, AppVersion, Description, IP, Device, ProtectionDesc, Protection, Status },
                        index
                    ) => {
                        const key = index.toString();

                        return (
                            <TableRow key={key}>
                                <TableCell label={c('Header').t`Event`}>
                                    <div className="inline-flex">
                                        <span className="flex-item-noshrink mr-2">{getIcon(Status)}</span>
                                        <span className="flex-item-fluid">{Description}</span>
                                    </div>
                                </TableCell>
                                {logAuth === ADVANCED && (
                                    <TableCell label="IP">
                                        <code>{IP || '-'}</code>
                                    </TableCell>
                                )}
                                {protonSentinel === ENABLED && (
                                    <TableCell label={c('Header').t`Protection`}>
                                        {getProtection({ protection: Protection, protectionDesc: ProtectionDesc })}
                                    </TableCell>
                                )}
                                {protonSentinel === ENABLED && (
                                    <TableCell label={c('Header').t`Device`}>
                                        <span className="flex-item-fluid">{Device || '-'}</span>
                                    </TableCell>
                                )}
                                <TableCell
                                    label={c('Header').t`App version`}
                                    className="on-tablet-text-left text-right"
                                >
                                    <span className="flex-item-fluid">{AppVersion}</span>
                                </TableCell>
                                <TableCell label={c('Header').t`Time`} className="on-tablet-text-left text-right">
                                    <Time key={key} format="PPp">
                                        {time}
                                    </Time>
                                </TableCell>
                            </TableRow>
                        );
                    }
                )}
            </TableBody>
        </Table>
    );
};

export default LogsTable;

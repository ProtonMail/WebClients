import { c } from 'ttag';

import Alert from '@proton/components/components/alert/Alert';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import type { AuthLog } from '@proton/shared/lib/authlog';
import { SETTINGS_LOG_AUTH_STATE, SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import emptySearchSvg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import isTruthy from '@proton/utils/isTruthy';

import { GenericErrorDisplay } from '../error/GenericError';
import AppVersionCell from './AppVersionCell';
import EventCell from './EventCell';
import IPCell from './IPCell';
import LocationCell from './LocationCell';
import ProtectionCell from './ProtectionCell';

const { ADVANCED, DISABLE } = SETTINGS_LOG_AUTH_STATE;
const { ENABLED } = SETTINGS_PROTON_SENTINEL_STATE;

interface Props {
    logs: AuthLog[];
    logAuth: SETTINGS_LOG_AUTH_STATE;
    protonSentinel: SETTINGS_PROTON_SENTINEL_STATE;
    loading: boolean;
    error: boolean;
}

const LogsTable = ({ logs = [], logAuth, protonSentinel, loading, error }: Props) => {
    const isAuthLogAdvanced = logAuth === ADVANCED;
    const isProtonSentinelEnabled = protonSentinel === ENABLED;

    if (logAuth === DISABLE) {
        return (
            <GenericErrorDisplay
                title={c('Title').t`There are no events for your account`}
                customImage={emptySearchSvg}
            >
                <div className="text-weak text-sm color-weak text-center">
                    {c('Error message').t`Ask your administrator to enable Account monitor.`}
                </div>
            </GenericErrorDisplay>
        );
    }

    if (!loading && !logs.length) {
        return <Alert className="mb-4">{c('Info').t`No logs yet.`}</Alert>;
    }

    if (!loading && error) {
        return <Alert className="mb-4" type="error">{c('Info').t`Failed to fetch logs.`}</Alert>;
    }

    const isUnavailableClass = (isAdvancedLogOnly = true) => {
        if ((isAdvancedLogOnly && !isAuthLogAdvanced) || !isProtonSentinelEnabled) {
            return 'bg-weak';
        }
        return '';
    };

    const headerCells = [
        {
            className: isAuthLogAdvanced || isProtonSentinelEnabled ? 'w-1/6' : 'w-1/5',
            header: c('Header').t`Event`,
        },
        {
            className: isAuthLogAdvanced ? 'w-1/6' : 'bg-weak w-custom',
            style: { '--w-custom': '5%' },
            header: 'IP',
            info: c('Tooltip').t`Origin IP address`,
        },
        {
            className: isUnavailableClass(),
            header: c('Header').t`Location`,
            info: c('Tooltip').t`User's approximate location (based on their IP address)`,
        },
        {
            className:
                isAuthLogAdvanced && isProtonSentinelEnabled
                    ? `${isUnavailableClass()}`
                    : `${isUnavailableClass()} w-1/10`,
            header: 'ISP',
            info: c('Tooltip').t`Origin Internet Service Provider (ISP)`,
        },
        {
            className: isUnavailableClass(false),
            header: c('Header').t`Protection`,
            info: c('Tooltip').t`Any protection applied to suspicious activity`,
        },
        {
            header: c('Header').t`Device`,
            info: c('Tooltip').t`Device name and app version`,
        },
    ].filter(isTruthy);

    return (
        <Table responsive="cards">
            <TableHeader>
                <TableRow>
                    {headerCells.map(({ className, header, info }) => (
                        <TableCell key={header} className={className} type="header">
                            <div className="flex items-center flex-nowrap">
                                {header}
                                {info && <Info className="ml-2 shrink-0" title={info} />}
                            </div>
                        </TableCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={headerCells.length}>
                {logs.map(
                    (
                        log,
                        index
                    ) => {
                        const key = index.toString();
                        const cells = [
                            {
                                label: c('Header').t`Event`,
                                className: 'text-left',
                                content: (
                                    <div className="flex flex-column my-1">
                                        <EventCell description={log.Description} status={log.Status} isB2B />
                                        <Time format="PPp" className="color-weak mt-2 ml-2">
                                            {log.Time}
                                        </Time>
                                    </div>
                                ),
                            },
                            {
                                label: 'IP',
                                className: isAuthLogAdvanced ? '' : 'bg-weak hidden lg:table-cell',
                                colSpan: (() => {
                                    if (!isAuthLogAdvanced) {
                                        if (isProtonSentinelEnabled) {
                                            return 3;
                                        }
                                        return 4;
                                    }
                                    return 1;
                                })(),
                                content: (
                                    <IPCell
                                        isAuthLogAdvanced={isAuthLogAdvanced}
                                        isProtonSentinelEnabled={isProtonSentinelEnabled}
                                        ip={log.IP}
                                        firstRow={index === 0}
                                    />
                                ),
                            },
                            isAuthLogAdvanced && {
                                label: c('Header').t`Location`,
                                className: `${isUnavailableClass()} ${
                                    !isAuthLogAdvanced || !isProtonSentinelEnabled ? 'text-left lg:text-center' : ''
                                }`,
                                colSpan: isProtonSentinelEnabled ? 1 : 3,
                                content: (
                                    <LocationCell
                                        isProtonSentinelEnabled={isProtonSentinelEnabled}
                                        location={log.Location}
                                        firstRow={index === 0}
                                    />
                                ),
                            },
                            isAuthLogAdvanced &&
                                isProtonSentinelEnabled && {
                                    label: 'ISP',
                                    content: <span className="flex-1">{log.InternetProvider || '-'}</span>,
                                },
                            isProtonSentinelEnabled && {
                                label: c('Header').t`Protection`,
                                content: <ProtectionCell protection={log.Protection} protectionDesc={log.ProtectionDesc} />,
                            },
                            {
                                label: c('Header').t`Device`,
                                content: (
                                    <div className="flex flex-column my-1">
                                        <span>{isProtonSentinelEnabled ? log.Device : '-'}</span>
                                        <AppVersionCell appVersion={log.AppVersion} />
                                    </div>
                                ),
                            },
                        ].filter(isTruthy);

                        return (
                            <TableRow key={key}>
                                {cells.map(({ label, className, colSpan, content }) => (
                                    <TableCell key={label} label={label} className={className} colSpan={colSpan}>
                                        {content}
                                    </TableCell>
                                ))}
                            </TableRow>
                        );
                    }
                )}
            </TableBody>
        </Table>
    );
};
export default LogsTable;

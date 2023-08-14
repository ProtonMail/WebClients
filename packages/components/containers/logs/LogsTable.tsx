import { c } from 'ttag';

import { AuthLog } from '@proton/shared/lib/authlog';
import { SETTINGS_LOG_AUTH_STATE, SETTINGS_PROTON_SENTINEL_STATE } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { Alert, Info, Table, TableBody, TableCell, TableHeader, TableRow, Time } from '../../components';
import { useFeature } from '../../hooks';
import { FeatureCode } from '../features';
import AppVersionCell from './AppVersionCell';
import DeviceCell from './DeviceCell';
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

const LogsTable = ({ logs, logAuth, protonSentinel, loading, error }: Props) => {
    const isAuthLogAdvanced = logAuth === ADVANCED;
    const isProtonSentinelEnabled = protonSentinel === ENABLED;
    const isProtonSentinelAuthLogUpsellEnabled =
        useFeature(FeatureCode.ProtonSentinelAuthLogUpsell).feature?.Value === true;

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

    const isUnavailableClass = (isAdvancedLogOnly = true) => {
        if ((isAdvancedLogOnly && !isAuthLogAdvanced) || !isProtonSentinelEnabled) {
            return 'bg-weak';
        }
        return '';
    };

    if (isProtonSentinelAuthLogUpsellEnabled) {
        const headerCells = [
            {
                className: 'text-left',
                header: c('Header').t`Time`,
            },
            {
                className: isAuthLogAdvanced || isProtonSentinelEnabled ? 'w-1/6' : 'w-1/5',
                header: c('Header').t`Event`,
            },
            {
                header: c('Header').t`App version`,
            },
            {
                className: isAuthLogAdvanced ? 'w-1/6' : 'bg-weak w5',
                header: 'IP',
            },
            {
                className: isUnavailableClass(),
                header: c('Header').t`Location`,
                info: c('Tooltip').t`An approximate location of the IP address`,
            },
            {
                className:
                    isAuthLogAdvanced && isProtonSentinelEnabled
                        ? `${isUnavailableClass()}`
                        : `${isUnavailableClass()} w10`,
                header: 'ISP',
                info: c('Tooltip').t`The Internet Service Provider of the IP address`,
            },
            {
                className: isProtonSentinelEnabled ? isUnavailableClass(false) : `${isUnavailableClass(false)} w-5`,
                header: c('Header').t`Device`,
                info: c('Tooltip').t`Device information such as operating system`,
            },
            {
                className: isUnavailableClass(false),
                header: c('Header').t`Protection`,
                info: c('Tooltip').t`Any protection applied to suspicious activity`,
            },
        ].filter(isTruthy);

        return (
            <Table responsive="cards">
                <TableHeader>
                    <TableRow>
                        {headerCells.map(({ className, header, info }) => (
                            <TableCell key={header} className={className} type="header">
                                <div className="flex flex-align-items-center flex-nowrap">
                                    {header}
                                    {info && <Info className="ml-2 flex-item-noshrink" title={info} />}
                                </div>
                            </TableCell>
                        ))}
                    </TableRow>
                </TableHeader>
                <TableBody loading={loading} colSpan={headerCells.length}>
                    {logs.map(
                        (
                            {
                                Time: time,
                                AppVersion,
                                Description,
                                IP,
                                InternetProvider,
                                Location,
                                Device,
                                ProtectionDesc,
                                Protection,
                                Status,
                            },
                            index
                        ) => {
                            const key = index.toString();
                            const cells = [
                                {
                                    label: c('Header').t`Time`,
                                    className: 'on-tablet-text-left text-left',
                                    content: (
                                        <Time key={key} format="PPp">
                                            {time}
                                        </Time>
                                    ),
                                },
                                {
                                    label: c('Header').t`Event`,
                                    content: <EventCell description={Description} status={Status} />,
                                },
                                {
                                    label: c('Header').t`App version`,
                                    content: <AppVersionCell appVersion={AppVersion} />,
                                },
                                {
                                    label: 'IP',
                                    className: isAuthLogAdvanced ? '' : 'bg-weak no-mobile no-tablet text-center',
                                    colSpan: (() => {
                                        if (!isAuthLogAdvanced) {
                                            if (isProtonSentinelEnabled) {
                                                return 3;
                                            }
                                            return 5;
                                        }
                                        return 1;
                                    })(),
                                    content: (
                                        <IPCell
                                            isAuthLogAdvanced={isAuthLogAdvanced}
                                            isProtonSentinelEnabled={isProtonSentinelEnabled}
                                            ip={IP}
                                            firstRow={index === 0}
                                        />
                                    ),
                                },
                                isAuthLogAdvanced && {
                                    label: c('Header').t`Location`,
                                    className: `${isUnavailableClass()} ${
                                        !isAuthLogAdvanced || !isProtonSentinelEnabled
                                            ? 'on-tablet-text-left text-center'
                                            : ''
                                    }`,
                                    colSpan: isProtonSentinelEnabled ? 1 : 4,
                                    content: (
                                        <LocationCell
                                            isProtonSentinelEnabled={isProtonSentinelEnabled}
                                            location={Location}
                                            firstRow={index === 0}
                                        />
                                    ),
                                },
                                isAuthLogAdvanced &&
                                    isProtonSentinelEnabled && {
                                        label: 'ISP',
                                        content: <span className="flex-item-fluid">{InternetProvider || '-'}</span>,
                                    },
                                isProtonSentinelEnabled && {
                                    label: c('Header').t`Device`,
                                    content: <DeviceCell device={Device} />,
                                },
                                isProtonSentinelEnabled && {
                                    label: c('Header').t`Protection`,
                                    content: <ProtectionCell protection={Protection} protectionDesc={ProtectionDesc} />,
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
    }
    const headerCells = [
        {
            header: c('Header').t`Event`,
        },
        logAuth === ADVANCED && {
            header: 'IP',
        },
        protonSentinel === ENABLED && {
            header: c('Header').t`Protection`,
        },
        protonSentinel === ENABLED && {
            header: c('Header').t`Device`,
        },
        {
            header: c('Header').t`App version`,
            className: 'text-right',
        },
        {
            header: c('Header').t`Time`,
            className: 'text-right',
        },
    ].filter(isTruthy);
    return (
        <Table responsive="cards">
            <TableHeader>
                <TableRow>
                    {headerCells.map(({ header, className }) => (
                        <TableCell key={header} type="header" className={className}>
                            {header}
                        </TableCell>
                    ))}
                </TableRow>
            </TableHeader>
            <TableBody loading={loading} colSpan={headerCells.length}>
                {logs.map(
                    (
                        { Time: time, AppVersion, Description, IP, Device, ProtectionDesc, Protection, Status },
                        index
                    ) => {
                        const key = index.toString();
                        const cells = [
                            {
                                label: c('Header').t`Event`,
                                content: <EventCell description={Description} status={Status} />,
                            },
                            logAuth === ADVANCED && {
                                label: 'IP',
                                content: <IPCell ip={IP} isAuthLogAdvanced={isAuthLogAdvanced} />,
                            },
                            protonSentinel === ENABLED && {
                                label: c('Header').t`Protection`,
                                content: <ProtectionCell protection={Protection} protectionDesc={ProtectionDesc} />,
                            },
                            protonSentinel === ENABLED && {
                                label: c('Header').t`Device`,
                                content: <DeviceCell device={Device} />,
                            },
                            {
                                label: c('Header').t`App version`,
                                className: 'text-on-tablet-text-left text-right',
                                content: <AppVersionCell appVersion={AppVersion} />,
                            },
                            {
                                label: c('Header').t`Time`,
                                className: 'text-on-tablet-text-left text-right',
                                content: <Time format="PPp">{time}</Time>,
                            },
                        ].filter(isTruthy);

                        return (
                            <TableRow key={key}>
                                {cells.map(({ label, content, className }) => (
                                    <TableCell key={label} label={label} className={className}>
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

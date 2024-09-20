import { c } from 'ttag';

import type { B2BAuthLog } from '@proton/shared/lib/authlog';

import { Info, Table, TableBody, TableCell, TableHeader, TableRow, Time } from '../../components';
import Alert from '../../components/alert/Alert';
import AppVersionCell from './AppVersionCell';
import DeviceCell from './DeviceCell';
import EventCell from './EventCell';
import ProtectionCell from './ProtectionCell';
import { UserCell } from './UserCell';

interface Props {
    logs: B2BAuthLog[];
    loading: boolean;
    error?: string;
}

const B2BAuthLogsTable = ({ logs, loading, error }: Props) => {
    if (!loading && error) {
        return (
            <Alert className="mb-4" type="error">
                {error}
            </Alert>
        );
    }

    if (!loading && !logs.length) {
        return <Alert className="mb-4">{c('Info').t`Search by an email address to begin`}</Alert>;
    }

    const headerCells = [
        {
            className: 'w-1/5',
            header: c('Header').t`User`,
        },
        {
            className: 'w-1/5',
            header: c('Header').t`Event`,
        },
        {
            header: c('Header').t`App version`,
        },
        {
            className: '',
            header: 'IP (ISP)',
            info: c('Tooltip').t`IP address (Internet Service Provider)`,
        },
        {
            className: '',
            header: c('Header').t`Location`,
            info: c('Tooltip').t`An approximate location of the IP address`,
        },
        {
            className: '',
            header: c('Header').t`Device`,
            info: c('Tooltip').t`Device information such as operating system`,
        },
        {
            className: 'w-1/10 text-center',
            header: c('Header').t`Protection`,
            info: c('Tooltip').t`Any protection applied to suspicious activity`,
        },
    ];

    return (
        <Table responsive="cards" className="color-weak">
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
                            User,
                        },
                        index
                    ) => {
                        const key = `${index}${User.Email}${Description}${IP}${time}`;
                        const cells = [
                            {
                                label: c('Header').t`User`,
                                content: <UserCell name={User.Name} email={User.Email} />,
                            },
                            {
                                label: c('Header').t`Event`,
                                content: (
                                    <div className="flex flex-column">
                                        <EventCell description={Description} status={Status} isB2B />
                                        <Time key={key} format="PPp" className="ml-6 tx-sm">
                                            {time}
                                        </Time>
                                    </div>
                                ),
                            },
                            {
                                label: c('Header').t`App version`,
                                content: <AppVersionCell appVersion={AppVersion} />,
                            },
                            {
                                label: 'IP',
                                content: (
                                    <div className="flex flex-column">
                                        <span className="">{IP || '-'}</span>
                                        {InternetProvider && <span className="">({InternetProvider})</span>}
                                    </div>
                                ),
                            },
                            {
                                label: c('Header').t`Location`,
                                content: <span className="flex-1">{Location || '-'}</span>,
                            },
                            {
                                label: c('Header').t`Device`,
                                content: <DeviceCell device={Device} />,
                            },
                            {
                                label: c('Header').t`Protection`,
                                className: 'text-center',
                                content: (
                                    <ProtectionCell protection={Protection} protectionDesc={ProtectionDesc} isB2B />
                                ),
                            },
                        ];

                        return (
                            <TableRow key={key}>
                                {cells.map(({ label, className, content }) => (
                                    <TableCell key={label} label={label} className={className} colSpan={1}>
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
export default B2BAuthLogsTable;

import { c } from 'ttag';

import { Avatar } from '@proton/atoms/Avatar/Avatar';
import Alert from '@proton/components/components/alert/Alert';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableHeader from '@proton/components/components/table/TableHeader';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import ProtectionCell from '@proton/components/containers/logs/ProtectionCell';
import type { B2BAuthLog } from '@proton/shared/lib/authlog';
import { getInitials } from '@proton/shared/lib/helpers/string';

import { NoEventsInfo } from '../b2bDashboard/NoEventsInfo';
import EventCell from './EventCell';

interface Props {
    logs: B2BAuthLog[];
    loading: boolean;
    error?: string | null;
    detailedMonitoring?: boolean;
    userSection?: boolean;
    onEmailOrIPClick?: (email: string) => void;
    onTimeClick?: (time: number) => void;
    isSentinel: boolean;
}

type HeaderCell = {
    className?: string;
    header: string;
    info?: string;
};

const B2BAuthLogsTable = ({ logs, loading, error, onEmailOrIPClick, onTimeClick, isSentinel }: Props) => {
    if (!loading && error) {
        return (
            <Alert className="mb-4" type="error">
                {error}
            </Alert>
        );
    }

    if (logs.length === 0) {
        return <NoEventsInfo />;
    }

    const headerCells: HeaderCell[] = [
        {
            className: 'w-1/5',
            header: c('Header').t`User`,
        },
        {
            className: 'w-1/5',
            header: c('Header').t`Event`,
        },
        {
            header: c('Header').t`Device`,
            info: c('Tooltip').t`Device name and app version`,
        },
        {
            className: '',
            header: 'IP and ISP',
            info: c('Tooltip').t`Origin IP address and Internet Service Provider (ISP)`,
        },
        {
            className: '',
            header: c('Header').t`Location`,
            info: c('Tooltip').t`User's approximate location (based on their IP address)`,
        },
        ...(isSentinel
            ? [
                  {
                      className: '',
                      header: c('Header').t`Protection`,
                      info: c('Tooltip').t`Any protection applied to suspicious activity`,
                  },
              ]
            : []),
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
                            Status,
                            User,
                            Protection,
                            ProtectionDesc,
                        },
                        index
                    ) => {
                        const key = `${index}${User.Email}${Description}${IP}${time}`;
                        const initials = getInitials(User.Name);

                        return (
                            <TableRow
                                key={key}
                                cells={[
                                    <div className="flex flex-row items-center my-2">
                                        <Avatar className="mr-2 p-5 content-center" color="weak">
                                            {initials}
                                        </Avatar>
                                        <div
                                            className="cursor-pointer w-2/3"
                                            onClick={() => onEmailOrIPClick?.(User.Email)}
                                        >
                                            <div title={User.Name} className="text-ellipsis">
                                                {User.Name}
                                            </div>
                                            <div title={User.Email} className="color-weak text-ellipsis mt-1">
                                                {User.Email}
                                            </div>
                                        </div>
                                    </div>,
                                    <div className="cursor-pointer">
                                        <div className="flex flex-column my-1">
                                            <EventCell description={Description} status={Status} isB2B />
                                            <Time
                                                format="PPp"
                                                className="color-weak mt-1 ml-2"
                                                onClick={() => onTimeClick?.(time)}
                                            >
                                                {time}
                                            </Time>
                                        </div>
                                    </div>,
                                    <div>
                                        <div className="color-norm text-ellipsis" title={Device || '-'}>
                                            {Device || '-'}
                                        </div>
                                        <div className="color-weak mt-1 text-ellipsis" title={AppVersion || '-'}>
                                            {AppVersion || '-'}
                                        </div>
                                    </div>,
                                    <div>
                                        <div className="color-norm text-ellipsis" title={IP}>
                                            {IP || '-'}
                                        </div>
                                        {InternetProvider && (
                                            <div className="color-weak mt-1 text-ellipsis" title={InternetProvider}>
                                                ({InternetProvider})
                                            </div>
                                        )}
                                    </div>,
                                    <div className="text-ellipsis color-norm" title={Location || '-'}>
                                        {Location || '-'}
                                    </div>,
                                    ...(isSentinel
                                        ? [
                                              <div className="color-norm">
                                                  <ProtectionCell
                                                      protection={Protection}
                                                      protectionDesc={ProtectionDesc}
                                                  ></ProtectionCell>
                                              </div>,
                                          ]
                                        : []),
                                ]}
                            />
                        );
                    }
                )}
            </TableBody>
        </Table>
    );
};
export default B2BAuthLogsTable;

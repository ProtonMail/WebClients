import { useState } from 'react';

import { getUnixTime, parseISO } from 'date-fns';
import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import { SortingTableHeader } from '@proton/components/components/table/SortingTableHeader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableRow from '@proton/components/components/table/TableRow';
import Time from '@proton/components/components/time/Time';
import { type CountryOptions, getLocalizedCountryByAbbr } from '@proton/payments';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';
import clsx from '@proton/utils/clsx';

import { getFlagSvg } from '../../vpn/flag';
import { getVPNEventColor, getVPNEventIcon } from './helpers';
import type { VPNEvent } from './interface';

interface Props {
    events: VPNEvent[];
    loading: boolean;
    onTimeClick: (time: string) => void;
    onEventClick: (event_type: string) => void;
    onEmailOrIpClick: (keyword: string) => void;
    onToggleSort: (direction: SORT_DIRECTION) => void;
    countryOptions: CountryOptions;
}

interface SortConfig {
    key: keyof VPNEvent;
    direction: SORT_DIRECTION;
}

const VPNEventsTable = ({
    events,
    loading,
    onTimeClick,
    onEventClick,
    onEmailOrIpClick,
    onToggleSort,

    countryOptions,
}: Props) => {
    const [sortConfig, setSortConfig] = useState<SortConfig>({
        key: 'time',
        direction: SORT_DIRECTION.DESC,
    });

    const toggleSort = () => {
        setSortConfig((prevSortConfig) => {
            const newDirection =
                prevSortConfig.direction === SORT_DIRECTION.ASC ? SORT_DIRECTION.DESC : SORT_DIRECTION.ASC;

            onToggleSort(newDirection);

            return { ...prevSortConfig, direction: newDirection };
        });
    };

    return (
        <Table responsive="cards">
            <SortingTableHeader
                config={sortConfig}
                onToggleSort={toggleSort}
                cells={[
                    { content: c('Title').t`User`, className: 'w-1/3' },
                    { key: 'time', content: c('TableHeader').t`Event`, sorting: true, className: 'w-1/4' },
                    { content: c('Title').t`Gateway`, className: 'w-1/6' },
                    { content: c('Title').t`Origin`, className: 'w-1/6' },
                    { content: c('Title').t`Device name`, className: 'w-1/6' },
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, eventType, eventTypeName, origin, gateway, deviceName }, index) => {
                    const { name, email } = user;
                    const { name: gatewayName, countryCode } = gateway;
                    const { location, ip, countryCode: originCountryCode } = origin;
                    const key = index;
                    const initials = name ? getInitials(name) : email.charAt(0);
                    const formattedTime = getUnixTime(parseISO(time));

                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <div className="flex flex-row items-center my-2">
                                    <Avatar className="mr-2" color="weak">
                                        {initials}
                                    </Avatar>
                                    <div
                                        className="flex flex-column cursor-pointer w-2/3"
                                        onClick={() => onEmailOrIpClick(email)}
                                    >
                                        <span title={name} className="text-ellipsis max-w-full">
                                            {name}
                                        </span>
                                        <span title={email} className="color-weak text-ellipsis max-w-full">
                                            {email}
                                        </span>
                                    </div>
                                </div>,
                                <div className="cursor-pointer">
                                    <div className="flex flex-row mb-1">
                                        <Icon
                                            name={getVPNEventIcon(eventType)}
                                            alt={eventType}
                                            className={clsx('mr-2', 'align-top', getVPNEventColor(eventType))}
                                        />
                                        <div className="flex flex-column">
                                            <span
                                                className={clsx('text-semibold', getVPNEventColor(eventType))}
                                                onClick={() => onEventClick(eventType)}
                                            >
                                                {eventTypeName}
                                            </span>
                                            <Time
                                                format="PPp"
                                                className="color-weak mt-1"
                                                onClick={() => onTimeClick(time)}
                                            >
                                                {formattedTime}
                                            </Time>
                                        </div>
                                    </div>
                                </div>,
                                <div className="flex flex-row">
                                    <img
                                        width={20}
                                        className="mr-2 mt-1 self-start"
                                        src={getFlagSvg(countryCode)}
                                        alt={countryCode}
                                        loading="lazy"
                                    />
                                    <div className="flex flex-column">
                                        <span>{getLocalizedCountryByAbbr(countryCode, countryOptions)}</span>
                                        <span className="color-weak mt-1">{gatewayName}</span>
                                    </div>
                                </div>,
                                <div className="flex flex-row flex-nowrap">
                                    <img
                                        width={20}
                                        className="mr-2 mt-1 self-start"
                                        src={getFlagSvg(originCountryCode)}
                                        alt={originCountryCode}
                                        loading="lazy"
                                    />
                                    <div className="flex flex-column mb-1">
                                        <span className="w-full text-ellipsis">
                                            {getLocalizedCountryByAbbr(location, countryOptions)}
                                        </span>
                                        <span
                                            onClick={() => onEmailOrIpClick(ip)}
                                            className="cursor-pointer color-weak mt-1 w-full text-ellipsis"
                                            title={ip}
                                        >
                                            {ip}
                                        </span>
                                    </div>
                                </div>,
                                <span>{deviceName}</span>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default VPNEventsTable;

import { useState } from 'react';

import { getUnixTime, parseISO } from 'date-fns';
import { c } from 'ttag';

import { Avatar } from '@proton/atoms';
import { SortingTableHeader } from '@proton/components/components/table/SortingTableHeader';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableRow from '@proton/components/components/table/TableRow';
import TimeComponent from '@proton/components/components/time/Time';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { getInitials } from '@proton/shared/lib/helpers/string';

import type { OrganizationEvent } from './interface';

interface Props {
    events: OrganizationEvent[];
    loading: boolean;
    onTimeClick: (time: string) => void;
    onEventClick: (event_type: string) => void;
    onEmailOrDetailsClick: (keyword: string) => void;
    onToggleSort: (direction: SORT_DIRECTION) => void;
}

interface SortConfig {
    key: keyof OrganizationEvent;
    direction: SORT_DIRECTION;
}

const OrganizationEventsTable = ({
    events,
    loading,
    onTimeClick,
    onEventClick,
    onEmailOrDetailsClick,
    onToggleSort,
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
                    { content: c('Title').t`User`, className: 'w-1/4' },
                    { key: 'time', content: c('TableHeader').t`Event`, sorting: true, className: 'w-1/3' },
                    { content: c('Title').t`Details`, className: 'w-1/3' },
                ]}
            />
            <TableBody colSpan={5} loading={loading}>
                {events.map(({ time, user, userName, eventType, eventTypeName, eventDetail }, index) => {
                    const key = index;
                    const formattedTime = getUnixTime(parseISO(time));

                    return (
                        <TableRow
                            key={key}
                            cells={[
                                <div className="flex flex-row items-center my-2">
                                    <Avatar className="mr-2" color="weak">
                                        {getInitials(userName)}
                                    </Avatar>
                                    <div
                                        className="flex flex-column cursor-pointer w-2/3"
                                        onClick={() => onEmailOrDetailsClick?.(user)}
                                    >
                                        <span title={userName} className="text-ellipsis max-w-full">
                                            {userName}
                                        </span>
                                        <span title={user} className="color-weak text-ellipsis max-w-full mt-1">
                                            {user}
                                        </span>
                                    </div>
                                </div>,
                                <div className="cursor-pointer">
                                    <div className="flex flex-row mb-1">
                                        <div className="flex flex-column">
                                            <span className="text-semibold" onClick={() => onEventClick(eventType)}>
                                                {eventTypeName}
                                            </span>
                                            <TimeComponent
                                                format="PPp"
                                                className="color-weak mt-1"
                                                onClick={() => onTimeClick(time)}
                                            >
                                                {formattedTime}
                                            </TimeComponent>
                                        </div>
                                    </div>
                                </div>,
                                <span>{eventDetail}</span>,
                            ]}
                        />
                    );
                })}
            </TableBody>
        </Table>
    );
};

export default OrganizationEventsTable;

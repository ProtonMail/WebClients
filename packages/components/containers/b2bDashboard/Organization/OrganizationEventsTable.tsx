import { useState } from 'react';

import { getUnixTime, parseISO } from 'date-fns';
import { c } from 'ttag';

import { UserIdentity } from '@proton/atoms/UserIdentity/UserIdentity';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { SortingTableHeader } from '../../../components/table/SortingTableHeader';
import Table from '../../../components/table/Table';
import TableBody from '../../../components/table/TableBody';
import TableRow from '../../../components/table/TableRow';
import TimeComponent from '../../../components/time/Time';
import { NoEventsInfo } from '../NoEventsInfo';
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

    if (events.length === 0) {
        return <NoEventsInfo />;
    }

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
                                <UserIdentity
                                    className="my-2"
                                    name={userName}
                                    email={user}
                                    onClick={() => onEmailOrDetailsClick(user)}
                                />,
                                <div className="cursor-pointer">
                                    <div className="flex flex-row mb-1">
                                        <div className="flex flex-column">
                                            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-static-element-interactions */}
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

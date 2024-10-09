import { useEffect, useState } from 'react';

import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import Icon from '@proton/components/components/icon/Icon';
import Pagination from '@proton/components/components/pagination/Pagination';
import usePaginationAsync from '@proton/components/components/pagination/usePaginationAsync';
import { useErrorHandler, useNotifications } from '@proton/components/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { getPassEventTypes, getPassLogs, getPassLogsDownload } from '@proton/shared/lib/api/b2blogs';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { B2BLogsQuery } from '@proton/shared/lib/interfaces/B2BLogs';
import noop from '@proton/utils/noop';

import SettingsSectionWide from '../../../containers/account/SettingsSectionWide';
import GenericError from '../../../containers/error/GenericError';
import { toCamelCase } from '../../credentialLeak/helpers';
import { FilterAndSortEventsBlock } from '../FilterAndSortEventBlock';
import PassEventsTable from './PassEventsTable';
import type { EventObject } from './helpers';
import {
    ALL_EVENTS_DEFAULT,
    PAGINATION_LIMIT,
    downloadPassEvents,
    getConnectionEvents,
    getLocalTimeStringFromDate,
    getSearchType,
} from './helpers';
import type { PassEvent } from './interface';

export interface FilterModel {
    eventType: string;
    start: Date | undefined;
    end: Date | undefined;
}
const initialFilter = {
    eventType: ALL_EVENTS_DEFAULT,
    start: undefined,
    end: undefined,
};

const getQueryParams = (filter: FilterModel, searchType: 'ip' | 'email' | 'empty', keyword: string) => {
    const { eventType, start, end } = filter;
    const Event = eventType === ALL_EVENTS_DEFAULT ? undefined : eventType;
    const StartTime = start ? getLocalTimeStringFromDate(start) : undefined;
    const EndTime = end ? getLocalTimeStringFromDate(endOfDay(end)) : undefined;
    const Email = searchType === 'email' ? keyword : undefined;
    const Ip = searchType === 'ip' ? keyword : undefined;
    return { Email, Ip, Event, StartTime, EndTime };
};

export const PassEvents = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const { page, onNext, onPrevious, onSelect, reset } = usePaginationAsync(1);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [filter, setFilter] = useState<FilterModel>(initialFilter);
    const [events, setEvents] = useState<PassEvent[]>([]);
    const [connectionEvents, setConnectionEvents] = useState<EventObject[]>([]);
    const [keyword, setKeyword] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [query, setQuery] = useState({});
    const [error, setError] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC);

    const fetchPassLogs = async (params: B2BLogsQuery) => {
        try {
            const { Items, Total } = await api(getPassLogs(params));
            const passEvents = toCamelCase(Items);
            setEvents(passEvents);
            setTotal(Total | 0);
        } catch (e) {
            handleError(e);
            setError(c('Error').t`Please try again in a few moments.`);
        }
    };

    const fetchPassConnectionEvents = async () => {
        const { Items } = await api<{ Items: EventObject[] }>(getPassEventTypes());
        const filteredItems = Items.filter((item: EventObject) => item.EventType !== '' && item.EventTypeName !== '');
        const sortedItems = filteredItems.sort((a: EventObject, b: EventObject) =>
            a.EventTypeName.localeCompare(b.EventTypeName)
        );
        setConnectionEvents(sortedItems);
    };

    useEffect(() => {
        fetchPassConnectionEvents();
    }, []);

    useEffect(() => {
        withLoading(
            fetchPassLogs({
                ...query,
                Page: page - 1,
                Sort: sortDirection === SORT_DIRECTION.DESC ? 'desc' : 'asc',
            }).catch(noop)
        );
    }, [page, query, sortDirection]);

    const handleSearchSubmit = () => {
        setError(null);
        const searchType = getSearchType(keyword);
        if (searchType === 'invalid') {
            createNotification({ text: c('Notification').t`Invalid input. Search an email or IP address.` });
            return;
        }
        const queryParams = getQueryParams(filter, searchType, keyword);
        setQuery({ ...queryParams });
        reset();
    };

    const handleDownloadClick = async () => {
        const response = await api({
            ...getPassLogsDownload({ ...query, Page: page - 1 }),
            output: 'raw',
        });

        const responseCode = response.headers.get('x-pm-code') || '';
        if (response.status === 429) {
            createNotification({
                text: c('Notification').t`Too many recent API requests`,
            });
        } else if (responseCode !== '1000') {
            createNotification({
                text: c('Notification').t`Number of records exceeds the download limit of 10000`,
            });
        }

        downloadPassEvents(response);
    };

    const handleStartDateChange = (start: Date | undefined) => {
        if (!start) {
            return;
        }
        if (!filter.end || isBefore(start, filter.end)) {
            setFilter({ ...filter, start });
        } else {
            setFilter({ ...filter, start, end: start });
        }
    };

    const handleEndDateChange = (end: Date | undefined) => {
        if (!end) {
            return;
        }
        if (!filter.start || isAfter(end, filter.start)) {
            setFilter({ ...filter, end });
        } else {
            setFilter({ ...filter, start: end, end });
        }
    };

    const handleSetEventType = (eventType: string) => {
        setFilter({ ...filter, eventType });
    };

    const handleClickableEvent = (eventType: string) => {
        setFilter({ ...filter, eventType });
        setQuery({ ...query, Event: eventType });
        reset();
    };

    const handleClickableTime = (time: string) => {
        const date = new Date(time);
        const start = getLocalTimeStringFromDate(startOfDay(date));
        const end = getLocalTimeStringFromDate(endOfDay(date));
        setFilter({ ...filter, start: date, end: date });
        setQuery({ ...query, StartTime: start, EndTime: end });
        reset();
    };

    const handleClickableEmailOrIP = (keyword: string) => {
        const searchType = getSearchType(keyword);

        if (searchType !== 'email' && searchType !== 'ip') {
            return;
        }

        const updatedQuery = { ...query, [searchType === 'email' ? 'Email' : 'Ip']: keyword };
        setQuery(updatedQuery);
        setKeyword(keyword);
        reset();
    };

    const handleToggleSort = (direction: SORT_DIRECTION) => {
        setSortDirection(direction);
    };

    const handleResetFilter = () => {
        setError(null);
        setFilter(initialFilter);
        setKeyword('');
        setQuery({});
        reset();
    };

    return (
        <SettingsSectionWide customWidth="90em">
            <FilterAndSortEventsBlock
                filter={filter}
                keyword={keyword}
                setKeyword={setKeyword}
                handleSetEventType={handleSetEventType}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
                eventTypesList={getConnectionEvents(connectionEvents) || []}
                handleSearchSubmit={handleSearchSubmit}
                handleDownloadClick={handleDownloadClick}
                resetFilter={handleResetFilter}
                hasFilterEvents={true}
            />
            <div className="content-center my-3">
                <Icon name="info-circle" size={4.5} className="mr-1 mb-1" />
                <span>{c('Title').t`Click a value in the table to use it as filter`}</span>
            </div>
            {error ? (
                <GenericError className="text-center">{error}</GenericError>
            ) : (
                <div className="flex justify-center">
                    <PassEventsTable
                        events={events}
                        loading={loading}
                        onEventClick={handleClickableEvent}
                        onTimeClick={handleClickableTime}
                        onEmailOrIpClick={handleClickableEmailOrIP}
                        onToggleSort={handleToggleSort}
                    />
                    <Pagination
                        page={page}
                        total={total}
                        limit={PAGINATION_LIMIT}
                        onSelect={onSelect}
                        onNext={onNext}
                        onPrevious={onPrevious}
                    />
                </div>
            )}
        </SettingsSectionWide>
    );
};

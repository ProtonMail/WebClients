import { useEffect, useState } from 'react';

import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Pagination, usePaginationAsync } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import { useApi, useErrorHandler, useNotifications } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { getPassLogs } from '@proton/shared/lib/api/b2blogs';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { B2BLogsQuery } from '@proton/shared/lib/interfaces/B2BLogs';
import noop from '@proton/utils/noop';

import SettingsSectionWide from '../../../containers/account/SettingsSectionWide';
import GenericError from '../../../containers/error/GenericError';
import { toCamelCase } from '../../credentialLeak/helpers';
import { FilterAndSortEventsBlock } from '../FilterAndSortEventBlock';
import PassEventsTable from './PassEventsTable';
import {
    ALL_EVENTS_DEFAULT,
    PAGINATION_LIMIT,
    getEventNameText,
    getLocalTimeStringFromDate,
    getSearchType,
    handlePassEventsDownload,
    uniquePassEventsArray,
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

    useEffect(() => {
        withLoading(
            fetchPassLogs({
                ...query,
                Page: page - 1,
                Size: PAGINATION_LIMIT,
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

    const handleDownloadClick = () => {
        handlePassEventsDownload(events);
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

    const getPassEventTypeText = (eventType: string) => {
        return getEventNameText(eventType);
    };

    return (
        <SettingsSectionWide>
            <FilterAndSortEventsBlock
                filter={filter}
                keyword={keyword}
                setKeyword={setKeyword}
                handleSetEventType={handleSetEventType}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
                eventTypesList={uniquePassEventsArray || []}
                handleSearchSubmit={handleSearchSubmit}
                getEventTypeText={getPassEventTypeText}
            />
            <div className="flex justify-space-between">
                <div className="content-center">
                    <Icon name="info-circle" size={4.5} className="mr-1 mb-1" />
                    <span>{c('Title').t`Click a value in the table to use it as filter`}</span>
                </div>
                <div className="flex flex-nowrap flex-row-reverse items-end items-center gap-2 mb-4">
                    <Button
                        shape="outline"
                        onClick={handleDownloadClick}
                        title={c('Action').t`Download`}
                        disabled={events.length === 0}
                    >
                        {c('Action').t`Download`}
                    </Button>
                    <Button
                        shape="outline"
                        onClick={handleResetFilter}
                        disabled={Object.keys(query).length === 0}
                        title={c('Action').t`Clear filter`}
                    >
                        {c('Action').t`Clear filters`}
                    </Button>
                    <Pagination
                        page={page}
                        total={total}
                        limit={PAGINATION_LIMIT}
                        onSelect={onSelect}
                        onNext={onNext}
                        onPrevious={onPrevious}
                    />
                </div>
            </div>
            {error ? (
                <GenericError className="text-center">{error}</GenericError>
            ) : (
                <PassEventsTable
                    events={events}
                    loading={loading}
                    handleEventClick={handleClickableEvent}
                    handleTimeClick={handleClickableTime}
                    handleEmailOrIpClick={handleClickableEmailOrIP}
                    handleToggleSort={handleToggleSort}
                />
            )}
        </SettingsSectionWide>
    );
};

import { useEffect, useState } from 'react';

import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Pagination, usePaginationAsync } from '@proton/components/components/pagination';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import {
    getOrganizationEventTypes,
    getOrganizationLogs,
    getOrganizationLogsDownload,
} from '@proton/shared/lib/api/b2bevents';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { B2BLogsQuery } from '@proton/shared/lib/interfaces/B2BLogs';
import noop from '@proton/utils/noop';

import { toCamelCase } from '../../credentialLeak/helpers';
import GenericError from '../../error/GenericError';
import { FilterAndSortEventsBlock } from '../FilterAndSortEventBlock';
import {
    ALL_EVENTS_DEFAULT,
    type EventObject,
    PAGINATION_LIMIT,
    getLocalTimeStringFromDate,
    getSearchType,
} from '../Pass/helpers';
import { downloadEvents, getConnectionEvents } from '../VPN/helpers';
import OrganizationEventsTable from './OrganizationEventsTable';
import type { OrganizationEvent } from './interface';

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

const getQueryParams = (filter: FilterModel, searchType: 'ip' | 'email' | 'search' | 'empty', keyword: string) => {
    const { eventType, start, end } = filter;
    const EventTypes = eventType === ALL_EVENTS_DEFAULT ? undefined : [eventType];
    const StartTime = start ? getLocalTimeStringFromDate(start) : undefined;
    const EndTime = end ? getLocalTimeStringFromDate(endOfDay(end)) : undefined;
    const Email = searchType === 'email' ? keyword : undefined;
    const Search = searchType === 'search' ? keyword : undefined;
    return { Email, Search, EventTypes, StartTime, EndTime };
};

export const OrganizationEvents = () => {
    const api = useApi();
    const handleError = useErrorHandler();

    const { page, onNext, onPrevious, onSelect, reset } = usePaginationAsync(1);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    const [filter, setFilter] = useState<FilterModel>(initialFilter);
    const [events, setEvents] = useState<OrganizationEvent[] | []>([]);
    const [orgEvents, setOrgEvents] = useState([]);
    const [keyword, setKeyword] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [query, setQuery] = useState({});
    const [error, setError] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC);
    const [reloadTrigger, setReloadTrigger] = useState(0);

    const fetchOrganizationEvents = async () => {
        const { Items } = await api(getOrganizationEventTypes());
        const filteredItems = Items.filter((item: EventObject) => item.EventType !== '' && item.EventTypeName !== '');
        const sortedItems = filteredItems.sort((a: EventObject, b: EventObject) =>
            a.EventTypeName.localeCompare(b.EventTypeName)
        );
        setOrgEvents(sortedItems);
    };

    useEffect(() => {
        fetchOrganizationEvents();
    }, []);

    const fetchOrganizationLogs = async (params: B2BLogsQuery) => {
        try {
            const { Items, Total } = await api(
                getOrganizationLogs({ ...params, Sort: sortDirection === SORT_DIRECTION.DESC ? 'desc' : 'asc' })
            );
            const events = toCamelCase(Items);

            setEvents(events);
            setTotal(Total | 0);
        } catch (e) {
            handleError(e);
            setError(c('Error').t`Please try again in a few moments.`);
        }
    };

    useEffect(() => {
        withLoading(fetchOrganizationLogs({ ...query, Page: page - 1 }).catch(noop));
    }, [page, query, sortDirection, reloadTrigger]);

    const handleSearchSubmit = () => {
        setError(null);
        const searchType = getSearchType(keyword);
        if (searchType === 'invalid') {
            createNotification({ text: c('Notification').t`Invalid input. Search an email or detail.` });
            return;
        }
        const queryParams = getQueryParams(filter, searchType, keyword);
        setQuery({ ...queryParams });
        reset();
    };

    const handleDownloadClick = async () => {
        const response = await api({
            ...getOrganizationLogsDownload({ ...query, Page: page - 1 }),
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

        downloadEvents(response);
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
        setQuery({ ...query, EventTypes: [eventType] });
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

    const handleClickableEmailOrDetails = (keyword: string) => {
        const searchType = getSearchType(keyword);

        if (searchType !== 'email' && searchType !== 'search') {
            return;
        }

        const updatedQuery = { ...query, [searchType === 'email' ? 'Email' : 'Search']: keyword };
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

    const triggerReload = () => {
        setReloadTrigger((prev) => prev + 1);
    };

    return (
        <SettingsSectionWide customWidth="90em">
            <div className="flex flex-row justify-space-between items-center my-4">
                <div className="flex *:min-size-auto flex-column gap-2 w-full">
                    <div className="flex flex-column flex-nowrap gap-1 px-4 py-4 rounded-lg border border-solid border-weak">
                        <span className="text-bold">{c('Info').t`Organization monitor`}</span>
                        <span className="color-weak">{c('Message')
                            .t`View changes to your organization and other administrator activities.`}</span>
                    </div>
                </div>
            </div>
            <FilterAndSortEventsBlock
                filter={filter}
                keyword={keyword}
                setKeyword={setKeyword}
                handleSetEventType={handleSetEventType}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
                handleDownloadClick={handleDownloadClick}
                eventTypesList={getConnectionEvents(orgEvents)}
                handleSearchSubmit={handleSearchSubmit}
                hasFilterEvents={true}
                hasRefreshEvents={true}
                loadingReload={loading}
                isOrganizationEvents={true}
                onReload={triggerReload}
                resetFilter={handleResetFilter}
            />
            {error ? (
                <GenericError className="text-center">{error}</GenericError>
            ) : (
                <>
                    <div className="flex justify-center">
                        <OrganizationEventsTable
                            events={events}
                            loading={loading}
                            onTimeClick={handleClickableTime}
                            onEventClick={handleClickableEvent}
                            onEmailOrDetailsClick={handleClickableEmailOrDetails}
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
                </>
            )}
        </SettingsSectionWide>
    );
};

import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { useUserSettings } from '@proton/account/userSettings/hooks';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { Pagination, usePaginationAsync } from '@proton/components/components/pagination';
import TimeIntl from '@proton/components/components/time/TimeIntl';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import useApi from '@proton/components/hooks/useApi';
import useErrorHandler from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useLoading } from '@proton/hooks';
import { getCountryOptions } from '@proton/payments';
import { getVPNLogDownload, getVPNLogs, getVpnEventTypes } from '@proton/shared/lib/api/b2bevents';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { B2BLogsQuery } from '@proton/shared/lib/interfaces/B2BLogs';
import noop from '@proton/utils/noop';

import { toCamelCase } from '../../credentialLeak/helpers';
import GenericError from '../../error/GenericError';
import { FilterAndSortEventsBlock } from '../FilterAndSortEventBlock';
import { ALL_EVENTS_DEFAULT, PAGINATION_LIMIT, getLocalTimeStringFromDate, getSearchType } from '../Pass/helpers';
import TogglingMonitoringModal from './TogglingMonitoringModal';
import VPNEventsTable from './VPNEventsTable';
import type { OrganizationSettings } from './api';
import { getMonitoringSetting, updateMonitoringSetting } from './api';
import type { Event as EventObject } from './helpers';
import { downloadEvents, getConnectionEvents } from './helpers';
import type { VPNEvent } from './interface';

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
    const Ip = searchType === 'ip' ? keyword : undefined;
    return { Email, Ip, EventTypes, StartTime, EndTime };
};

export const VPNEvents = () => {
    const api = useApi();
    const handleError = useErrorHandler();
    const [userSettings] = useUserSettings();

    const countryOptions = getCountryOptions(userSettings);

    const { page, onNext, onPrevious, onSelect, reset } = usePaginationAsync(1);
    const { createNotification } = useNotifications();
    const [loading, withLoading] = useLoading();
    // const [downloading, withDownloading] = useLoading();
    const [filter, setFilter] = useState<FilterModel>(initialFilter);
    const [events, setEvents] = useState<VPNEvent[] | []>([]);
    const [connectionEvents, setConnectionEvents] = useState([]);
    const [keyword, setKeyword] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [monitoringLoading, setMonitoringLoading] = useState<boolean>(true);
    const [monitoringEnabling, setMonitoringEnabling] = useState<boolean>(false);
    const [monitoring, setMonitoring] = useState<boolean>(false);
    const [monitoringLastChange, setMonitoringLastChange] = useState<number | null>(null);
    const [togglingMonitoringModalProps, setTogglingMonitoringModalOpen, togglingMonitoringModalRender] =
        useModalState();
    const [businessSettingsAvailable, setBusinessSettingsAvailable] = useState<boolean>(true);
    const [togglingMonitoringLoading, setTogglingMonitoringLoading] = useState<boolean>(false);
    const [togglingMonitoringInitializing, withMonitoringInitializing] = useLoading();
    const [query, setQuery] = useState({});
    const [error, setError] = useState<string | null>(null);
    const [sortDirection, setSortDirection] = useState(SORT_DIRECTION.DESC);

    const fetchVpnConnectionEvents = async () => {
        const { Items } = await api(getVpnEventTypes());
        const filteredItems = Items.filter((item: EventObject) => item.EventType !== '' && item.EventTypeName !== '');
        const sortedItems = filteredItems.sort((a: EventObject, b: EventObject) =>
            a.EventTypeName.localeCompare(b.EventTypeName)
        );
        sortedItems.forEach((item: { EventType: string; EventTypeName: string }) => {
            if (item.EventType === 'session_roaming') {
                item.EventTypeName = 'Network change';
            }
        });
        setConnectionEvents(sortedItems);
    };

    useEffect(() => {
        fetchVpnConnectionEvents();
    }, []);

    const fetchVPNLogs = async (params: B2BLogsQuery) => {
        try {
            const { Items, Total } = await api(
                getVPNLogs({ ...params, Sort: sortDirection === SORT_DIRECTION.DESC ? 'desc' : 'asc' })
            );
            const connectionEvents = toCamelCase(Items);
            connectionEvents.forEach((item: VPNEvent) => {
                if (item.eventType === 'session_roaming') {
                    item.eventTypeName = 'Network change';
                }
            });

            setEvents(connectionEvents);
            setTotal(Total | 0);
        } catch (e) {
            handleError(e);
            setError(c('Error').t`Please try again in a few moments.`);
        }
    };

    useEffect(() => {
        withLoading(fetchVPNLogs({ ...query, Page: page - 1 }).catch(noop));
    }, [page, query, sortDirection]);

    useEffect(() => {
        withMonitoringInitializing(
            new Promise(async (resolve) => {
                const timeout = setTimeout(() => {
                    setMonitoringLoading(false);
                    setMonitoringLastChange(null);
                    setBusinessSettingsAvailable(false);
                    resolve();
                }, 10_000);

                try {
                    const organizationSettings = await api<OrganizationSettings>(getMonitoringSetting());

                    if (organizationSettings.GatewayMonitoring) {
                        setMonitoring(true);
                    }

                    setMonitoringLastChange(organizationSettings.GatewayMonitoringLastUpdate || null);
                } catch (e) {
                    setBusinessSettingsAvailable(false);
                    setMonitoringLastChange(null);
                } finally {
                    setMonitoringLoading(false);
                    clearTimeout(timeout);
                    resolve();
                }
            })
        );
    }, []);

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
            ...getVPNLogDownload({ ...query, Page: page - 1 }),
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

    const setGatewayMonitoring = async () => {
        try {
            const enabling = !monitoring;
            const newSettings = await api<OrganizationSettings>(updateMonitoringSetting(enabling));

            setMonitoring(enabling);
            setMonitoringLastChange(newSettings.GatewayMonitoringLastUpdate || Date.now() / 1000);
            setTogglingMonitoringModalOpen(false);
            setTogglingMonitoringLoading(false);
        } catch (e) {
            setTogglingMonitoringModalOpen(false);

            throw e;
        } finally {
            setTogglingMonitoringLoading(false);
        }
    };

    const toggleMonitoring = async () => {
        if (togglingMonitoringLoading || togglingMonitoringInitializing) {
            return;
        }

        const enabling = !monitoring;
        setMonitoringEnabling(enabling);
        setTogglingMonitoringModalOpen(true);
    };

    const getMonitoringInfoText = (): string => {
        if (monitoringLoading) {
            return c('Info').t`Loading gateways monitoring current status.`;
        }

        if (!businessSettingsAvailable) {
            return c('Info').t`Unable to check gateways monitoring current status.`;
        }

        return c('Info').t`Gateway monitor`;
    };

    const getMonitoringLastChangeText = (): ReactNode => {
        if (!monitoringLastChange) {
            return <>&nbsp;</>;
        }

        const formattedDateAndTime = (
            <TimeIntl
                options={{
                    year: 'numeric',
                    day: 'numeric',
                    month: 'short',
                    hour: 'numeric',
                    minute: 'numeric',
                }}
            >
                {monitoringLastChange}
            </TimeIntl>
        );

        const boldValue = <span className="text-semibold">{formattedDateAndTime}</span>;

        const timeOfEvent = monitoring
            ? /** translator: formattedDateAndTime be like "25 Sep 2023, 15:37" or just "15:37" if it's on the same day */ c(
                  'Info'
              ).jt`Enabled on ${boldValue}`
            : /** translator: formattedDateAndTime be like "25 Sep 2023, 15:37" or just "15:37" if it's on the same day */ c(
                  'Info'
              ).jt`Disabled on ${boldValue}`;

        return (
            <div className="flex flex-row items-center">
                <Icon name="eye" />
                <span className="ml-2">{timeOfEvent}</span>
            </div>
        );
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
            {togglingMonitoringModalRender && (
                <TogglingMonitoringModal
                    {...togglingMonitoringModalProps}
                    enabling={monitoringEnabling}
                    onChange={setGatewayMonitoring}
                />
            )}
            <div className="mb-8 flex *:min-size-auto flex-column justify-space-between sm:flex-row gap-2 p-4 rounded-lg border border-solid border-weak items-center">
                <div className="flex flex-row flex-nowrap items-center gap-2">
                    <Toggle
                        loading={togglingMonitoringLoading || togglingMonitoringInitializing}
                        checked={monitoring}
                        disabled={
                            !togglingMonitoringLoading && !togglingMonitoringInitializing && !businessSettingsAvailable
                        }
                        onChange={toggleMonitoring}
                    />
                    <div className="flex flex-column gap-1">
                        <span className="text-bold">{getMonitoringInfoText()}</span>
                        <span className="color-weak">{c('Info')
                            .t`View VPN session details for your organization.`}</span>
                    </div>
                </div>
                <span
                    className="block color-weak py-0 px-1 border rounded border-weak bg-weak text-md flex items-center h-custom"
                    style={{ '--h-custom': '2rem' }}
                >
                    {getMonitoringLastChangeText()}
                </span>
            </div>

            <FilterAndSortEventsBlock
                filter={filter}
                keyword={keyword}
                setKeyword={setKeyword}
                handleSetEventType={handleSetEventType}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
                handleDownloadClick={handleDownloadClick}
                eventTypesList={getConnectionEvents(connectionEvents)}
                handleSearchSubmit={handleSearchSubmit}
                hasFilterEvents={true}
                resetFilter={handleResetFilter}
            />
            {error ? (
                <GenericError className="text-center">{error}</GenericError>
            ) : (
                <>
                    <div className="flex justify-center">
                        <VPNEventsTable
                            events={events}
                            loading={loading}
                            onTimeClick={handleClickableTime}
                            onEventClick={handleClickableEvent}
                            onEmailOrIpClick={handleClickableEmailOrIP}
                            onToggleSort={handleToggleSort}
                            countryOptions={countryOptions}
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

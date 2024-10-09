import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';

import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Pagination, usePaginationAsync } from '@proton/components';
import Icon from '@proton/components/components/icon/Icon';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import TimeIntl from '@proton/components/components/time/TimeIntl';
import Toggle from '@proton/components/components/toggle/Toggle';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useErrorHandler, useNotifications, useUserSettings } from '@proton/components/hooks';
import useApi from '@proton/components/hooks/useApi';
import { useLoading } from '@proton/hooks';
import { getVPNLogDownload, getVPNLogs, getVpnEventTypes } from '@proton/shared/lib/api/b2blogs';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import type { B2BLogsQuery } from '@proton/shared/lib/interfaces/B2BLogs';
import noop from '@proton/utils/noop';

import { getCountryOptions } from '../../../helpers/countries';
import { toCamelCase } from '../../credentialLeak/helpers';
import GenericError from '../../error/GenericError';
import { FilterAndSortEventsBlock } from '../FilterAndSortEventBlock';
import { ALL_EVENTS_DEFAULT, PAGINATION_LIMIT, getLocalTimeStringFromDate, getSearchType } from '../Pass/helpers';
import TogglingMonitoringModal from './TogglingMonitoringModal';
import VPNEventsTable from './VPNEventsTable';
import type { OrganizationSettings } from './api';
import { getMonitoringSetting, updateMonitoringSetting } from './api';
import type { Event as EventObject } from './helpers';
import { downloadVPNEvents, getConnectionEvents } from './helpers';
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

const getQueryParams = (filter: FilterModel, searchType: 'ip' | 'email' | 'empty', keyword: string) => {
    const { eventType, start, end } = filter;
    const Event = eventType === ALL_EVENTS_DEFAULT ? undefined : eventType;
    const StartTime = start ? getLocalTimeStringFromDate(start) : undefined;
    const EndTime = end ? getLocalTimeStringFromDate(endOfDay(end)) : undefined;
    const Email = searchType === 'email' ? keyword : undefined;
    const Ip = searchType === 'ip' ? keyword : undefined;
    return { Email, Ip, Event, StartTime, EndTime };
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

        downloadVPNEvents(response);
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

    const toggleMonitoring = async () => {
        if (togglingMonitoringLoading || togglingMonitoringInitializing) {
            return;
        }

        const enabling = !monitoring;
        setMonitoringEnabling(enabling);
        setTogglingMonitoringModalOpen(true);
        setTogglingMonitoringLoading(true);

        try {
            const newSettings = await api<OrganizationSettings>(updateMonitoringSetting(enabling));

            setMonitoring(enabling);
            setMonitoringLastChange(newSettings.GatewayMonitoringLastUpdate || Date.now() / 1000);
        } catch (e) {
            setTogglingMonitoringModalOpen(false);

            throw e;
        } finally {
            setTogglingMonitoringLoading(false);
        }
    };

    const getMonitoringInfoText = (): string => {
        if (monitoringLoading) {
            return c('Info').t`Loading gateways monitoring current status.`;
        }

        if (!businessSettingsAvailable) {
            return c('Info').t`Unable to check gateways monitoring current status.`;
        }

        return monitoring
            ? c('Info').t`Gateways monitoring is enabled.`
            : c('Info').t`Gateways monitoring is disabled.`;
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

        return monitoring
            ? /** translator: formattedDateAndTime be like "25 Sep 2023, 15:37" or just "15:37" if it's on the same day */ c(
                  'Info'
              ).jt`Enabled since ${formattedDateAndTime}`
            : /** translator: formattedDateAndTime be like "25 Sep 2023, 15:37" or just "15:37" if it's on the same day */ c(
                  'Info'
              ).jt`Disabled since ${formattedDateAndTime}`;
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
                <TogglingMonitoringModal {...togglingMonitoringModalProps} enabling={monitoringEnabling} />
            )}
            <div className="mb-8 flex *:min-size-auto flex-column sm:flex-row gap-2">
                <div className="flex-1">
                    <Toggle
                        loading={togglingMonitoringLoading || togglingMonitoringInitializing}
                        checked={monitoring}
                        disabled={
                            !togglingMonitoringLoading && !togglingMonitoringInitializing && !businessSettingsAvailable
                        }
                        onChange={toggleMonitoring}
                    >
                        <span className="pl-2">
                            {getBoldFormattedText(getMonitoringInfoText())}
                            <span className="block color-weak text-sm">{getMonitoringLastChangeText()}</span>
                        </span>
                    </Toggle>
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
                eventTypesList={getConnectionEvents(connectionEvents)}
                handleSearchSubmit={handleSearchSubmit}
                hasFilterEvents={true}
                resetFilter={handleResetFilter}
            />
            {error ? (
                <GenericError className="text-center">{error}</GenericError>
            ) : (
                <>
                    <div className="content-center my-3">
                        <Icon name="info-circle" size={4.5} className="mr-1 mb-1" />
                        <span>{c('Title').t`Click a value in the table to use it as filter`}</span>
                    </div>
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

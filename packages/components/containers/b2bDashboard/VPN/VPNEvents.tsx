import type { ReactNode} from 'react';
import { useEffect, useState } from 'react';

import { endOfDay, isAfter, isBefore, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import type { IconName } from '@proton/components/components';
import {
    Block,
    Icon,
    Pagination,
    usePaginationAsync,
    useModalState,
} from '@proton/components/components';
import { useApi, useErrorHandler, useNotifications } from '@proton/components/hooks';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import { useUserSettings } from '@proton/components/hooks';
import { useLoading } from '@proton/hooks';
import { getVPNLogs } from '@proton/shared/lib/api/b2blogs';
import type { B2BLogsQuery } from '@proton/shared/lib/interfaces/B2BLogs';
import clsx from '@proton/utils/clsx';
import noop from '@proton/utils/noop';

import { GenericError, SettingsSectionWide } from '../..';
import { getCountryOptions } from '../../../helpers/countries';
import { toCamelCase } from '../../credentialLeak/helpers';
import FilterAndSortEventsBlock from '../FilterAndSortEventBlock';
import { ALL_EVENTS_DEFAULT, PAGINATION_LIMIT, getLocalTimeStringFromDate, getSearchType } from '../Pass/helpers';
import VPNEventsTable from './VPNEventsTable';
import { downloadVPNEvents, getVPNEventNameText, uniqueVPNEventsArray } from './helpers';
import type { VPNEvent } from './interface';
import TogglingMonitoringModal from './TogglingMonitoringModal';
import type { OrganizationSettings } from './api';
import { getMonitoringSetting, updateMonitoringSetting } from './api';

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

const PreReq = ({ data, action, icon, className }: { data: ReactNode; action: ReactNode, icon: IconName, className?: string }) => {
    return (
        <div className="rounded border bg-weak p-4 flex justify-space-between gap-2 items-center mb-10 lg:flex-nowrap">
            <div className={clsx(['flex gap-2 items-start flex-nowrap', className || ''])}>
                <Icon name={icon} className="shrink-0" size={5} />
                <p className="m-0">{data}</p>
            </div>
            {action}
        </div>
    );
};

const VPNEvents = () => {
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
    const [keyword, setKeyword] = useState<string>('');
    const [total, setTotal] = useState<number>(0);
    const [monitoringLoading, setMonitoringLoading] = useState<boolean>(true);
    const [monitoringEnabling, setMonitoringEnabling] = useState<boolean>(false);
    const [monitoring, setMonitoring] = useState<boolean>(false);
    const [togglingMonitoringModalProps, setTogglingMonitoringModalOpen, togglingMonitoringModalRender] = useModalState();
    const [businessSettingsAvailable, setBusinessSettingsAvailable] = useState<boolean>(true);
    const [togglingMonitoringLoading, setTogglingMonitoringLoading] = useState<boolean>(false);
    const [togglingMonitoringInitializing, withMonitoringInitializing] = useLoading();
    const [query, setQuery] = useState({});
    const [error, setError] = useState<string | null>(null);


    const fetchVPNLogs = async (params: B2BLogsQuery) => {
        try {
            const { Items, Total } = await api(getVPNLogs(params));
            const connectionEvents = toCamelCase(Items);
            setEvents(connectionEvents);
            setTotal(Total | 0);
        } catch (e) {
            handleError(e);
            setError(c('Error').t`Please try again in a few moments.`);
        }
    };

    useEffect(() => {
        withLoading(fetchVPNLogs({ ...query, Page: page - 1, Size: PAGINATION_LIMIT }).catch(noop));
    }, [page, query]);

    useEffect(() => {
        withMonitoringInitializing(new Promise(async resolve => {
            const timeout = setTimeout(() => {
                setMonitoringLoading(false);
                setBusinessSettingsAvailable(false);
                resolve();
            }, 10_000);

            try {
                if ((await api<OrganizationSettings>(getMonitoringSetting())).GatewayMonitoring) {
                    setMonitoring(true);
                }
            } catch (e) {
                setBusinessSettingsAvailable(false);
            } finally {
                setMonitoringLoading(false);
                clearTimeout(timeout);
                resolve();
            }
        }));
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

    const handleDownloadClick = () => {
        downloadVPNEvents(events);
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

    const handleResetFilter = () => {
        setError(null);
        setFilter(initialFilter);
        setKeyword('');
        setQuery({});
        reset();
    };

    const getVPNEventTypeText = (eventType: string) => {
        return getVPNEventNameText(eventType);
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
            await api(updateMonitoringSetting(enabling));

            setMonitoring(enabling);
        } catch (e) {
            setTogglingMonitoringModalOpen(false);

            throw e;
        } finally {
            setTogglingMonitoringLoading(false);
        }
    };

    const getMonitoringToggleButton = (): ReactNode|undefined => {
        if (monitoringLoading) {
            return <Button
                loading={true}
                color="weak"
                shape="solid"
                size="small"
                className="shrink-0"
            >-</Button>;
        }

        if (!businessSettingsAvailable) {
            return undefined;
        }

        return <Button
            loading={togglingMonitoringLoading || togglingMonitoringInitializing}
            color={monitoring ? 'weak' : 'norm'}
            shape="solid"
            size="small"
            className="shrink-0"
            onClick={toggleMonitoring}
        >
            {monitoring ? c('Action').t`Turn off` : c('Action').t`Turn on`}
        </Button>;
    }

    const getMonitoringInfoIcon = (): IconName => {
        if (monitoringLoading) {
            return 'circle';
        }

        if (!businessSettingsAvailable) {
            return 'bug';
        }

        return monitoring ? 'checkmark-circle-filled' : 'info-circle';
    }

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
    }

    return (
        <SettingsSectionWide>
            {togglingMonitoringModalRender && <TogglingMonitoringModal
                {...togglingMonitoringModalProps}
                enabling={monitoringEnabling}
            />}
            <PreReq
                icon={getMonitoringInfoIcon()}
                className={monitoring ? 'color-primary' : 'color-weak'}
                data={getBoldFormattedText(getMonitoringInfoText())}
                action={getMonitoringToggleButton()}
            />
            <FilterAndSortEventsBlock
                filter={filter}
                keyword={keyword}
                setKeyword={setKeyword}
                handleSetEventType={handleSetEventType}
                handleStartDateChange={handleStartDateChange}
                handleEndDateChange={handleEndDateChange}
                eventTypesList={uniqueVPNEventsArray || []}
                handleSearchSubmit={handleSearchSubmit}
                getEventTypeText={getVPNEventTypeText}
            />
            <Block className="flex flex-nowrap flex-row-reverse items-end items-center gap-2">
                <Button shape="outline" onClick={handleDownloadClick} title={c('Action').t`Download`}>
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
            </Block>
            {error ? (
                <GenericError className="text-center">{error}</GenericError>
            ) : (
                <VPNEventsTable
                    events={events}
                    loading={loading}
                    handleEventClick={handleClickableEvent}
                    handleTimeClick={handleClickableTime}
                    getEventTypeText={getVPNEventNameText}
                    countryOptions={countryOptions}
                />
            )}
        </SettingsSectionWide>
    );
};

export default VPNEvents;

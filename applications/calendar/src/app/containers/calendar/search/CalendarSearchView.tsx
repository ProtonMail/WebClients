import type { MouseEvent, MutableRefObject } from 'react';
import React, { useCallback, useEffect, useMemo, useState } from 'react';

import { getYear, isSameYear, startOfDay } from 'date-fns';
import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Icon, IllustrationPlaceholder, SkeletonLoader } from '@proton/components';
import { CALENDAR_DISPLAY } from '@proton/shared/lib/calendar/constants';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import noResultsImg from '@proton/styles/assets/img/illustrations/empty-search.svg';
import noop from '@proton/utils/noop';
import unique from '@proton/utils/unique';

import type { OpenedMailEvent } from '../../../hooks/useGetOpenedMailEvents';
import getCalendarEventsCache from '../eventStore/cache/getCalendarEventsCache';
import upsertCalendarApiEventWithoutBlob from '../eventStore/cache/upsertCalendarApiEventWithoutBlobs';
import type { CalendarsEventsCache, EventReadResult } from '../eventStore/interface';
import useCalendarsEventsReader from '../eventStore/useCalendarsEventsReader';
import type { CalendarViewEvent, InteractiveState } from '../interface';
import { useCalendarSearch } from './CalendarSearchProvider';
import CalendarSearchViewDayEvents from './CalendarSearchViewDayEvents';
import CalendarSearchViewYearSeparator from './CalendarSearchViewYearSeparator';
import type { VisualSearchItem } from './interface';
import {
    expandAndOrderItems,
    fillEmptyToday,
    getCalendarViewEventWithMetadata,
    getVisualSearchItems,
    groupItemsByDay,
} from './searchHelpers';
import { useCalendarSearchPagination } from './useCalendarSearchPagination';

import './SearchView.scss';

const formatListWithAnd = (items: string[]) => {
    if (items.length <= 1) {
        return <i className="text-nowrap">{items[0]}</i>;
    }

    const firstItems = items.slice(0, items.length - 1).reduce((acc: React.JSX.Element[], cur: string) => {
        return acc.length
            ? [...acc, <span>{', '}</span>, <i className="text-nowrap">{cur}</i>]
            : [...acc, <i className="text-nowrap">{cur}</i>];
    }, []);

    const lastItem = <i className="text-nowrap">{items[items.length - 1]}</i>;

    // translator: This is the list of the calendar with visibility turned off, used to warn the user when he gets no result on search but has some in hidden calendars
    return c('Info').jt`${firstItems} and ${lastItem}`;
};

interface Props {
    calendars: VisualCalendar[];
    calendarsEventsCacheRef: MutableRefObject<CalendarsEventsCache>;
    tzid: string;
    date: Date;
    now: Date;
    setTargetEventRef: (targetEvent: HTMLElement) => void;
    setInteractiveData: (state: InteractiveState) => void;
    getOpenedMailEvents: () => OpenedMailEvent[];
}

const CalendarSearchView = ({
    calendars,
    calendarsEventsCacheRef,
    tzid,
    date,
    now,
    setTargetEventRef,
    setInteractiveData,
    getOpenedMailEvents,
}: Props) => {
    const [closestToDateRef, setClosestToDateRef] = useState<HTMLDivElement | null>(null);

    const { items, recurrenceIDsMap, loading } = useCalendarSearch();
    const [calendarViewEvents, setCalendarViewEvents] = useState<CalendarViewEvent[]>([]);

    const calendarsMap = useMemo(
        () =>
            calendars.reduce<SimpleMap<VisualCalendar>>((acc, calendar) => {
                acc[calendar.ID] = calendar;
                return acc;
            }, {}),
        [calendars]
    );

    const [visibleItems, hiddenItems] = useMemo(
        () =>
            items.reduce(
                ([visibleItems, hiddenItems]: [typeof items, typeof items], item) => {
                    const calendarDisplay = calendarsMap[item.CalendarID]?.Display;

                    if (calendarDisplay === CALENDAR_DISPLAY.VISIBLE) {
                        visibleItems.push(item);
                    } else if (calendarDisplay === CALENDAR_DISPLAY.HIDDEN) {
                        hiddenItems.push(item);
                    }

                    return [visibleItems, hiddenItems];
                },
                [[], []]
            ),
        [items, calendarsMap]
    );

    const shouldDisplayCalendarDisplayWarning = !visibleItems.length && !!hiddenItems.length;

    const hiddenWithItemsCalendarNames = useMemo(
        () => unique(hiddenItems.map((item) => calendarsMap[item.CalendarID]!.Name)),
        [hiddenItems, calendarsMap]
    );

    const hiddenWithItemsCalendarList = formatListWithAnd(hiddenWithItemsCalendarNames);

    const visualItems = useMemo(() => {
        return getVisualSearchItems({
            items: expandAndOrderItems(visibleItems, calendarsEventsCacheRef.current, recurrenceIDsMap, date),
            calendarsMap,
            tzid,
            date,
        });
    }, [visibleItems, date]);

    useEffect(() => {
        closestToDateRef?.scrollIntoView(true);
    }, [closestToDateRef]);

    const loadPopoverContent = (
        calendarID: string,
        eventID: string,
        {
            calendarViewEvent,
            eventReadResult,
        }: { calendarViewEvent: CalendarViewEvent; eventReadResult: EventReadResult }
    ) => {
        setInteractiveData({
            searchData: {
                ...calendarViewEvent,
                data: {
                    ...calendarViewEvent.data,
                    eventReadResult,
                    eventRecurrence: calendarViewEvent.data.eventRecurrence
                        ? {
                              ...calendarViewEvent.data.eventRecurrence,
                          }
                        : undefined,
                },
            },
        });
    };

    useCalendarsEventsReader({
        calendarEvents: calendarViewEvents,
        calendarsEventsCacheRef,
        rerender: noop,
        getOpenedMailEvents,
        onEventRead: loadPopoverContent,
        forceDecryption: true,
        metadataOnly: false,
    });

    const { setOpenedSearchItem } = useCalendarSearch();
    // visualItems are sorted by StartTime, so we can paginate them directly without sorting them again
    const {
        items: paginatedItems,
        isNextEnabled,
        isPreviousEnabled,
        next,
        previous,
    } = useCalendarSearchPagination(visualItems, date);

    const handleClickSearchItem = useCallback(
        (e: MouseEvent<HTMLButtonElement>, item: VisualSearchItem) => {
            const calendarsEventsCache = calendarsEventsCacheRef.current;
            if (!calendarsEventsCache) {
                return;
            }

            const { calendars } = calendarsEventsCache;
            let calendarEventsCache = calendars[item.CalendarID];

            if (!calendarEventsCache) {
                calendarEventsCache = getCalendarEventsCache();
                calendarsEventsCache.calendars[item.CalendarID] = calendarEventsCache;
            }

            /**
             * Upsert event metadata in cache in case it's not there
             *
             * This is a bit of a hack to avoid modifying too much our current structure for reading events.
             * That structure is quite rigid:
             * 1/ First we insert the API calendar event (with or without blob data) in the cache. This is done by
             *    useCalendarsEventFetcher or by the event loop.
             * 2/ Then we decrypt the cached events with useCalendarsEventReader
             * This hack plays the role of step 1 for events that appear in the list of results but were not fetched previously.
             */

            upsertCalendarApiEventWithoutBlob(item, calendarEventsCache);
            const calendarViewEvent = getCalendarViewEventWithMetadata(item);

            setTargetEventRef(e.currentTarget);
            setOpenedSearchItem(item);

            // setting search data opens the popover, its content is loaded by useCalendarsEventsReader
            setInteractiveData({
                searchData: calendarViewEvent,
            });

            // trigger event reader
            setCalendarViewEvents([calendarViewEvent]);
        },
        [setTargetEventRef, setOpenedSearchItem, setCalendarViewEvents]
    );

    const maybeWithEmptyToday = useMemo(() => {
        const eventsGroupedByDay = groupItemsByDay(paginatedItems);
        return fillEmptyToday(eventsGroupedByDay, now);
    }, [paginatedItems]);

    if (loading) {
        return (
            <div className="h-full w-full">
                {/* Custom py to have the same height as normal state's header */}
                <div className="py-custom px-5 border-bottom border-weak" style={{ '--py-custom': '0.912rem' }}>
                    <div className="h6">
                        <SkeletonLoader width="5em" index={0} />
                    </div>
                </div>
                <div className="p-12">
                    <div className="max-w-custom" style={{ '--max-w-custom': '22em' }}>
                        <SkeletonLoader width="100%" index={1} />
                        <SkeletonLoader width="80%" index={2} className="mb-8" />
                        <SkeletonLoader width="100%" index={3} />
                        <SkeletonLoader width="90%" index={4} className="mb-8" />
                        <SkeletonLoader width="100%" index={5} />
                        <SkeletonLoader width="70%" index={6} />
                    </div>
                </div>
            </div>
        );
    }

    const hasResults = Boolean(visualItems.length);

    return (
        <div className="relative flex *:min-size-auto flex-column flex-nowrap justify-start items-start w-full h-full reset4print">
            <div className="toolbar toolbar--heavy flex flex-nowrap shrink-0 items-center gap-2 no-print justify-space-between py-1 pr-2 pl-4 w-full">
                <h2 className="h6 text-semibold">
                    {hasResults ? c('esCalendar').t`Results` : c('esCalendar').t`No result`}
                </h2>
            </div>

            {hasResults ? (
                <div className="w-full flex-1 overflow-auto reset4print">
                    {maybeWithEmptyToday.reduce((acc: React.JSX.Element[], dailyEvents, index) => {
                        const isEmptyDay = !dailyEvents.length;
                        const utcStartDate = isEmptyDay ? startOfDay(new Date()) : dailyEvents[0]?.fakeUTCStartDate;
                        const previousDailyEvents = maybeWithEmptyToday[index - 1];
                        const previousUtcStartDate = previousDailyEvents?.[0]?.fakeUTCStartDate ?? new Date();

                        const shouldDisplayYearSeparatorBeforeCurrentDay =
                            !previousDailyEvents || !isSameYear(previousUtcStartDate, utcStartDate);

                        const year = getYear(utcStartDate);

                        return [
                            ...acc,
                            ...(shouldDisplayYearSeparatorBeforeCurrentDay
                                ? [<CalendarSearchViewYearSeparator key={`year_${year}`} year={year} />]
                                : []),
                            <CalendarSearchViewDayEvents
                                key={utcStartDate.toString()}
                                closestToDateRef={setClosestToDateRef}
                                dailyEvents={dailyEvents}
                                onClickSearchItem={handleClickSearchItem}
                            />,
                        ];
                    }, [])}

                    {(isPreviousEnabled || isNextEnabled) && (
                        <div className="p-4 lg:pl-8">
                            <Button
                                color="weak"
                                shape="outline"
                                className="ml-1 lg:ml-2 mr-2"
                                disabled={!isPreviousEnabled}
                                onClick={previous}
                            >
                                {c('Action').t`Previous`}
                            </Button>
                            <Button color="weak" shape="outline" disabled={!isNextEnabled} onClick={next}>
                                {c('Action').t`Next`}
                            </Button>
                        </div>
                    )}
                </div>
            ) : (
                <div className="flex flex-column w-full h-full">
                    {shouldDisplayCalendarDisplayWarning && (
                        <div className="bg-weak rounded m-2 px-4 py-2 flex">
                            <div className="shrink-0">
                                <Icon name="magnifier" className="mr-2" />
                            </div>
                            <div className="flex-1 pl-1">
                                {
                                    // translator: This is a warning displayed to the user when he gets no result on current search but has some in hidden calendars
                                    c('Info')
                                        .jt`Can't find the events you're looking for? Some events in hidden calendars match your query. To see those results, turn on visibility for ${hiddenWithItemsCalendarList}.`
                                }
                            </div>
                        </div>
                    )}

                    <div className="flex flex-column justify-center items-center grow w-full">
                        <IllustrationPlaceholder title={c('Info message').t`No results found`} url={noResultsImg} />
                        <div className="text-center">
                            {c('Info calendar search')
                                .t`You can either update your search query or close search to go back to calendar views`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default CalendarSearchView;

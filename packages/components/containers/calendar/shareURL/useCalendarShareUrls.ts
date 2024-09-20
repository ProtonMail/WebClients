import { useEffect, useMemo, useState } from 'react';

import { useLoading } from '@proton/hooks';
import {
    getIsCalendarUrlEventManagerCreate,
    getIsCalendarUrlEventManagerDelete,
    getIsCalendarUrlEventManagerUpdate,
    transformLinkFromAPI,
    transformLinksFromAPI,
} from '@proton/shared/lib/calendar/sharing/shareUrl/shareUrl';
import { getIsCalendarEventManagerDelete } from '@proton/shared/lib/eventManager/calendar/helpers';
import type { SimpleMap } from '@proton/shared/lib/interfaces';
import type { CalendarLink, CalendarUrl, VisualCalendar } from '@proton/shared/lib/interfaces/calendar';
import type {
    CalendarEventManager,
    CalendarUrlEventManager,
    CalendarUrlEventManagerDelete,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import { splitKeys } from '@proton/shared/lib/keys';
import updateItem from '@proton/utils/updateItem';

import { useEventManager, useGetCalendarInfo, useNotifications } from '../../../hooks';
import { useGetCalendarPublicLinks } from '../../../hooks/useGetCalendarPublicLinks';
import { useCalendarModelEventManager } from '../../eventManager/calendar/CalendarModelEventManagerProvider';

const useCalendarShareUrls = (calendars: VisualCalendar[]) => {
    const { createNotification } = useNotifications();
    const getCalendarInfo = useGetCalendarInfo();
    const getPublicLinks = useGetCalendarPublicLinks();
    const { subscribe: coreSubscribe } = useEventManager();
    const { subscribe: calendarSubscribe } = useCalendarModelEventManager();

    const [linksMap, setLinksMap] = useState<SimpleMap<CalendarLink[]>>({});
    const [loading, withLoading] = useLoading(true);
    const calendarIDs = useMemo(() => calendars.map(({ ID }) => ID), [calendars]);

    const handleError = ({ message }: Error) => createNotification({ type: 'error', text: message });

    const handleDeleteCalendar = (calendarID: string) => {
        setLinksMap((linksMap) => {
            const newMap = { ...linksMap };
            delete newMap[calendarID];
            return newMap;
        });
    };

    const handleDeleteLink = ({ ID }: CalendarUrlEventManagerDelete) => {
        setLinksMap((linksMap) => {
            return Object.fromEntries(
                Object.entries(linksMap).map(([calendarID, links]) => {
                    const newLinks = links?.filter(({ CalendarUrlID }) => CalendarUrlID !== ID);
                    return [calendarID, newLinks];
                })
            );
        });
    };

    const handleAddOrUpdateLink = async (calendarUrl: CalendarUrl) => {
        const { CalendarID } = calendarUrl;
        const calendar = calendars.find(({ ID }) => ID === CalendarID);
        if (!calendar) {
            return;
        }
        const { calendarKeys, passphrase } = await getCalendarInfo(CalendarID);
        const { privateKeys } = splitKeys(calendarKeys);
        const link = await transformLinkFromAPI({
            calendarUrl,
            privateKeys,
            calendarPassphrase: passphrase,
            onError: handleError,
        });
        setLinksMap((linksMap) => {
            const previousLinks = linksMap[CalendarID] || [];
            const linkIndex = previousLinks.findIndex(
                ({ CalendarUrlID }) => CalendarUrlID === calendarUrl.CalendarUrlID
            );
            const newLinks = linkIndex === -1 ? [...previousLinks, link] : updateItem(previousLinks, linkIndex, link);
            return {
                ...linksMap,
                [CalendarID]: newLinks,
            };
        });
    };

    // load links
    useEffect(() => {
        const getAllLinks = async () => {
            const map: SimpleMap<CalendarLink[]> = {};
            await Promise.all(
                calendars.map(async (calendar) => {
                    const calendarID = calendar.ID;
                    const { calendarKeys, passphrase } = await getCalendarInfo(calendarID);
                    const { privateKeys } = splitKeys(calendarKeys);
                    try {
                        const { CalendarUrls } = await getPublicLinks(calendarID);
                        map[calendarID] = await transformLinksFromAPI({
                            calendarUrls: CalendarUrls,
                            privateKeys,
                            calendarPassphrase: passphrase,
                            onError: handleError,
                        });
                    } catch (e: any) {
                        handleError(e);
                    }
                })
            );
            setLinksMap(map);
        };
        void withLoading(getAllLinks());
    }, []);

    // subscribe to general event loop
    useEffect(() => {
        return coreSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
            Calendars.forEach((event) => {
                if (getIsCalendarEventManagerDelete(event)) {
                    handleDeleteCalendar(event.ID);
                }
            });
        });
    }, []);

    // subscribe to calendar event loop
    useEffect(() => {
        return calendarSubscribe(
            calendarIDs,
            ({ CalendarURL: CalendarURLEvents = [] }: { CalendarURL?: CalendarUrlEventManager[] }) => {
                CalendarURLEvents.forEach((event) => {
                    if (getIsCalendarUrlEventManagerDelete(event)) {
                        handleDeleteLink(event);
                    }
                    if (getIsCalendarUrlEventManagerCreate(event) || getIsCalendarUrlEventManagerUpdate(event)) {
                        // TODO: The code below is prone to race conditions. Namely if a new event manager update
                        //  comes before this promise is resolved.
                        void handleAddOrUpdateLink(event.CalendarUrl);
                    }
                });
            }
        );
    }, [calendarIDs]);

    return {
        linksMap,
        isLoadingLinks: loading,
    };
};

export default useCalendarShareUrls;

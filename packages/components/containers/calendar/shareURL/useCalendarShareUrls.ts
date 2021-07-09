import {
    getIsCalendarUrlEventManagerCreate,
    getIsCalendarUrlEventManagerDelete,
    getIsCalendarUrlEventManagerUpdate,
    transformLinkFromAPI,
    transformLinksFromAPI,
} from '@proton/shared/lib/calendar/shareUrl/helpers';
import { updateItem } from '@proton/shared/lib/helpers/array';
import { SimpleMap } from '@proton/shared/lib/interfaces';
import { Calendar, CalendarLink, CalendarUrl } from '@proton/shared/lib/interfaces/calendar';
import {
    CalendarEventManager,
    CalendarUrlEventManager,
    CalendarUrlEventManagerDelete,
} from '@proton/shared/lib/interfaces/calendar/EventManager';
import { splitKeys } from '@proton/shared/lib/keys';
import { useEffect, useMemo, useState } from 'react';
import {
    getIsCalendarEventManagerDelete,
    getIsCalendarEventManagerUpdate,
} from '@proton/shared/lib/eventManager/helpers';
import { useEventManager, useGetCalendarInfo, useLoading, useNotifications } from '../../../hooks';
import { useGetCalendarPublicLinks } from '../../../hooks/useGetCalendarPublicLinks';
import { useCalendarModelEventManager } from '../../eventManager';

const useCalendarShareUrls = (calendars: Calendar[]) => {
    const { createNotification } = useNotifications();
    const getCalendarInfo = useGetCalendarInfo();
    const getPublicLinks = useGetCalendarPublicLinks();
    const { subscribe: standardSubscribe } = useEventManager();
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

    const handleUpdateCalendar = (calendar: Calendar) => {
        setLinksMap((linksMap) => ({
            ...linksMap,
            [calendar.ID]: linksMap?.[calendar.ID]?.map((calendarLink) => ({
                ...calendarLink,
                color: calendar.Color,
                calendarName: calendar.Name,
            })),
        }));
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
        const { decryptedCalendarKeys, decryptedPassphrase } = await getCalendarInfo(CalendarID);
        const { privateKeys } = splitKeys(decryptedCalendarKeys);
        const link = await transformLinkFromAPI({
            calendarUrl,
            calendar,
            privateKeys,
            calendarPassphrase: decryptedPassphrase,
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
                    const { decryptedCalendarKeys, decryptedPassphrase } = await getCalendarInfo(calendarID);
                    const { privateKeys } = splitKeys(decryptedCalendarKeys);
                    try {
                        const { CalendarUrls } = await getPublicLinks(calendarID);
                        map[calendarID] = await transformLinksFromAPI({
                            calendarUrls: CalendarUrls,
                            calendar,
                            privateKeys,
                            calendarPassphrase: decryptedPassphrase,
                            onError: handleError,
                        });
                    } catch (e) {
                        handleError(e);
                    }
                })
            );
            setLinksMap(map);
        };
        withLoading(getAllLinks());
    }, []);

    // subscribe to general event loop
    useEffect(() => {
        return standardSubscribe(({ Calendars = [] }: { Calendars?: CalendarEventManager[] }) => {
            Calendars.forEach((event) => {
                if (getIsCalendarEventManagerDelete(event)) {
                    handleDeleteCalendar(event.ID);
                }

                if (getIsCalendarEventManagerUpdate(event)) {
                    handleUpdateCalendar(event.Calendar);
                }
            });
        });
    }, []);

    // subscribe to calendar event loop
    useEffect(() => {
        return calendarSubscribe(calendarIDs, ({ CalendarURL = [] }: { CalendarURL?: CalendarUrlEventManager[] }) => {
            CalendarURL.forEach((CalendarUrlChange) => {
                if (getIsCalendarUrlEventManagerDelete(CalendarUrlChange)) {
                    handleDeleteLink(CalendarUrlChange);
                }
                if (
                    getIsCalendarUrlEventManagerCreate(CalendarUrlChange) ||
                    getIsCalendarUrlEventManagerUpdate(CalendarUrlChange)
                ) {
                    handleAddOrUpdateLink(CalendarUrlChange.CalendarUrl);
                }
            });
        });
    }, [calendarIDs]);

    return {
        linksMap,
        isLoadingLinks: loading,
    };
};

export default useCalendarShareUrls;

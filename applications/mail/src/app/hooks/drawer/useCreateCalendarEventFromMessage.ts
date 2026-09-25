import { useCallback, useEffect, useRef } from 'react';

import { useConfig } from '@proton/app-context/useConfig';
import useDrawer from '@proton/components/hooks/drawer/useDrawer';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APPS } from '@proton/shared/lib/constants';
import {
    addParentAppToUrl,
    getDrawerAppFromURL,
    getIsDrawerPostMessage,
    postMessageToIframe,
} from '@proton/shared/lib/drawer/helpers';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';

/**
 * Opens the Calendar drawer and asks it to initialise the standard event editor
 * prefilled from a Mail message (subject, optional sender). This is the
 * accessible "Add to Calendar" entry point that shares the same underlying
 * `CALENDAR_CREATE_EVENT_FROM_MAIL` message as drag & drop.
 */
const useCreateCalendarEventFromMessage = () => {
    const { appInView, setAppInView, iframeSrcMap, setIframeSrcMap } = useDrawer();
    const { APP_NAME: currentApp } = useConfig();
    const pendingRef = useRef<{
        messageID: string;
        subject: string;
        sender?: string;
    }>();

    // Flush the pending create request once the Calendar iframe reports READY
    // (i.e. after the drawer has been cold-opened and mounted).
    useEffect(() => {
        const handleMessage = (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            if (event.data.type !== DRAWER_EVENTS.READY) {
                return;
            }

            if (getDrawerAppFromURL(event.origin) !== APPS.PROTONCALENDAR) {
                return;
            }

            const pending = pendingRef.current;
            if (!pending) {
                return;
            }
            pendingRef.current = undefined;

            postMessageToIframe(
                {
                    type: DRAWER_EVENTS.CALENDAR_CREATE_EVENT_FROM_MAIL,
                    payload: pending,
                },
                APPS.PROTONCALENDAR
            );
        };

        window.addEventListener('message', handleMessage);

        return () => {
            window.removeEventListener('message', handleMessage);
        };
    }, []);

    return useCallback(
        ({ messageID, subject, sender }: { messageID: string; subject: string; sender?: string }) => {
            // Calendar already mounted in the drawer: talk to it directly.
            if (appInView === APPS.PROTONCALENDAR && iframeSrcMap[APPS.PROTONCALENDAR]) {
                postMessageToIframe(
                    {
                        type: DRAWER_EVENTS.CALENDAR_CREATE_EVENT_FROM_MAIL,
                        payload: { messageID, subject, sender },
                    },
                    APPS.PROTONCALENDAR
                );
                return;
            }

            // Otherwise open the drawer and defer the request until the iframe
            // has mounted and reported READY.
            pendingRef.current = { messageID, subject, sender };
            setAppInView(APPS.PROTONCALENDAR);

            if (!iframeSrcMap[APPS.PROTONCALENDAR]) {
                const localID = getLocalIDFromPathname(window.location.pathname);
                const appHref = getAppHref('/', APPS.PROTONCALENDAR, localID);

                setIframeSrcMap((map) => ({
                    ...map,
                    [APPS.PROTONCALENDAR]: addParentAppToUrl(appHref, currentApp),
                }));
            }
        },
        [appInView, iframeSrcMap, currentApp, setAppInView, setIframeSrcMap]
    );
};

export default useCreateCalendarEventFromMessage;

import type { Dispatch, ReactNode, SetStateAction } from 'react';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';

import { useApi, useDrawerLocalStorage, useGetUser, useToggleDrawerApp } from '@proton/components/hooks';
import useAuthentication from '@proton/components/hooks/useAuthentication';
import { versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';
import { serverTime } from '@proton/crypto';
import { getClientID } from '@proton/shared/lib/apps/helper';
import { getAppFromHostname } from '@proton/shared/lib/apps/slugHelper';
import { stripLocalBasenameFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { DAY, MINUTE } from '@proton/shared/lib/constants';
import { getIsDrawerPostMessage, getIsIframedDrawerApp, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import type { DrawerApp, IframeSrcMap } from '@proton/shared/lib/drawer/interfaces';
import { DRAWER_EVENTS } from '@proton/shared/lib/drawer/interfaces';
import { ApiError, serializeApiErrorData } from '@proton/shared/lib/fetch/ApiError';
import { getAppVersionHeaders } from '@proton/shared/lib/fetch/headers';
import { getIsIframe } from '@proton/shared/lib/helpers/browser';

export const DrawerContext = createContext<{
    /**
     * App currently opened in the Drawer
     */
    appInView: DrawerApp | undefined;
    setAppInView: Dispatch<SetStateAction<DrawerApp | undefined>>;
    /**
     * Map of the srcs we use on the iframe to open it
     */
    iframeSrcMap: IframeSrcMap;
    setIframeSrcMap: Dispatch<SetStateAction<IframeSrcMap>>;
    /**
     * Map we use to store urls of all apps opened inside the iframe
     */
    iframeURLMap: IframeSrcMap;
    setIframeURLMap: Dispatch<SetStateAction<IframeSrcMap>>;
    /**
     * Is the drawer sidebar hidden (from a setting perspective)
     */
    showDrawerSidebar?: boolean;
    setShowDrawerSidebar: Dispatch<SetStateAction<boolean | undefined>>;
    /**
     * Is the drawer sidebar already mounted, so that we can perform actions on it
     */
    drawerSidebarMounted: boolean;
    setDrawerSidebarMounted: Dispatch<SetStateAction<boolean>>;
    /**
     * Child specific, on which "parent" app the "child" app is opened
     */
    parentApp?: APP_NAMES;
    setParentApp: Dispatch<SetStateAction<APP_NAMES | undefined>>;
} | null>(null);

export default function useDrawer() {
    const drawerContext = useContext(DrawerContext);

    if (!drawerContext) {
        throw new Error('Drawer provider not initialized');
    }

    const {
        appInView,
        setAppInView,
        iframeSrcMap,
        setIframeSrcMap,
        iframeURLMap,
        setIframeURLMap,
        showDrawerSidebar,
        setShowDrawerSidebar,
        parentApp,
        drawerSidebarMounted,
        setDrawerSidebarMounted,
    } = drawerContext;

    const toggleDrawerApp = useToggleDrawerApp({
        appInView,
        setAppInView,
        iframeSrcMap,
        setIframeSrcMap,
    });

    const isIframe = getIsIframe();

    // If app is inside an iframe and it has a parent, then it's a drawer app
    const isDrawerApp = !!parentApp && isIframe;

    return {
        appInView,
        setAppInView,
        iframeSrcMap,
        setIframeSrcMap,
        iframeURLMap,
        setIframeURLMap,
        toggleDrawerApp,
        parentApp,
        isDrawerApp,
        showDrawerSidebar,
        setShowDrawerSidebar,
        drawerSidebarMounted,
        setDrawerSidebarMounted,
    };
}

export const DrawerProvider = ({
    children,
    defaultShowDrawerSidear,
}: {
    children: ReactNode;
    defaultShowDrawerSidear?: boolean;
}) => {
    const authentication = useAuthentication();
    const api = useApi();
    const getUser = useGetUser();

    // App currently in view in the drawer
    const [appInView, setAppInView] = useState<DrawerApp | undefined>();
    // Iframe src's for all apps opened in the drawer => Map of the src we use on the iframe to open it
    const [iframeSrcMap, setIframeSrcMap] = useState<IframeSrcMap>({});
    // Iframe urls for all apps opened in the drawer => Map we use to store the url of the app opened inside the iframe
    const [iframeURLMap, setIframeURLMap] = useState<IframeSrcMap>({});
    // Parent app of the app embedded into the drawer
    const [parentApp, setParentApp] = useState<APP_NAMES>();
    // Is the sidebar mounted, we need this to get the drawer width
    const [drawerSidebarMounted, setDrawerSidebarMounted] = useState(false);
    // Is the DrawerSidebar displayed or not (we can hide the drawer with a setting)
    const [showDrawerSidebar, setShowDrawerSidebar] = useState<boolean | undefined>(defaultShowDrawerSidear);

    const [requestsAbortControllers, setRequestsAbortControllers] = useState<
        { id: string; abortController: AbortController }[]
    >([]);

    const { setDrawerLocalStorageKey } = useDrawerLocalStorage(iframeSrcMap, drawerSidebarMounted, appInView);

    const removeAbortController = (id: string) => {
        setRequestsAbortControllers((requestsAbortControllers) =>
            requestsAbortControllers.filter((controller) => controller.id === id)
        );
    };

    const handleReceived = useCallback(
        async (event: MessageEvent) => {
            if (!getIsDrawerPostMessage(event)) {
                return;
            }

            switch (event.data.type) {
                case DRAWER_EVENTS.CLOSE:
                    {
                        setAppInView(undefined);
                        if (event.data.payload) {
                            const { app, closeDefinitely } = event.data.payload;

                            if (closeDefinitely) {
                                setIframeSrcMap((map) => ({
                                    ...map,
                                    [app]: undefined,
                                }));
                            }
                        }
                    }
                    break;
                case DRAWER_EVENTS.SWITCH:
                    {
                        const { nextUrl } = event.data.payload;

                        const nextApp = getAppFromHostname(nextUrl);
                        if (!nextApp || !getIsIframedDrawerApp(nextApp)) {
                            throw new Error('Invalid nextUrl');
                        }
                        setAppInView(nextApp);
                        setIframeSrcMap((map) => ({
                            ...map,
                            [nextApp]: nextUrl,
                        }));
                    }
                    break;
                case DRAWER_EVENTS.READY:
                    {
                        if (appInView) {
                            const user = await getUser();
                            postMessageToIframe(
                                {
                                    type: DRAWER_EVENTS.SESSION,
                                    payload: {
                                        UID: authentication.getUID(),
                                        localID: authentication.getLocalID(),
                                        keyPassword: authentication.getPassword(),
                                        persistent: authentication.getPersistent(),
                                        trusted: authentication.getTrusted(),
                                        clientKey: authentication.getClientKey(),
                                        offlineKey: authentication.getOfflineKey(),
                                        User: user,
                                        tag: versionCookieAtLoad,
                                    },
                                },
                                appInView
                            );
                        }
                    }
                    break;
                case DRAWER_EVENTS.API_REQUEST:
                    {
                        if (!appInView || !getIsIframedDrawerApp(appInView)) {
                            return;
                        }

                        const { arg, id, appVersion, hasAbortController } = event.data.payload;

                        try {
                            let updatedArgs: any = arg;
                            if (hasAbortController) {
                                const abortController = new AbortController();

                                setRequestsAbortControllers((requestsAbortControllers) => [
                                    ...requestsAbortControllers,
                                    { id, abortController },
                                ]);

                                updatedArgs = {
                                    ...arg,
                                    signal: abortController.signal,
                                };
                            }

                            let res = await api({
                                ...updatedArgs,
                                headers: {
                                    ...updatedArgs.headers,
                                    ...getAppVersionHeaders(getClientID(appInView), appVersion),
                                    'x-pm-source': 'drawer',
                                },
                            });

                            // Once the request is finished, remove the controller from the array
                            if (hasAbortController) {
                                removeAbortController(id);
                            }

                            if (updatedArgs.output === 'raw') {
                                res = {
                                    ok: res.ok,
                                    status: res.status,
                                    json: await res.json(),
                                    headers: Object.fromEntries(res.headers.entries()),
                                };
                            }

                            postMessageToIframe(
                                {
                                    type: DRAWER_EVENTS.API_RESPONSE,
                                    payload: {
                                        id,
                                        success: true,
                                        data: res,
                                        serverTime: serverTime(),
                                        output: updatedArgs.output,
                                    },
                                },
                                appInView
                            );
                        } catch (err: any) {
                            // If the request failed, remove the controller from the array
                            if (hasAbortController) {
                                removeAbortController(id);
                            }

                            const isApiError = err instanceof ApiError;

                            postMessageToIframe(
                                {
                                    type: DRAWER_EVENTS.API_RESPONSE,
                                    payload: {
                                        id,
                                        success: false,
                                        isApiError,
                                        data: isApiError ? serializeApiErrorData(err) : err,
                                        serverTime: serverTime(),
                                    },
                                },
                                appInView
                            );
                        }
                    }
                    break;
                case DRAWER_EVENTS.ABORT_REQUEST:
                    const { id } = event.data.payload;

                    const controller = requestsAbortControllers.find(
                        (controller) => controller.id === id
                    )?.abortController;

                    if (controller) {
                        controller.abort();

                        // Once the request is aborted, remove the controller from the array
                        removeAbortController(id);
                    }

                    break;
                case DRAWER_EVENTS.CHILD_URL_UPDATE:
                    const user = await getUser();

                    const { url, app } = event.data.payload;
                    const pathname = new URL(url).pathname || '';
                    const path = stripLocalBasenameFromPathname(pathname);

                    setDrawerLocalStorageKey({ app, path }, user.ID);
                    setIframeURLMap((iframeURLMap) => ({
                        ...iframeURLMap,
                        [app]: url,
                    }));
                    break;
                default:
                    break;
            }
        },
        [appInView]
    );

    useEffect(() => {
        window.addEventListener('message', handleReceived);

        return () => {
            window.removeEventListener('message', handleReceived);
        };
    }, [handleReceived]);

    // We close definitely cached drawer apps if unused for a certain period of time (3 days)
    const hideAtMapRef = useRef<Partial<Record<DrawerApp, number>>>({});
    const intervalMapRef = useRef<Partial<Record<DrawerApp, number>>>({});

    useEffect(() => {
        // forced to use this workaround for iframeSrcMap key types due to https://github.com/microsoft/TypeScript/issues/50096
        let key: keyof typeof iframeSrcMap;

        for (key in iframeSrcMap) {
            const app = key;
            const isAppCached = iframeSrcMap[app] && appInView !== app;

            if (isAppCached) {
                let hidePanelAt = hideAtMapRef.current[app];
                if (hidePanelAt === undefined) {
                    hidePanelAt = Date.now();
                    hideAtMapRef.current[app] = hidePanelAt;
                }

                const maxDate = hidePanelAt + 3 * DAY;
                intervalMapRef.current[app] = window.setInterval(() => {
                    if (Date.now() > maxDate) {
                        setIframeSrcMap((iframeSrcMap) => ({
                            ...iframeSrcMap,
                            [app]: undefined,
                        }));
                        hideAtMapRef.current[app] = undefined;
                    }
                }, 5 * MINUTE);
            }
        }

        return () => {
            let app: keyof typeof iframeSrcMap;

            for (app in iframeSrcMap) {
                if (intervalMapRef.current[app]) {
                    clearInterval(intervalMapRef.current[app]);
                }
            }
        };
    }, [appInView, iframeSrcMap]);

    return (
        <DrawerContext.Provider
            value={{
                appInView,
                setAppInView,
                iframeSrcMap,
                setIframeSrcMap,
                iframeURLMap,
                setIframeURLMap,
                showDrawerSidebar,
                setShowDrawerSidebar,
                parentApp,
                setParentApp,
                drawerSidebarMounted,
                setDrawerSidebarMounted,
            }}
        >
            {children}
        </DrawerContext.Provider>
    );
};

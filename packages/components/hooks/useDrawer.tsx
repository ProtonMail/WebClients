import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useRef,
    useState,
} from 'react';

import { useApi, useAuthentication, useGetUser, useToggleDrawerApp } from '@proton/components/hooks/index';
import { versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';
import { serverTime } from '@proton/crypto';
import { getAppFromHostname } from '@proton/shared/lib/apps/slugHelper';
import { APP_NAMES, DAY, MINUTE } from '@proton/shared/lib/constants';
import { getIsDrawerPostMessage, getIsIframedDrawerApp, postMessageToIframe } from '@proton/shared/lib/drawer/helpers';
import { DRAWER_APPS, DRAWER_EVENTS, IframeSrcMap } from '@proton/shared/lib/drawer/interfaces';
import { ApiError, serializeApiErrorData } from '@proton/shared/lib/fetch/ApiError';

export const DrawerContext = createContext<{
    appInView: DRAWER_APPS | undefined;
    setAppInView: Dispatch<SetStateAction<DRAWER_APPS | undefined>>;
    iframeSrcMap: IframeSrcMap;
    setIframeSrcMap: Dispatch<SetStateAction<IframeSrcMap>>;
    showDrawerSidebar?: boolean;
    setShowDrawerSidebar: Dispatch<SetStateAction<boolean | undefined>>;
    parentApp?: APP_NAMES;
    setParentApp: Dispatch<SetStateAction<APP_NAMES | undefined>>;
    drawerSidebarMounted: boolean;
    setDrawerSidebarMounted: Dispatch<SetStateAction<boolean>>;
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

    const isIframe = window.self !== window.top;

    // If app is inside an iframe and it has a parent, then it's a drawer app
    const isDrawerApp = !!parentApp && isIframe;

    return {
        appInView,
        setAppInView,
        iframeSrcMap,
        setIframeSrcMap,
        toggleDrawerApp,
        parentApp,
        isDrawerApp,
        showDrawerSidebar,
        setShowDrawerSidebar,
        drawerSidebarMounted,
        setDrawerSidebarMounted,
    };
}

export const DrawerProvider = ({ children }: { children: ReactNode }) => {
    const { getUID, getPersistent, getPassword, getTrusted } = useAuthentication();
    const api = useApi();
    const getUser = useGetUser();

    // App currently in view in the drawer
    const [appInView, setAppInView] = useState<DRAWER_APPS | undefined>();
    // Iframe src's for all apps opened in the drawer.
    const [iframeSrcMap, setIframeSrcMap] = useState<IframeSrcMap>({});
    // Parent app of the app embedded into the drawer
    const [parentApp, setParentApp] = useState<APP_NAMES>();
    // Is the sidebar mounted, we need this to get the drawer width
    const [drawerSidebarMounted, setDrawerSidebarMounted] = useState(false);
    // Is the DrawerSidebar displayed or not (we can hide the drawer with a setting)
    const [showDrawerSidebar, setShowDrawerSidebar] = useState<boolean | undefined>(undefined);

    const [requestsAbortControllers, setRequestsAbortControllers] = useState<
        { id: string; abortController: AbortController }[]
    >([]);

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
                                        UID: getUID(),
                                        keyPassword: getPassword(),
                                        persistent: getPersistent(),
                                        trusted: getTrusted(),
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

                        const { arg, id, hasAbortController } = event.data.payload;

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

                            const res = await api({
                                ...updatedArgs,
                                headers: { ...updatedArgs.headers, 'x-pm-source': 'drawer' },
                            });

                            // Once the request is finished, remove the controller from the array
                            if (hasAbortController) {
                                removeAbortController(id);
                            }

                            postMessageToIframe(
                                {
                                    type: DRAWER_EVENTS.API_RESPONSE,
                                    payload: {
                                        id,
                                        success: true,
                                        data: res,
                                        serverTime: serverTime(),
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
    const hideAtMapRef = useRef<Partial<Record<DRAWER_APPS, number>>>({});
    const intervalMapRef = useRef<Partial<Record<DRAWER_APPS, number>>>({});

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

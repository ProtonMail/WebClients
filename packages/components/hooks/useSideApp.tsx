import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react';

import { versionCookieAtLoad } from '@proton/components/hooks/useEarlyAccess';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { getAppFromHostname } from '@proton/shared/lib/apps/slugHelper';
import { getLocalIDFromPathname } from '@proton/shared/lib/authentication/pathnameHelper';
import { APP_NAMES } from '@proton/shared/lib/constants';
import {
    addParentAppToUrl,
    getIsAuthorizedApp,
    isAuthorizedSideAppUrl,
    postMessageToIframe,
} from '@proton/shared/lib/sideApp/helpers';
import { SIDE_APP_ACTION, SIDE_APP_EVENTS } from '@proton/shared/lib/sideApp/models';

import { useApi, useAuthentication, useGetUser, useOnline } from './index';
import useApiStatus from './useApiStatus';
import useConfig from './useConfig';

type SideAppOpenedUrl = {
    app: string;
    url: string;
};

export const SideAppContext = createContext<{
    sideAppUrl?: string;
    setSideAppUrl?: (url: string, replacePath?: boolean) => void;
    sideAppOpenedUrls?: SideAppOpenedUrl[];
    parentApp?: APP_NAMES;
    setParentApp?: Dispatch<SetStateAction<APP_NAMES | undefined>>;
}>({});

export default function useSideApp() {
    const { sideAppUrl, setSideAppUrl, sideAppOpenedUrls, parentApp } = useContext(SideAppContext) || {
        sideAppUrl: undefined,
        setSideAppUrl: undefined,
        sideAppOpenedUrls: undefined,
        parentApp: undefined,
    };
    const { offline } = useApiStatus();
    const onlineStatus = useOnline();

    const isAppReachable = !offline && onlineStatus;

    const isIframe = window.self !== window.top;

    // If app is inside an iframe and it has a parent, then it's a side app
    const isSideApp = !!parentApp && isIframe;

    const handleClickSideApp =
        (app: APP_NAMES, path = '/') =>
        () => {
            if (!getIsAuthorizedApp(app)) {
                return;
            }
            const localID = getLocalIDFromPathname(window.location.pathname);
            const alreadyOpenedUrl = sideAppOpenedUrls?.find((opened) => opened.app === app)?.url;
            const url = alreadyOpenedUrl || getAppHref(path, app, localID);

            // Send an event to the iframe if we click on the app button to close it
            // That way, we can get the current URL and store it in alreadyOpenedUrls
            if (sideAppUrl === url) {
                postMessageToIframe({ type: SIDE_APP_EVENTS.SIDE_APP_CLOSE_FROM_OUTSIDE }, app);
            } else if (sideAppUrl !== undefined && isAppReachable) {
                // If side app url is not undefined, then we have an app currently opened
                // It means we are switching app by clicking on another app button
                // In that case we want to get the current URL and store it in alreadyOpenedUrls
                postMessageToIframe(
                    { type: SIDE_APP_EVENTS.SIDE_APP_SWITCH_FROM_OUTSIDE, payload: { nextUrl: url } },
                    app
                );
            } else if (isAppReachable) {
                // If the user has no connection or the api is offline, prevent opening,
                // otherwise the user would have a huge white panel on the right, without being able to close it
                setSideAppUrl?.(url);
            }
        };

    return { sideAppUrl, setSideAppUrl, handleClickSideApp, parentApp, isSideApp };
}

export const SideAppUrlProvider = ({ children }: { children: ReactNode }) => {
    const { APP_NAME } = useConfig();
    const [sideAppUrl, setSideAppUrl] = useState<string>();
    const [sideAppOpenedUrls, setSideAppOpenedUrls] = useState<SideAppOpenedUrl[]>([]);
    const { getUID, getPersistent, getPassword } = useAuthentication();
    const api = useApi();
    const getUser = useGetUser();

    const [parentApp, setParentApp] = useState<APP_NAMES>();

    const [requestsAbortControllers, setRequestsAbortControllers] = useState<
        { id: string; abortController: AbortController }[]
    >([]);

    const handleSetSideAppUrl = (url?: string, replacePath?: boolean) => {
        // Add the parent-app name to the url we want to open in the iframe
        // This allows us to know from which app we are opening the iframe, and to use the correct targetOrigin
        const updatedUrl = addParentAppToUrl(url || '', APP_NAME, replacePath);

        setSideAppUrl(updatedUrl);
    };

    const updateOpenedUrls = (url?: string, app?: string) => {
        if (url && app) {
            setSideAppOpenedUrls([...sideAppOpenedUrls.filter((opened) => opened.app === app), { app, url }]);
        }
    };

    const removeAbortController = (id: string) => {
        setRequestsAbortControllers((requestsAbortControllers) =>
            requestsAbortControllers.filter((controller) => controller.id === id)
        );
    };

    const handleReceived = useCallback(
        async (event: MessageEvent<SIDE_APP_ACTION>) => {
            const origin = event.origin;

            if (!isAuthorizedSideAppUrl(origin)) {
                return;
            }

            switch (event.data.type) {
                case SIDE_APP_EVENTS.SIDE_APP_CLOSE:
                    {
                        if (event.data.payload) {
                            const { url, app } = event.data.payload;
                            updateOpenedUrls(url, app);
                        }

                        setSideAppUrl(undefined);
                    }
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_SWITCH:
                    {
                        const { url, app, nextUrl } = event.data.payload;

                        updateOpenedUrls(url, app);

                        handleSetSideAppUrl(nextUrl);
                    }
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_READY:
                    {
                        const sideApp = getAppFromHostname(new URL(sideAppUrl || '').hostname);

                        if (sideApp) {
                            const user = await getUser();
                            postMessageToIframe(
                                {
                                    type: SIDE_APP_EVENTS.SIDE_APP_SESSION,
                                    payload: {
                                        UID: getUID(),
                                        keyPassword: getPassword(),
                                        persistent: getPersistent(),
                                        User: user,
                                        tag: versionCookieAtLoad,
                                    },
                                },
                                sideApp
                            );
                        }
                    }
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_API_REQUEST:
                    {
                        const sideApp = getAppFromHostname(new URL(sideAppUrl || '').hostname);

                        const { arg, id, hasAbortController } = event.data.payload;

                        if (sideApp) {
                            try {
                                let updatedArgs = arg;
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

                                const res = await api(updatedArgs);

                                // Once the request is finished, remove the controller from the array
                                if (hasAbortController) {
                                    removeAbortController(id);
                                }

                                postMessageToIframe(
                                    {
                                        type: SIDE_APP_EVENTS.SIDE_APP_API_RESPONSE,
                                        payload: {
                                            id,
                                            success: true,
                                            data: res,
                                        },
                                    },
                                    sideApp
                                );
                            } catch (err: any) {
                                // If the request failed, remove the controller from the array
                                if (hasAbortController) {
                                    removeAbortController(id);
                                }

                                postMessageToIframe(
                                    {
                                        type: SIDE_APP_EVENTS.SIDE_APP_API_RESPONSE,
                                        payload: {
                                            id,
                                            success: false,
                                            data: err,
                                        },
                                    },
                                    sideApp
                                );
                            }
                        }
                    }
                    break;
                case SIDE_APP_EVENTS.SIDE_APP_ABORT_REQUEST:
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
        [sideAppUrl]
    );

    useEffect(() => {
        window.addEventListener('message', handleReceived);

        return () => {
            window.removeEventListener('message', handleReceived);
        };
    }, [sideAppUrl]);

    return (
        <SideAppContext.Provider
            value={{ sideAppUrl, setSideAppUrl: handleSetSideAppUrl, sideAppOpenedUrls, parentApp, setParentApp }}
        >
            {children}
        </SideAppContext.Provider>
    );
};

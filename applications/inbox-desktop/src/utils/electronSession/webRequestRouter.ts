// Note: onBeforeSendHeaders is not included here because it only has a single consumer (session.ts).
// If multiplexing is ever needed for it, add it here following the same pattern.
import { Session } from "electron";
import { appSession } from "../session";
import { webRequestRouterLogger } from "../log";

type Unsubscribe = () => void;

type OnBeforeRequestHandler = (details: Electron.OnBeforeRequestListenerDetails) => void;
type OnResponseStartedRequestHandler = (details: Electron.OnResponseStartedListenerDetails) => void;
type OnCompletedRequestHandler = (details: Electron.OnCompletedListenerDetails) => void;
type OnErrorOccurredRequestHandler = (details: Electron.OnErrorOccurredListenerDetails) => void;

class WebRequestRouter {
    private static instance: WebRequestRouter;
    private _session: Session | null = null;
    private readonly handlers = {
        onBeforeRequest: new Set<OnBeforeRequestHandler>(),
        onResponseStarted: new Set<OnResponseStartedRequestHandler>(),
        onCompleted: new Set<OnCompletedRequestHandler>(),
        onErrorOccurred: new Set<OnErrorOccurredRequestHandler>(),
    };

    private constructor() {}

    public static getInstance(): WebRequestRouter {
        if (!WebRequestRouter.instance) {
            WebRequestRouter.instance = new WebRequestRouter();
        }
        return WebRequestRouter.instance;
    }

    private get session(): Session {
        if (!this._session) {
            this._session = appSession();
        }
        return this._session;
    }

    private registerHandlers<T>(set: Set<(details: T) => void>): (details: T) => void {
        return (details) =>
            set.forEach((h) => {
                try {
                    h(details);
                } catch (e) {
                    webRequestRouterLogger.error("handler threw", e);
                }
            });
    }

    private sub<T>(
        set: Set<(details: T) => void>,
        handler: (details: T) => void,
        register: (listener: ((details: T) => void) | null) => void,
    ): Unsubscribe {
        set.add(handler);
        register(null); // Redundant but explicit, Electron would overwrite anyway
        register(this.registerHandlers(set));

        return () => {
            set.delete(handler);
            register(null); // reset
            if (set.size > 0) {
                register(this.registerHandlers(set)); // register remaining
            }
        };
    }

    /** Subscribers are observation-only; requests are never blocked or redirected. */
    public onBeforeRequest(handler: OnBeforeRequestHandler): Unsubscribe {
        return this.sub(this.handlers.onBeforeRequest, handler, (listener) => {
            if (listener === null) {
                this.session.webRequest.onBeforeRequest(null);
            } else {
                this.session.webRequest.onBeforeRequest((details, callback) => {
                    listener(details);
                    callback({});
                });
            }
        });
    }

    public onResponseStarted(handler: OnResponseStartedRequestHandler): Unsubscribe {
        return this.sub(this.handlers.onResponseStarted, handler, (listener) => {
            this.session.webRequest.onResponseStarted(listener);
        });
    }

    public onCompleted(handler: OnCompletedRequestHandler): Unsubscribe {
        return this.sub(this.handlers.onCompleted, handler, (listener) => {
            this.session.webRequest.onCompleted(listener);
        });
    }

    public onErrorOccurred(handler: OnErrorOccurredRequestHandler): Unsubscribe {
        return this.sub(this.handlers.onErrorOccurred, handler, (listener) => {
            this.session.webRequest.onErrorOccurred(listener);
        });
    }
}

export const webRequestRouter = WebRequestRouter.getInstance();

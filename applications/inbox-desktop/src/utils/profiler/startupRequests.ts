import { performance } from "node:perf_hooks";
import { getAppURL } from "../../store/urlStore";

export class StartupRequestRecorder {
    private enabled = false;
    private session: Electron.Session;
    private iifeStart: number;
    private requestStartMap = new Map<number, number>();
    private resourceDurations: number[] = [];
    private resourceCacheHits = 0;
    private resourceCacheMisses = 0;
    private resourceFailures = 0;
    private mainFrameRequests = new Map<number, string>();
    public mainFrameFirstByteMs = new Map<string, number>();

    public constructor(session: Electron.Session, iifeStart: number) {
        this.enabled = true;
        this.iifeStart = iifeStart;
        this.session = session;
        this.hookRequestTiming();
    }

    public closeResourceWindow(): void {
        this.enabled = false;
    }

    private hookRequestTiming(): void {
        const appURL = getAppURL();
        this.session.webRequest.onBeforeRequest((details, callback) => {
            if (this.enabled && ["stylesheet", "script", "image", "font"].includes(details.resourceType)) {
                this.requestStartMap.set(details.id, performance.now());
            }
            if (details.resourceType === "mainFrame") {
                const viewName = details.url.startsWith(appURL.mail)
                    ? "mail"
                    : details.url.startsWith(appURL.calendar)
                      ? "calendar"
                      : details.url.startsWith(appURL.account)
                        ? "account"
                        : null;

                // Only track our own views and only once per view
                if (viewName && !this.mainFrameFirstByteMs.has(viewName)) {
                    this.mainFrameRequests.set(details.id, viewName);
                }
            }
            callback({});
        });

        this.session.webRequest.onResponseStarted((details) => {
            const viewName = this.mainFrameRequests.get(details.id);
            if (viewName && !this.mainFrameFirstByteMs.has(viewName)) {
                this.mainFrameFirstByteMs.set(viewName, performance.now() - this.iifeStart);
                this.mainFrameRequests.delete(details.id);
            }
        });

        this.session.webRequest.onCompleted((details) => {
            const start = this.requestStartMap.get(details.id);
            if (start !== undefined) {
                this.resourceDurations.push(performance.now() - start);
                this.requestStartMap.delete(details.id);
                if (details.fromCache) this.resourceCacheHits++;
                else this.resourceCacheMisses++;
            }
        });

        this.session.webRequest.onErrorOccurred((details) => {
            if (this.requestStartMap.has(details.id)) {
                this.requestStartMap.delete(details.id);
                this.resourceFailures++;
            }
            this.mainFrameRequests.delete(details.id);
        });
    }

    public buildResources() {
        const sorted = [...this.resourceDurations].sort((a, b) => a - b);
        return {
            startupWindow: {
                count: sorted.length,
                failures: this.resourceFailures,
                fromCache: this.resourceCacheHits,
                network: this.resourceCacheMisses,
                avgMs: sorted.length > 0 ? Math.round(sorted.reduce((a, b) => a + b, 0) / sorted.length) : null,
                maxMs: sorted.length > 0 ? Math.round(sorted[sorted.length - 1]) : null,
                p95Ms: sorted.length > 0 ? Math.round(sorted[Math.ceil(sorted.length * 0.95) - 1]) : null,
            },
        };
    }

    // Electron sessions only allow one handler at a time, so we can safely null these out.
    public cleanup(): void {
        this.session.webRequest.onBeforeRequest(null);
        this.session.webRequest.onResponseStarted(null);
        this.session.webRequest.onCompleted(null);
        this.session.webRequest.onErrorOccurred(null);
    }
}

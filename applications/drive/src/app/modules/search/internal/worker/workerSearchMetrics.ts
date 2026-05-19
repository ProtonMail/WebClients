import type { MainThreadBridge } from '../mainThread/MainThreadBridge';
import { sendErrorReportForSearch } from '../shared/errors';
import type { SearchMetrics } from '../shared/searchMetrics';

/**
 * Returns a `SearchMetrics`-shaped proxy that forwards every `mark*` call across the
 * bridge so metrics flow through the main-thread `@proton/metrics` singleton (which
 * carries the bootstrap-initialized auth + version headers).
 */
export function createBridgedSearchMetrics(bridge: MainThreadBridge): SearchMetrics {
    return new Proxy({} as SearchMetrics, {
        get(_target, prop) {
            return (args: unknown) => {
                Promise.resolve()
                    .then(() =>
                        bridge.dispatchSearchMetric(
                            prop as keyof SearchMetrics,
                            // The proxy is opaquely typed; runtime args match because callers go
                            // through the SearchMetrics interface at compile time.
                            args as never
                        )
                    )
                    .catch((error: unknown) =>
                        sendErrorReportForSearch(`Bridged search metric failed (${String(prop)})`, error, {
                            tags: { metric: String(prop) },
                        })
                    );
            };
        },
    });
}

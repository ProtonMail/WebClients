import type { LatestEventIdProvider, ProtonDriveClient } from '@protontech/drive-sdk';
import { v4 as uuidv4 } from 'uuid';

import { getBrowser, isChrome, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { Version } from '@proton/shared/lib/helpers/version';
import type { DecryptedKey } from '@proton/shared/lib/interfaces';

import { Logger } from '../shared/Logger';
import { PersistentLatestEventIdProvider } from '../shared/PersistentLatestEventIdProvider';
import { SearchDB } from '../shared/SearchDB';
import { InvalidSearchModuleState, listenForWorkerErrors } from '../shared/errors';
import type { SearchEnvironmentIncompatibilityReason } from '../shared/searchMetrics';
import { searchMetrics } from '../shared/searchMetrics';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type {
    ClientId,
    IndexKind,
    SearchModuleState,
    SearchQuery,
    SearchResultItem,
    SerializedIndexEntry,
    UserId,
} from '../shared/types';
import { AppVersionGuard } from './AppVersionGuard';
import type { FetchLastEventIdForTreeScopeId } from './MainThreadBridge';
import { MainThreadBridge } from './MainThreadBridge';
import { SearchOptInManager } from './SearchOptInManager';
import type { ThrottledSearchSdkDriveClient } from './ThrottledSearchSdkDriveClient';
import { createThrottledSearchSdkDriveClient } from './ThrottledSearchSdkDriveClient';
import { WorkerClient } from './WorkerClient';

// `isEnvironmentCompatible` may run several times per page (e.g. by
// `useSearchModule` re-renders), but we only want one cohort sample per session.
let environmentIncompatibilityRecorded = false;
function recordEnvironmentIncompatibilityOnce(reason: SearchEnvironmentIncompatibilityReason): void {
    if (environmentIncompatibilityRecorded) {
        return;
    }
    environmentIncompatibilityRecorded = true;
    searchMetrics.markIncompatibilityEnvironment({ reason });

    // Log once to the console so a user's report of a non-activated search experience
    // can be traced back to the specific reason their environment was rejected.
    Logger.info(`Search unavailable - environment incompatible, reason <${reason}>`);
}

const INDEXED_DB_PROBE_NAME = 'proton-drive-search-idb-probe';

/**
 * `indexedDB` can be defined but still unusable (e.g. storage is disabled by an admin policy
 * or the user or an extension). Probe by creating and deleting a real dummy database rather
 * than trusting the global's mere presence.
 */
async function isIndexedDBReallyAvailable(): Promise<boolean> {
    try {
        const db = await new Promise<IDBDatabase>((resolve, reject) => {
            const request = indexedDB.open(INDEXED_DB_PROBE_NAME);
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
        db.close();
        indexedDB.deleteDatabase(INDEXED_DB_PROBE_NAME);
        return true;
    } catch (e) {
        Logger.error('Bad env: IndexedDB defined but not usable', e);
        return false;
    }
}

// All required dependencies to initialize and run the search module.
export type SearchModuleContext = {
    appVersion: string;
    userId: UserId;
    driveClient: ProtonDriveClient;
    createSearchDriveInstance: (params: { latestEventIdProvider: LatestEventIdProvider }) => ProtonDriveClient;
    fetchLastEventIdForTreeScopeId: FetchLastEventIdForTreeScopeId;
    getUserKeys: () => Promise<DecryptedKey[]>;
};

export class SearchModule {
    private static instance: SearchModule | null = null;

    // Guards against concurrent getOrCreate calls racing through the async init.
    private static creating: Promise<SearchModule> | null = null;
    private state: SearchModuleState = {
        isUserOptIn: false,
        isIndexing: false,
        isRunningOutdatedVersion: false,
        isSearchable: false,
        permanentError: null,
        indexPopulatorStatuses: [],
    };

    // Callbacks notified whenever the search module state changes (e.g. React hooks).
    private stateUpdateListeners = new Set<(state: SearchModuleState) => void>();

    // Receives state updates from the SharedWorker (EngineOrchestrator) via BroadcastChannel.
    // Never closed: lives for the page lifetime.
    private updateChannel: SearchModuleStateUpdateChannel;
    private workerClient: WorkerClient;
    private optInManager: SearchOptInManager;
    private throttledSdkDriveClient: ThrottledSearchSdkDriveClient;

    // The only SearchDB connection for the main thread.
    // The search sharedworker will have its own instance too.
    private searchDbPromise: Promise<SearchDB>;

    private constructor(context: SearchModuleContext) {
        if (SearchModule.instance) {
            throw new InvalidSearchModuleState('SearchModule singleton already exists');
        }

        const clientId = uuidv4() as ClientId;

        this.searchDbPromise = SearchDB.open(context.userId);

        const latestEventIdProvider = new PersistentLatestEventIdProvider(this.searchDbPromise);
        const driveClientForSearchEvents = context.createSearchDriveInstance({ latestEventIdProvider });

        this.throttledSdkDriveClient = createThrottledSearchSdkDriveClient(context.driveClient);

        const bridge = new MainThreadBridge(
            this.throttledSdkDriveClient.client,
            driveClientForSearchEvents,
            latestEventIdProvider,
            context.fetchLastEventIdForTreeScopeId,
            context.getUserKeys
        );
        this.workerClient = new WorkerClient(context.userId, context.appVersion, clientId, bridge);

        this.updateChannel = createSearchModuleStateUpdateChannel(context.userId);
        this.updateChannel.onmessage = ({ data: patch }) => {
            const changedKeys = Object.keys(patch) as (keyof SearchModuleState)[];
            const hasChanged = changedKeys.some((k) => patch[k] !== this.state[k]);

            if (!hasChanged) {
                return;
            }

            this.setState({ ...this.state, ...patch });
        };

        this.optInManager = new SearchOptInManager(context.userId, this.searchDbPromise);

        Logger.listenForWorkerLogs();
        listenForWorkerErrors();
    }

    static getOrCreate(context: SearchModuleContext): Promise<SearchModule> {
        if (SearchModule.instance) {
            return Promise.resolve(SearchModule.instance);
        }

        if (!SearchModule.creating) {
            SearchModule.creating = (async () => {
                Logger.info('Creating search module singleton');

                if (!(await SearchModule.isEnvironmentCompatible())) {
                    throw new InvalidSearchModuleState('Incompatible environment for SearchModule');
                }

                SearchModule.instance = new SearchModule(context);

                const [isUserOptIn, indexerState] = await Promise.all([
                    SearchModule.instance.optInManager.isOptedIn(),
                    SearchModule.instance.workerClient.queryIndexerState(),
                ]);
                Logger.info(isUserOptIn ? 'Search: Opt-in user detected' : 'Search: User not opted in');
                SearchModule.instance.setState({
                    ...SearchModule.instance.state,
                    isUserOptIn,
                    ...indexerState,
                });

                new AppVersionGuard(context.userId, async () => SearchModule.instance?.deactivate());

                return SearchModule.instance;
            })().catch((error) => {
                SearchModule.instance = null;
                SearchModule.creating = null;
                throw error;
            });
        }

        return SearchModule.creating;
    }

    /** Register with the worker and begin indexing. */
    start(): void {
        this.workerClient.start();
    }

    /** Call when the user opts in to the search experience. */
    async optIn(): Promise<void> {
        await this.optInManager.optIn();
        searchMetrics.markOptIn({ kind: 'manual' });
        this.setState({ ...this.state, isUserOptIn: true });
    }

    getState(): SearchModuleState {
        return this.state;
    }

    onStateChange(cb: (state: SearchModuleState) => void): () => void {
        this.stateUpdateListeners.add(cb);
        return () => {
            this.stateUpdateListeners.delete(cb);
        };
    }

    private setState(state: SearchModuleState): void {
        this.state = state;
        this.stateUpdateListeners.forEach((cb) => cb(state));
    }

    private async deactivate(): Promise<void> {
        const searchDb = await this.searchDbPromise;
        searchDb.close();

        this.workerClient.dispose();
        this.updateChannel.close();
        this.optInManager.dispose();
        this.throttledSdkDriveClient.dispose();
        this.setState({
            isRunningOutdatedVersion: true,
            isIndexing: false,
            isSearchable: false,
            permanentError: null,
            isUserOptIn: false,
            indexPopulatorStatuses: [],
        });
    }

    /** Trigger a re-index for a specific populator by UID. */
    async reindexPopulator(uid: string): Promise<void> {
        await this.workerClient.reindexPopulator(uid);
    }

    /** Clear all search data and stop the search module. */
    async reset(): Promise<void> {
        await this.workerClient.reset();
    }

    /**
     * Wipe the index and restart indexing from scratch. Opt-in and encryption key
     * are preserved so the user doesn't have to opt in again. Used to recover from
     * permanent indexing errors.
     */
    async rebuild(): Promise<void> {
        await this.workerClient.rebuild();
        this.start();
    }

    async *search(query: SearchQuery): AsyncGenerator<SearchResultItem> {
        yield* this.workerClient.search(query);
    }

    /** Stream every entry of a given index. */
    exportIndexEntries(kind: IndexKind): AsyncGenerator<SerializedIndexEntry> {
        return this.workerClient.exportIndexEntries(kind);
    }

    async getIndexByteSize(kind: IndexKind): Promise<number> {
        return this.workerClient.getIndexByteSize(kind);
    }

    async removeIndexEntry(kind: IndexKind, identifier: string): Promise<void> {
        await this.workerClient.removeIndexEntry(kind, identifier);
    }

    // TODO: Return a discriminated type instead of true/false to propagate the reason of uncomatibitly
    // TODO: Add some UI to explain better why search is not enabled.
    static async isEnvironmentCompatible(): Promise<boolean> {
        if (isMobile()) {
            recordEnvironmentIncompatibilityOnce('mobile');
            return false;
        }

        // Old Safari (<17) has several issues.
        // One: it is throttling a lot. First tens of items are done fast but
        // after ~ 500 items it goes very slowly and after ~ 2500 items it
        // basically stops without any progress.
        // Second: in some cases even if indexing finishes, sometimes search
        // doesnt work. Probably index is not created correctly. Its just few
        // reported cases and we haven't found the issue yet.
        // Because of that, its better to not allow search on Safari at all
        // until we find some way around it.
        if (isSafari()) {
            const browser = getBrowser();
            if (!browser?.version || !new Version(browser.version).isGreaterThanOrEqual('17')) {
                recordEnvironmentIncompatibilityOnce('safari_too_old');
                return false;
            }
        }

        // Chrome < 96 lacks the WebAssembly reference-types proposal (externref), which our
        // wasm-bindgen-built search engine requires - WebAssembly.instantiateStreaming() throws
        // every time on older builds.
        if (isChrome()) {
            const browser = getBrowser();
            if (!browser?.version || !new Version(browser.version).isGreaterThanOrEqual('96')) {
                recordEnvironmentIncompatibilityOnce('chrome_too_old');
                return false;
            }
        }

        if (typeof SharedWorker === 'undefined') {
            recordEnvironmentIncompatibilityOnce('shared_worker_unsupported');
            return false;
        }

        if (typeof indexedDB === 'undefined') {
            recordEnvironmentIncompatibilityOnce('indexed_db_unsupported');
            return false;
        }

        if (!(await isIndexedDBReallyAvailable())) {
            recordEnvironmentIncompatibilityOnce('indexed_db_probe_failed');
            return false;
        }

        // The search engine is a WASM module; without WebAssembly it can never build. Seen in the
        // wild from environments that strip the global (e.g. security software or a spoofed UA).
        if (typeof WebAssembly === 'undefined') {
            recordEnvironmentIncompatibilityOnce('webassembly_unsupported');
            return false;
        }

        return true;
    }

    /** @internal Reset singleton state — only for use in tests. */
    static resetForTesting(): void {
        SearchModule.instance = null;
        SearchModule.creating = null;
    }
}

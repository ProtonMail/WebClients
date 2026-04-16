import type { ProtonDriveClient } from '@protontech/drive-sdk';
import { v4 as uuidv4 } from 'uuid';

import { getBrowser, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { Version } from '@proton/shared/lib/helpers/version';

import { Logger } from '../shared/Logger';
import type { PersistentLatestEventIdProvider } from '../shared/PersistentLatestEventIdProvider';
import { InvalidSearchModuleState, listenForWorkerErrors } from '../shared/errors';
import type { SearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from '../shared/searchModuleStateUpdateChannel';
import type { ClientId, SearchModuleState, SearchQuery, SearchResultItem, UserId } from '../shared/types';
import { AppVersionGuard } from './AppVersionGuard';
import type { FetchLastEventIdForTreeScopeId } from './MainThreadBridge';
import { MainThreadBridge } from './MainThreadBridge';
import { SearchOptInManager } from './SearchOptInManager';
import { WorkerClient } from './WorkerClient';

// All required dependencies to initialize and run the search module.
export type SearchModuleContext = {
    appVersion: string;
    userId: UserId;
    driveClient: ProtonDriveClient;
    driveClientForSearchEvents: ProtonDriveClient;
    latestEventIdProvider: PersistentLatestEventIdProvider;
    fetchLastEventIdForTreeScopeId: FetchLastEventIdForTreeScopeId;
};

export class SearchModule {
    private static instance: SearchModule | null = null;

    // Guards against concurrent getOrCreate calls racing through the async init.
    private static creating: Promise<SearchModule> | null = null;
    private state: SearchModuleState = {
        isUserOptIn: false,
        isInitialIndexing: false,
        isIndexing: false,
        isSearchable: false,
        isRunningOutdatedVersion: false,
        permanentError: null,
    };

    // Callbacks notified whenever the search module state changes (e.g. React hooks).
    private stateUpdateListeners = new Set<(state: SearchModuleState) => void>();

    // Receives state updates from the SharedWorker (EngineOrchestrator) via BroadcastChannel.
    // Never closed: lives for the page lifetime.
    private updateChannel: SearchModuleStateUpdateChannel;
    private workerClient: WorkerClient;
    private optInManager: SearchOptInManager;

    private constructor(context: SearchModuleContext) {
        if (!SearchModule.isEnvironmentCompatible()) {
            throw new InvalidSearchModuleState('Incompatible environment for SearchModule');
        }

        if (SearchModule.instance) {
            throw new InvalidSearchModuleState('SearchModule singleton already exists');
        }

        const clientId = uuidv4() as ClientId;

        const bridge = new MainThreadBridge(
            context.driveClient,
            context.driveClientForSearchEvents,
            context.latestEventIdProvider,
            context.fetchLastEventIdForTreeScopeId
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

        this.optInManager = new SearchOptInManager(context.userId);

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

                new AppVersionGuard(context.userId, () => SearchModule.instance?.deactivate());

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

    private deactivate(): void {
        this.workerClient.dispose();
        this.updateChannel.close();
        this.optInManager.dispose();
        this.setState({
            isRunningOutdatedVersion: true,
            isInitialIndexing: false,
            isIndexing: false,
            isSearchable: false,
            permanentError: null,
            isUserOptIn: false,
        });
    }

    /** Clear all search data and stop the search module. */
    async reset(): Promise<void> {
        await this.workerClient.reset();
    }

    async *search(query: SearchQuery): AsyncGenerator<SearchResultItem> {
        yield* this.workerClient.search(query);
    }

    // TODO: Return a discriminated type instead of true/false to propagate the reason of uncomatibitly
    // TODO: Add some UI to explain better why search is not enabled.
    // TODO: Instrument the uncompatibility reason (once per user/session/browser only)
    static isEnvironmentCompatible(): boolean {
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
                Logger.info('Bad env: Obsolete safari unsupported');
                return false;
            }
        }

        if (typeof SharedWorker === 'undefined') {
            Logger.info('Bad env: SharedWorker unsupported');
            return false;
        }

        if (typeof indexedDB === 'undefined') {
            Logger.info('Bad env: IndexedDB unsupported');
            return false;
        }

        // TODO: Check for indexedDB real availability by creating/deleting a real dummy DB.

        if (isMobile()) {
            Logger.info('Bad env: Mobile detected');
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

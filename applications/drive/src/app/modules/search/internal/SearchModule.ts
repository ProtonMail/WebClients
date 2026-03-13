import type { ProtonDriveClient } from '@protontech/drive-sdk';
import { v4 as uuidv4 } from 'uuid';

import type { LatestEventIdProvider } from '@proton/drive/internal/latestEventIdProvider';
import { getBrowser, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { Version } from '@proton/shared/lib/helpers/version';

import { Logger } from './Logger';
import { MainThreadBridge } from './MainThreadBridge';
import type { SearchModuleStateUpdateChannel } from './searchModuleStateUpdateChannel';
import { createSearchModuleStateUpdateChannel } from './searchModuleStateUpdateChannel';
import type { ClientId, SearchModuleState, SearchQuery, SearchResultItem, UserId } from './types';
import { WorkerClient } from './workerClient';

let instance: SearchModule | null = null;

// All required dependencies to initialize and run the search module.
export type SearchModuleContext = {
    userId: UserId;
    driveClient: ProtonDriveClient;
    driveClientForSearchEvents: ProtonDriveClient;
    latestEventIdProvider: LatestEventIdProvider;
};

export class SearchModule {
    private state: SearchModuleState = {
        isInitialIndexing: false,
        isSearchable: false,
    };

    // Callbacks notified whenever the search module state changes (e.g. React hooks).
    private stateUpdateListeners = new Set<(state: SearchModuleState) => void>();

    // Receives state updates from the SharedWorker (EngineOrchestrator) via BroadcastChannel.
    // Never closed: lives for the page lifetime.
    private updateChannel: SearchModuleStateUpdateChannel;
    private workerClient: WorkerClient;

    private constructor(context: SearchModuleContext) {
        if (!SearchModule.isEnvironmentCompatible()) {
            throw new Error(`Incompatible environment for SearchModule`);
        }

        if (instance) {
            throw new Error(`SearchModule singleton already exists`);
        }

        // Create a unique ID to this client instance (e.g. a browser tab or window)
        // so the search worker can distinguish between concurrent clients.
        const clientId = uuidv4() as ClientId;

        const bridge = new MainThreadBridge(context.driveClient);
        this.workerClient = new WorkerClient(context.userId, clientId, bridge);

        this.updateChannel = createSearchModuleStateUpdateChannel(context.userId);
        this.updateChannel.onmessage = ({ data: newState }) => {
            let key: keyof SearchModuleState;
            for (key in newState) {
                // If any field changed in the state, update the whole state.
                if (newState[key] !== this.state[key]) {
                    this.setState(newState);
                    break;
                }
            }
        };

        Logger.listenForWorkerLogs();
    }

    static getOrCreate(context: SearchModuleContext): SearchModule {
        if (instance) {
            return instance;
        }

        Logger.info('Creating search module singleton');
        instance = new SearchModule(context);

        return instance;
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

    async *search(query: SearchQuery): AsyncGenerator<SearchResultItem> {
        yield* this.workerClient.search(query);
    }

    static isEnvironmentCompatible(): boolean {
        if (isSafari()) {
            // Old Safari (<17) has several issues.
            // One: it is throttling a lot. First tens of items are done fast but
            // after ~ 500 items it goes very slowly and after ~ 2500 items it
            // basically stops without any progress.
            // Second: in some cases even if indexing finishes, sometimes search
            // doesnt work. Probably index is not created correctly. Its just few
            // reported cases and we haven't found the issue yet.
            // Because of that, its better to not allow search on Safari at all
            // until we find some way around it.
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
            Logger.info('Bad env: Indexed unsupported');
            return false;
        }

        // TODO: Check for indexedDB real availability by creating/deleting a real dummy DB.

        if (isMobile()) {
            Logger.info('Bad env: Mobile detected');
            return false;
        }

        return true;
    }
}

import type { ProtonDriveClient } from '@protontech/drive-sdk';
import { v4 as uuidv4 } from 'uuid';

import type { LatestEventIdProvider } from '@proton/drive/internal/latestEventIdProvider';
import { getBrowser, isMobile, isSafari } from '@proton/shared/lib/helpers/browser';
import { Version } from '@proton/shared/lib/helpers/version';

import { Logger } from './Logger';
import { MainThreadBridge } from './MainThreadBridge';
import type { ClientId, UserId } from './types';
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
    private clientId: ClientId;

    private constructor(context: SearchModuleContext) {
        if (!SearchModule.isEnvironmentCompatible()) {
            throw new Error(`Incompatible environment for SearchModule`);
        }

        if (instance) {
            throw new Error(`SearchModule singleton already exists`);
        }

        // Assign a unique ID to this client instance (e.g. a browser tab or window)
        // so the search worker can distinguish between concurrent clients.
        this.clientId = uuidv4() as ClientId;

        new WorkerClient(context.userId, this.clientId, new MainThreadBridge(context.driveClient));

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

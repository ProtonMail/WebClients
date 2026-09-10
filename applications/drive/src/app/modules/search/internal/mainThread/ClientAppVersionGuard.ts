import { Logger } from '../shared/Logger';

/**
 * Ensures this client (tab) deactivates its search module when it is no longer running the
 * same version as the active search SharedWorker(s) for this user.
 *
 * Listens only - the search SharedWorker (see shared/searchAppVersionChannel.ts) is what
 * broadcasts `appVersion` on this same channel name, once per worker instance. When a message
 * arrives with a version different from this tab's own, fires the `onMismatch` callback so the
 * caller can react (e.g. deactivate the search module). This is what lets an old tab deactivate
 * itself for free the moment a new deploy's worker boots, with no coordination beyond the shared
 * channel name.
 */
type BroadcastChannelConstructor = new (name: string) => BroadcastChannel;

export class ClientAppVersionGuard {
    private channel: BroadcastChannel;

    constructor(
        userId: string,
        private appVersion: string,
        private onMismatch: () => void,
        ChannelImpl: BroadcastChannelConstructor = BroadcastChannel
    ) {
        this.channel = new ChannelImpl(`search-app-version:${userId}`);
        this.channel.onmessage = ({ data: theirVersion }: MessageEvent<string>) => {
            if (theirVersion !== this.appVersion) {
                Logger.info(
                    `Search version mismatch (ours: ${this.appVersion}, theirs: ${theirVersion}), deactivating search module`
                );
                this.onMismatch();
            }
        };
        // NOTE: To test locally: new BroadcastChannel('search-app-version:<userId>').postMessage('fake-version');
    }

    dispose() {
        this.channel.close();
    }
}

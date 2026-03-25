import { Logger } from '../shared/Logger';

/**
 * Detects app version mismatches across tabs using BroadcastChannel.
 *
 * On creation, broadcasts the current version to all other tabs listening on
 * the same channel. When a message arrives with a different version, fires the
 * `onMismatch` callback so the caller can react (e.g. deactivate the search module).
 */
type BroadcastChannelConstructor = new (name: string) => BroadcastChannel;

// Bump this version on any major changes.
const CURRENT_SEARCH_VERSION = 1;

export class AppVersionGuard {
    private channel: BroadcastChannel;

    constructor(
        userId: string,
        private onMismatch: () => void,
        ChannelImpl: BroadcastChannelConstructor = BroadcastChannel
    ) {
        this.channel = new ChannelImpl(`search-app-version:${userId}`);
        this.channel.postMessage(CURRENT_SEARCH_VERSION);
        this.channel.onmessage = ({ data: theirVersion }: MessageEvent<number>) => {
            if (theirVersion !== CURRENT_SEARCH_VERSION) {
                Logger.info(
                    `Search version mismatch (ours: ${CURRENT_SEARCH_VERSION}, theirs: ${theirVersion}), deactivating search module`
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

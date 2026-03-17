import { Logger } from './Logger';

/**
 * Detects app version mismatches across tabs using BroadcastChannel.
 *
 * On creation, broadcasts the current version to all other tabs listening on
 * the same channel. When a message arrives with a different version, fires the
 * `onMismatch` callback so the caller can react (e.g. deactivate the search module).
 */
type BroadcastChannelConstructor = new (name: string) => BroadcastChannel;

export class AppVersionGuard {
    private channel: BroadcastChannel;

    constructor(
        userId: string,
        private appVersion: string,
        private onMismatch: () => void,
        ChannelImpl: BroadcastChannelConstructor = BroadcastChannel
    ) {
        this.channel = new ChannelImpl(`search-app-version:${userId}`);
        this.channel.postMessage(appVersion);
        this.channel.onmessage = ({ data: newVersion }: MessageEvent<string>) => {
            if (newVersion !== this.appVersion) {
                Logger.info(
                    `App version mismatch (ours: ${this.appVersion}, theirs: ${newVersion}), deactivating search module`
                );
                this.onMismatch();
            }
            // NOTE: To test locally: new BroadcastChannel('search-app-version:<userId>').postMessage('fake-version');
        };
    }

    dispose() {
        this.channel.close();
    }
}

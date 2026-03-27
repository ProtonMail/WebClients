import { FakeBroadcastChannel } from '../testing/FakeBroadcastChannel';
import { AppVersionGuard, CURRENT_SEARCH_VERSION } from './AppVersionGuard';

const DIFFERENT_SEARCH_VERSION = CURRENT_SEARCH_VERSION + 1;

describe('AppVersionGuard', () => {
    beforeEach(() => {
        FakeBroadcastChannel.reset();
    });

    it('does not fire onMismatch when same version is posted', () => {
        const onMismatch = jest.fn();
        new AppVersionGuard('user-1', onMismatch, FakeBroadcastChannel);

        // Simulate another tab with the same version
        const channel = new FakeBroadcastChannel('search-app-version:user-1');
        channel.postMessage(CURRENT_SEARCH_VERSION);

        // The constructor posts the version, so guard1 receives version 1 from guard2
        expect(onMismatch).not.toHaveBeenCalled();
    });

    it('fires onMismatch when a different version is posted', () => {
        const onMismatch = jest.fn();
        new AppVersionGuard('user-1', onMismatch, FakeBroadcastChannel);

        // Simulate another tab with a different version
        const channel = new FakeBroadcastChannel('search-app-version:user-1');
        channel.postMessage(DIFFERENT_SEARCH_VERSION);

        expect(onMismatch).toHaveBeenCalledTimes(1);
    });

    it('scopes by userId — different users do not interfere', () => {
        const onMismatch = jest.fn();
        new AppVersionGuard('user-1', onMismatch, FakeBroadcastChannel);

        // Different user posts a different version
        const channel = new FakeBroadcastChannel('search-app-version:user-2');
        channel.postMessage(DIFFERENT_SEARCH_VERSION);

        expect(onMismatch).not.toHaveBeenCalled();
    });

    it('stops receiving after dispose', () => {
        const onMismatch = jest.fn();
        const guard = new AppVersionGuard('user-1', onMismatch, FakeBroadcastChannel);
        guard.dispose();

        const channel = new FakeBroadcastChannel('search-app-version:user-1');
        channel.postMessage(DIFFERENT_SEARCH_VERSION);

        expect(onMismatch).not.toHaveBeenCalled();
    });
});

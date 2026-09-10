import { FakeBroadcastChannel } from '../testing/FakeBroadcastChannel';
import { ClientAppVersionGuard } from './ClientAppVersionGuard';

const OUR_VERSION = 'v1';
const DIFFERENT_VERSION = 'v2';

describe('ClientAppVersionGuard', () => {
    beforeEach(() => {
        FakeBroadcastChannel.reset();
    });

    it('does not fire onMismatch when the same version is posted', () => {
        const onMismatch = jest.fn();
        new ClientAppVersionGuard('user-1', OUR_VERSION, onMismatch, FakeBroadcastChannel);

        // Simulate the search SharedWorker announcing its (matching) version
        const channel = new FakeBroadcastChannel('search-app-version:user-1');
        channel.postMessage(OUR_VERSION);

        expect(onMismatch).not.toHaveBeenCalled();
    });

    it('fires onMismatch when a different version is posted', () => {
        const onMismatch = jest.fn();
        new ClientAppVersionGuard('user-1', OUR_VERSION, onMismatch, FakeBroadcastChannel);

        // Simulate the search SharedWorker announcing a different version
        const channel = new FakeBroadcastChannel('search-app-version:user-1');
        channel.postMessage(DIFFERENT_VERSION);

        expect(onMismatch).toHaveBeenCalledTimes(1);
    });

    it('scopes by userId — different users do not interfere', () => {
        const onMismatch = jest.fn();
        new ClientAppVersionGuard('user-1', OUR_VERSION, onMismatch, FakeBroadcastChannel);

        // Different user posts a different version
        const channel = new FakeBroadcastChannel('search-app-version:user-2');
        channel.postMessage(DIFFERENT_VERSION);

        expect(onMismatch).not.toHaveBeenCalled();
    });

    it('stops receiving after dispose', () => {
        const onMismatch = jest.fn();
        const guard = new ClientAppVersionGuard('user-1', OUR_VERSION, onMismatch, FakeBroadcastChannel);
        guard.dispose();

        const channel = new FakeBroadcastChannel('search-app-version:user-1');
        channel.postMessage(DIFFERENT_VERSION);

        expect(onMismatch).not.toHaveBeenCalled();
    });
});

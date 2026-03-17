import { AppVersionGuard } from './AppVersionGuard';
import { FakeBroadcastChannel } from './testing/FakeBroadcastChannel';

jest.mock('./Logger', () => ({
    Logger: { info: jest.fn() },
}));

beforeEach(() => {
    FakeBroadcastChannel.reset();
});

const Channel = FakeBroadcastChannel;
const noop = () => {};

describe('AppVersionGuard', () => {
    it('calls onMismatch when another tab broadcasts a different version', () => {
        const onMismatch = jest.fn();
        const guard = new AppVersionGuard('user1', 'v1', onMismatch, Channel);

        // A second tab starts with v2 — its constructor broadcasts "v2"
        const otherTab = new AppVersionGuard('user1', 'v2', noop, Channel);

        expect(onMismatch).toHaveBeenCalledTimes(1);

        otherTab.dispose();
        guard.dispose();
    });

    it('does not fire when versions match', () => {
        const onMismatch = jest.fn();
        const guard = new AppVersionGuard('user1', 'v1', onMismatch, Channel);

        const otherTab = new AppVersionGuard('user1', 'v1', noop, Channel);

        expect(onMismatch).not.toHaveBeenCalled();

        otherTab.dispose();
        guard.dispose();
    });

    it('scopes by userId — different users do not interfere', () => {
        const onMismatch = jest.fn();
        const guard = new AppVersionGuard('alice', 'v1', onMismatch, Channel);

        const otherUser = new AppVersionGuard('bob', 'v2', noop, Channel);

        expect(onMismatch).not.toHaveBeenCalled();

        otherUser.dispose();
        guard.dispose();
    });

    it('the newer tab also gets notified of the mismatch', () => {
        const oldTab = new AppVersionGuard('user1', 'v1', noop, Channel);

        const onMismatch = jest.fn();
        const newTab = new AppVersionGuard('user1', 'v2', onMismatch, Channel);

        // Old tab is still alive — simulate it broadcasting again (e.g. page reload)
        const anotherOldTab = new AppVersionGuard('user1', 'v1', noop, Channel);

        expect(onMismatch).toHaveBeenCalledTimes(1);

        oldTab.dispose();
        newTab.dispose();
        anotherOldTab.dispose();
    });

    it('stops receiving messages after dispose', () => {
        const onMismatch = jest.fn();
        const guard = new AppVersionGuard('user1', 'v1', onMismatch, Channel);

        guard.dispose();

        // A new tab broadcasts — but guard is already disposed
        const otherTab = new AppVersionGuard('user1', 'v2', noop, Channel);

        expect(onMismatch).not.toHaveBeenCalled();

        otherTab.dispose();
    });
});

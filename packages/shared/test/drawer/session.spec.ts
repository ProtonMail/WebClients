import { APPS } from '../../lib/constants';
import { DRAWER_EVENTS } from '../../lib/drawer/interfaces';
import { resumeSessionDrawerApp } from '../../lib/drawer/session';

const MOCK_SESSION_PAYLOAD = {
    UID: 'test-uid',
    keyPassword: 'test-password',
    User: { ID: 'user-id' },
    localID: 0,
    clientKey: 'client-key',
    offlineKey: undefined,
    persistent: true,
    trusted: true,
    tag: undefined,
    persistedSession: undefined,
};

const dispatchSessionEvent = () => {
    window.dispatchEvent(
        new MessageEvent('message', {
            origin: 'https://mail.proton.me',
            data: { type: DRAWER_EVENTS.SESSION, payload: MOCK_SESSION_PAYLOAD },
        })
    );
};

describe('resumeSessionDrawerApp', () => {
    beforeEach(() => {
        jasmine.clock().install();
        spyOn(window.parent, 'postMessage');
    });

    afterEach(() => {
        jasmine.clock().uninstall();
    });

    it('sends READY immediately on start', () => {
        void resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });

        expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
        expect(window.parent.postMessage).toHaveBeenCalledWith({ type: DRAWER_EVENTS.READY }, jasmine.any(String));
    });

    it('resolves with session data when SESSION is received on first READY', async () => {
        const promise = resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });

        dispatchSessionEvent();

        const result = await promise;
        expect(result.UID).toBe(MOCK_SESSION_PAYLOAD.UID);
    });

    it('retries READY after 3s if no response', () => {
        void resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });

        expect(window.parent.postMessage).toHaveBeenCalledTimes(1);

        jasmine.clock().tick(3000);

        expect(window.parent.postMessage).toHaveBeenCalledTimes(2);
    });

    it('resolves when SESSION arrives after a retry', async () => {
        const promise = resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });

        jasmine.clock().tick(3000);
        dispatchSessionEvent();

        const result = await promise;
        expect(result.UID).toBe(MOCK_SESSION_PAYLOAD.UID);
    });

    it('rejects after all retries are exhausted', async () => {
        const promise = resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });

        jasmine.clock().tick(9000);

        expect(window.parent.postMessage).toHaveBeenCalledTimes(3);

        let error: unknown;
        try {
            await promise;
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
    });

    it('removes the message listener and cancels pending retries on resolve', async () => {
        const removeListenerSpy = spyOn(window, 'removeEventListener').and.callThrough();

        const promise = resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });
        dispatchSessionEvent();
        await promise;

        expect(removeListenerSpy).toHaveBeenCalledWith('message', jasmine.any(Function));

        // No further READY messages after resolution
        jasmine.clock().tick(9000);
        expect(window.parent.postMessage).toHaveBeenCalledTimes(1);
    });

    it('removes the message listener on reject', async () => {
        const removeListenerSpy = spyOn(window, 'removeEventListener').and.callThrough();

        const promise = resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });
        jasmine.clock().tick(9000);
        await promise.catch(() => {});

        expect(removeListenerSpy).toHaveBeenCalledWith('message', jasmine.any(Function));
    });

    it('ignores messages from unauthorized origins', async () => {
        const promise = resumeSessionDrawerApp({ parentApp: APPS.PROTONMAIL, localID: 0 });

        // Dispatch from an origin that will fail getIsDrawerPostMessage
        window.dispatchEvent(
            new MessageEvent('message', {
                origin: 'https://scam.proton.me',
                data: { type: DRAWER_EVENTS.SESSION, payload: MOCK_SESSION_PAYLOAD },
            })
        );

        jasmine.clock().tick(9000);

        let error: unknown;
        try {
            await promise;
        } catch (e) {
            error = e;
        }
        expect(error).toBeDefined();
    });
});

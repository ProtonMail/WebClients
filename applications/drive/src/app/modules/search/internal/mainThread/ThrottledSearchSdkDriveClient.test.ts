import type { MaybeMissingNode, NodeEntity } from '@protontech/drive-sdk';

import { SDKEvent } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { FakeSdkDriveClient } from '../testing/FakeSdkDriveClient';
import { createThrottledSearchSdkDriveClient } from './ThrottledSearchSdkDriveClient';

const delay = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

const makeNode = (uid: string): NodeEntity => createMockNodeEntity({ uid });

class FakeEventEmittingDriveClient extends FakeSdkDriveClient {
    private listeners = new Map<SDKEvent, Set<() => void>>();

    onMessage(eventName: SDKEvent, callback: () => void): () => void {
        const set = this.listeners.get(eventName) ?? new Set();
        set.add(callback);
        this.listeners.set(eventName, set);
        return () => set.delete(callback);
    }

    emit(eventName: SDKEvent): void {
        this.listeners.get(eventName)?.forEach((cb) => cb());
    }
}

describe('createThrottledSearchSdkDriveClient', () => {
    let fakeDrive: FakeEventEmittingDriveClient;

    beforeEach(() => {
        fakeDrive = new FakeEventEmittingDriveClient();
    });

    it('blocks new requests while the SDK reports requestsThrottled, resumes on requestsUnthrottled', async () => {
        fakeDrive.setNode('node-1', makeNode('node-1'));
        const { client } = createThrottledSearchSdkDriveClient(fakeDrive);

        fakeDrive.emit(SDKEvent.RequestsThrottled);

        let resolved = false;
        const pending = client.getNode('node-1').then(() => {
            resolved = true;
        });

        await delay(20);
        expect(resolved).toBe(false);

        fakeDrive.emit(SDKEvent.RequestsUnthrottled);
        await pending;
        expect(resolved).toBe(true);
    });

    it('routes iterateNodes through the same throttle gate as getNode', async () => {
        fakeDrive.setNode('node-1', makeNode('node-1'));
        const { client } = createThrottledSearchSdkDriveClient(fakeDrive);

        fakeDrive.emit(SDKEvent.RequestsThrottled);

        const collected: MaybeMissingNode[] = [];
        let done = false;
        const pending = (async () => {
            for await (const node of client.iterateNodes(['node-1'])) {
                collected.push(node);
            }
            done = true;
        })();

        await delay(20);
        expect(done).toBe(false);
        expect(collected).toHaveLength(0);

        fakeDrive.emit(SDKEvent.RequestsUnthrottled);
        await pending;
        expect(done).toBe(true);
        expect(collected).toEqual([makeNode('node-1')]);
    });

    it('dispose() unsubscribes both listeners so later SDK events have no effect', async () => {
        fakeDrive.setNode('node-1', makeNode('node-1'));
        const { client, dispose } = createThrottledSearchSdkDriveClient(fakeDrive);

        dispose();
        fakeDrive.emit(SDKEvent.RequestsThrottled);

        await expect(client.getNode('node-1')).resolves.toEqual(makeNode('node-1'));
    });
});

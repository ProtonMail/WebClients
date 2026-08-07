import type { NodeEntity } from '@protontech/drive-sdk';

import { ValidationError } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';

import { FakeSdkDriveClient } from '../testing/FakeSdkDriveClient';
import { DriveSdkBridge } from './MainThreadBridge';

const makeNode = (uid: string): NodeEntity => createMockNodeEntity({ uid });

describe('DriveSdkBridge', () => {
    describe('iterateFolderChildrenNodeUids', () => {
        it('returns an empty list without throwing when a follow-up getNode confirms the parent is gone', async () => {
            const fakeDrive = new FakeSdkDriveClient();
            fakeDrive.failNextIterateForFolder('gone', new ValidationError('Node not found'));
            fakeDrive.setGetNodeError('gone', new ValidationError('Node not found'));
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('gone')).resolves.toEqual([]);
        });

        it('rethrows the original ValidationError when a follow-up getNode confirms the parent still exists', async () => {
            const fakeDrive = new FakeSdkDriveClient();
            fakeDrive.setNode('still-here', makeNode('still-here'));
            fakeDrive.failNextIterateForFolder('still-here', new ValidationError('Pagination failed'));
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('still-here')).rejects.toThrow('Pagination failed');
        });

        it('rethrows a non-ValidationError unchanged, without checking getNode', async () => {
            const fakeDrive = new FakeSdkDriveClient();
            fakeDrive.failNextIterateForFolder('folder-1', new Error('network blip'));
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('folder-1')).rejects.toThrow('network blip');
        });
    });
});

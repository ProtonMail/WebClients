import { AbortError, RateLimitedError, ServerError, ValidationError } from '@proton/drive';
import { createMockNodeEntity } from '@proton/drive/modules/testing';
import { API_CUSTOM_ERROR_CODES } from '@proton/shared/lib/errors';

import { FakeSdkDriveClient } from '../testing/FakeSdkDriveClient';
import { DriveSdkBridge } from './MainThreadBridge';

describe('DriveSdkBridge', () => {
    describe('iterateFolderChildrenNodeUids', () => {
        it('returns an empty list without throwing when the folder is gone', async () => {
            const fakeDrive = new FakeSdkDriveClient();
            // The SDK still has the folder cached from the batch that discovered it, so it is
            // fetchable here even though listing its children 404s.
            fakeDrive.setNode('gone', createMockNodeEntity({ uid: 'gone' }));
            fakeDrive.failNextIterateForFolder(
                'gone',
                new ValidationError('File or folder not found', API_CUSTOM_ERROR_CODES.NOT_FOUND)
            );
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('gone')).resolves.toEqual([]);
        });

        it('returns an empty list without throwing when access to the folder was revoked', async () => {
            const fakeDrive = new FakeSdkDriveClient();
            fakeDrive.setNode('locked', createMockNodeEntity({ uid: 'locked' }));
            fakeDrive.failNextIterateForFolder(
                'locked',
                new ValidationError('Not enough permissions', API_CUSTOM_ERROR_CODES.NOT_ALLOWED)
            );
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('locked')).resolves.toEqual([]);
        });

        it('returns an empty list without throwing when the SDK cannot resolve the folder at all', async () => {
            const fakeDrive = new FakeSdkDriveClient();
            // The SDK's own getNode(parent), which runs before listing children, reports a missing
            // parent as an uncoded ValidationError. A code-only check misses it and the walk wedges.
            fakeDrive.failNextIterateForFolder('unresolvable', new ValidationError('Item not found'));
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('unresolvable')).resolves.toEqual([]);
        });

        // The rest of the outcome table: everything that must still fail the task so the queue
        // retries it, rather than silently reporting the folder as empty.
        const rethrown: [string, Error][] = [
            ['a ValidationError code that does not mean unlistable', new ValidationError('Invalid value', 2001)],
            // PERMISSION_DENIED (2026) is "cannot grant permissions", a sharing-only error.
            ['PERMISSION_DENIED, which is sharing-only', new ValidationError('Cannot grant', 2026)],
            ['ALREADY_EXISTS', new ValidationError('Already exists', 2500)],
            ['the quota family', new ValidationError('Insufficient quota', 200001)],
            ['a rate limit', new RateLimitedError('429')],
            ['a server error', new ServerError('503')],
            ['an abort', new AbortError('aborted')],
            ['an offline error', Object.assign(new Error('offline'), { name: 'OfflineError' })],
            ['a plain Error that merely looks like a not-found', new Error('Item not found')],
        ];

        it.each(rethrown)('rethrows %s', async (_label, error) => {
            const fakeDrive = new FakeSdkDriveClient();
            fakeDrive.failNextIterateForFolder('folder-1', error);
            const bridge = new DriveSdkBridge(fakeDrive);

            await expect(bridge.iterateFolderChildrenNodeUids('folder-1')).rejects.toThrow(error.message);
        });
    });
});

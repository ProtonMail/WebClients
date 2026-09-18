import type { FolderData, Share, ShareType } from '../../types';
import { shareCreated, shareDeleted, sharesEventNew } from '../actions';
import foldersReducer, { type FoldersByShareId } from './folders';

const shareA = 'share-a';
const shareB = 'share-b';

const folder = (folderId: string, shareId = shareA): FolderData => ({
    folderId,
    shareId,
    vaultId: 'vault-1',
    parentFolderId: null,
    name: folderId,
    keyRotation: 1,
});

const share = (shareId: string) => ({ shareId }) as Share<ShareType.Vault>;

const state = (folders: FolderData[]): FoldersByShareId =>
    folders.reduce<FoldersByShareId>((acc, f) => {
        (acc[f.shareId] ??= {})[f.folderId] = f;
        return acc;
    }, {});

describe('`foldersReducer`', () => {
    describe('`sharesEventNew`', () => {
        test('merges the folders of incoming shares', () => {
            const initial = state([folder('f1')]);
            const action = sharesEventNew({ shares: {}, items: {}, folders: state([folder('g1', shareB)]), v: 1 });

            expect(foldersReducer(initial, action)).toEqual(state([folder('f1'), folder('g1', shareB)]));
        });
    });

    describe('`shareCreated`', () => {
        test('adds the folders of the created share', () => {
            const action = shareCreated({ share: share(shareB), items: [], folders: [folder('g1', shareB)] });

            expect(foldersReducer({}, action)).toEqual(state([folder('g1', shareB)]));
        });

        test('wipes stale folders of a re-created share', () => {
            const initial = state([folder('stale', shareB), folder('f1')]);
            const action = shareCreated({ share: share(shareB), items: [], folders: [folder('fresh', shareB)] });

            expect(foldersReducer(initial, action)).toEqual(state([folder('f1'), folder('fresh', shareB)]));
        });
    });

    describe('share removal', () => {
        test('drops every folder of a deleted share', () => {
            const initial = state([folder('f1'), folder('g1', shareB)]);
            const next = foldersReducer(initial, shareDeleted(share(shareA)));

            expect(next).toEqual(state([folder('g1', shareB)]));
            expect(shareA in next).toBe(false);
        });

        test('noops for a share with no folders', () => {
            const initial = state([folder('f1')]);
            expect(foldersReducer(initial, shareDeleted(share(shareB)))).toEqual(initial);
        });
    });
});

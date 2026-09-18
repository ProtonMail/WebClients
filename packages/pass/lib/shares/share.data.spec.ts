import noop from '@proton/utils/noop';

import type { FolderData, ItemRevision } from '../../types';
import { ShareType } from '../../types';
import { logger } from '../../utils/logger';
import * as folderRequests from '../folders/folders.requests';
import * as itemRequests from '../items/item.requests';
import { requestShareData, requestSharesData } from './share.data';
import { createTestShare } from './share.test.utils';

jest.mock('../folders/folders.requests', () => ({
    ...jest.requireActual('../folders/folders.requests'),
    requestFoldersForShareId: jest.fn(),
}));

jest.mock('../items/item.requests', () => ({
    ...jest.requireActual('../items/item.requests'),
    requestItemsForShareId: jest.fn(),
}));

const requestFoldersForShareId = jest.mocked(folderRequests.requestFoldersForShareId);
const requestItemsForShareId = jest.mocked(itemRequests.requestItemsForShareId);
jest.spyOn(logger, 'warn').mockImplementation(noop);

const folder = (folderId: string, shareId: string) => ({ folderId, shareId }) as FolderData;
const item = (itemId: string, shareId: string) => ({ itemId, shareId }) as ItemRevision;

const flush = () => new Promise((resolve) => setTimeout(resolve, 0));

const vaultShare = (shareId: string) => createTestShare({ shareId, targetType: ShareType.Vault });
const itemShare = (shareId: string) => createTestShare({ shareId, targetType: ShareType.Item });

beforeEach(() => {
    jest.clearAllMocks();
    requestFoldersForShareId.mockImplementation(async (shareId) => [folder('f1', shareId)]);
    requestItemsForShareId.mockImplementation(async (shareId) => [item('i1', shareId)]);
});

describe('requestShareData', () => {
    test('does not request items until folders have fully resolved', async () => {
        let resolveFolders!: (folders: FolderData[]) => void;
        requestFoldersForShareId.mockImplementation(() => new Promise((resolve) => (resolveFolders = resolve)));

        const pending = requestShareData(vaultShare('s1'));
        await flush();

        expect(requestFoldersForShareId).toHaveBeenCalledWith('s1');
        expect(requestItemsForShareId).not.toHaveBeenCalled();

        resolveFolders([folder('f1', 's1')]);
        await pending;

        expect(requestItemsForShareId).toHaveBeenCalledWith('s1', undefined);
    });

    test('skips the folder request for item shares', async () => {
        const result = await requestShareData(itemShare('s1'));

        expect(requestFoldersForShareId).not.toHaveBeenCalled();
        expect(result).toEqual({ folders: [], items: [item('i1', 's1')] });
    });

    test('forwards item progress', async () => {
        const onItemProgress = jest.fn();
        await requestShareData(vaultShare('s1'), { onItemProgress });

        expect(requestItemsForShareId).toHaveBeenCalledWith('s1', onItemProgress);
    });

    test('throws on folder failure when no error handler is provided', async () => {
        requestFoldersForShareId.mockRejectedValue(new Error('boom'));

        await expect(requestShareData(vaultShare('s1'))).rejects.toThrow('boom');
        expect(requestItemsForShareId).not.toHaveBeenCalled();
    });

    test('reports and tolerates folder failure when an error handler is provided', async () => {
        const onFolderError = jest.fn();
        requestFoldersForShareId.mockRejectedValue(new Error('boom'));

        const result = await requestShareData(vaultShare('s1'), { onFolderError });

        expect(onFolderError).toHaveBeenCalledWith(new Error('boom'));
        expect(result).toEqual({ folders: [], items: [item('i1', 's1')] });
    });
});

describe('requestSharesData', () => {
    test('keys folders and items by shareId', async () => {
        requestFoldersForShareId.mockImplementation(async (shareId) => (shareId === 's1' ? [folder('f1', 's1')] : []));

        const result = await requestSharesData([vaultShare('s1'), vaultShare('s2'), itemShare('s3')]);

        expect(result).toEqual({
            folders: { s1: { f1: folder('f1', 's1') }, s2: {}, s3: {} },
            items: {
                s1: { i1: item('i1', 's1') },
                s2: { i1: item('i1', 's2') },
                s3: { i1: item('i1', 's3') },
            },
        });
    });

    test('tolerates a folder failure on one share without dropping the others', async () => {
        requestFoldersForShareId.mockImplementation(async (shareId) => {
            if (shareId === 's1') throw new Error('boom');
            return [folder('f1', shareId)];
        });

        const result = await requestSharesData([vaultShare('s1'), vaultShare('s2')]);

        expect(result.folders).toEqual({ s1: {}, s2: { f1: folder('f1', 's2') } });
        expect(Object.keys(result.items)).toEqual(['s1', 's2']);
    });

    test('propagates item failures', async () => {
        requestItemsForShareId.mockRejectedValue(new Error('boom'));

        await expect(requestSharesData([vaultShare('s1')])).rejects.toThrow('boom');
    });
});

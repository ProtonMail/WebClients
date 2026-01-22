import { NodeType } from '@proton/drive/index';
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import { createMockNodeEntity } from '../../../utils/test/nodeEntity';
import { traverseNodeStructure } from './traverseNodeStructure';

jest.mock('@proton/drive/index', () => {
    const actual = jest.requireActual('@proton/drive/index');
    return {
        ...actual,
        getDrive: jest.fn(() => ({
            iterateFolderChildren: jest.fn(),
        })),
    };
});

describe('traverseNodeStructure', () => {
    it('completes traversal when unsupported nodes are skipped', async () => {
        const supportedNode = createMockNodeEntity({
            uid: 'supported',
            name: 'supported.txt',
            mediaType: 'text/plain',
            type: NodeType.File,
        });
        const unsupportedNode = createMockNodeEntity({
            uid: 'unsupported',
            name: 'unsupported.protondoc',
            mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
            type: NodeType.File,
        });
        const supportedSize = supportedNode.activeRevision?.storageSize ?? 0;

        const { nodesQueue, traversalCompletedPromise, parentPathByUid } = traverseNodeStructure(
            [supportedNode, unsupportedNode],
            new AbortController().signal
        );

        const consumedNodes: string[] = [];
        const consumeQueue = (async () => {
            for await (const node of nodesQueue.iterator()) {
                consumedNodes.push(node.uid);
            }
        })();

        const traversalResult = await traversalCompletedPromise;
        await consumeQueue;

        expect(consumedNodes).toEqual(['supported']);
        expect(traversalResult).toEqual({
            totalEncryptedSize: supportedSize,
            containsUnsupportedFile: true,
        });
        expect(parentPathByUid.get('supported')).toEqual([]);
        expect(parentPathByUid.get('unsupported')).toEqual([]);
    });
});

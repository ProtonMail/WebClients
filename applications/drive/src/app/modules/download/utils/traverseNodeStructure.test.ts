import { NodeType } from '@proton/drive/index';
import { createMockNodeEntity } from '@proton/drive/modules/testing';
import { PROTON_DOCS_DOCUMENT_MIMETYPE } from '@proton/shared/lib/helpers/mimetype';

import { traverseNodeStructure } from './traverseNodeStructure';

jest.mock('@proton/drive', () => {
    const actual = jest.requireActual('@proton/drive');
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
            name: { ok: true, value: 'supported.txt' },
            mediaType: 'text/plain',
            type: NodeType.File,
        });
        const unsupportedNode = createMockNodeEntity({
            uid: 'unsupported',
            name: { ok: true, value: 'unsupported.protondoc' },
            mediaType: PROTON_DOCS_DOCUMENT_MIMETYPE,
            type: NodeType.File,
        });
        const supportedRevision = supportedNode.activeRevision?.ok ? supportedNode.activeRevision.value : undefined;
        const supportedSize = supportedRevision?.storageSize ?? 0;

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

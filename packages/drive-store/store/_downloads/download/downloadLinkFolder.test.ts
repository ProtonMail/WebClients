import type { ChildrenLinkMeta, LinkDownload } from '../interface';
import { FolderTreeLoader } from './downloadLinkFolder';

type Tree = {
    [linkId: string]: Tree | number;
};

/**
 * Key is linkId and name.
 * Value is either
 *  - object representing folder's children,
 *  - or number representing file's size.
 */
const tree: Tree = {
    linkId: {
        a: {
            ab: {
                abc: {
                    '11': 123,
                    '12': 456,
                    '13': 789,
                },
                '21': 12,
                '22': 0,
            },
        },
        b: {
            bc: {
                bcd: {
                    bcde: {
                        '30': 147,
                        '31': 258,
                    },
                    '40': 963,
                },
            },
            bd: {
                '50': 2,
                '51': 3,
            },
        },
        '60': 7,
        '61': 9,
    },
};
const expectedTotalSize = 2769;

async function stubGetChildren(abortSignal: AbortSignal, shareId: string, linkId: string): Promise<ChildrenLinkMeta[]> {
    const subtree = getSubtree(linkId, tree);
    if (!subtree) {
        throw new Error(`Wrong folder linkId: ${linkId}`);
    }
    return Object.entries(subtree).map(([linkId, value]) => {
        const size = typeof value === 'number' ? value : undefined;
        return makeChildrenLinkMeta(linkId, size);
    });
}

function getSubtree(linkId: string, tree: Tree): Tree | undefined {
    for (const key in tree) {
        if (Object.prototype.hasOwnProperty.call(tree, key)) {
            const value = tree[key];
            if (typeof value === 'number') {
                continue;
            }
            if (key === linkId) {
                return value;
            }
            const found = getSubtree(linkId, value);
            if (found) {
                return found;
            }
        }
    }
}

function makeChildrenLinkMeta(linkId: string, size?: number): ChildrenLinkMeta {
    return {
        isFile: size !== undefined,
        linkId,
        name: linkId,
        mimeType: size !== undefined ? 'text/plain' : 'Folder',
        size: size || 0,
        signatureAddress: 'address',
        fileModifyTime: 1692962760,
    };
}

describe('FolderTreeLoader', () => {
    const mockLog = jest.fn();

    const linkDownload = { shareId: 'shareId', linkId: 'linkId' } as LinkDownload;

    it('calculates size', async () => {
        const folderTreeLoader = new FolderTreeLoader(linkDownload, mockLog);
        const promise = folderTreeLoader.load(stubGetChildren);
        await expect(promise).resolves.toMatchObject({
            size: expectedTotalSize,
        });
    });

    it('iterates all childs', async () => {
        const folderTreeLoader = new FolderTreeLoader(linkDownload, mockLog);
        void folderTreeLoader.load(stubGetChildren);
        const items = [];
        for await (const item of folderTreeLoader.iterateAllChildren()) {
            items.push(item);
        }
        items.sort((a, b) => a.name.localeCompare(b.name));
        expect(items).toMatchObject([
            { linkId: '11', parentPath: ['a', 'ab', 'abc'] },
            { linkId: '12', parentPath: ['a', 'ab', 'abc'] },
            { linkId: '13', parentPath: ['a', 'ab', 'abc'] },
            { linkId: '21', parentPath: ['a', 'ab'] },
            { linkId: '22', parentPath: ['a', 'ab'] },
            { linkId: '30', parentPath: ['b', 'bc', 'bcd', 'bcde'] },
            { linkId: '31', parentPath: ['b', 'bc', 'bcd', 'bcde'] },
            { linkId: '40', parentPath: ['b', 'bc', 'bcd'] },
            { linkId: '50', parentPath: ['b', 'bd'] },
            { linkId: '51', parentPath: ['b', 'bd'] },
            { linkId: '60', parentPath: [] },
            { linkId: '61', parentPath: [] },
            { linkId: 'a', parentPath: [] },
            { linkId: 'ab', parentPath: ['a'] },
            { linkId: 'abc', parentPath: ['a', 'ab'] },
            { linkId: 'b', parentPath: [] },
            { linkId: 'bc', parentPath: ['b'] },
            { linkId: 'bcd', parentPath: ['b', 'bc'] },
            { linkId: 'bcde', parentPath: ['b', 'bc', 'bcd'] },
            { linkId: 'bd', parentPath: ['b'] },
        ]);
    });
});

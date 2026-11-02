import { NodeType } from '@proton/drive/sdk';
import { SORT_DIRECTION } from '@proton/shared/lib/constants';

import { sortItems } from '../../modules/sorting';
import { stringComparator } from '../../modules/sorting/comparators';
import { SortField } from '../../modules/sorting/types';
import { getPublicFolderSortValue } from './publicFolder.sorting';
import type { PublicFolderItem } from './usePublicFolder.store';

const createItem = (uid: string, uploadedBy: string | undefined): PublicFolderItem => ({
    uid,
    name: uid,
    type: NodeType.File,
    mediaType: undefined,
    activeRevisionUid: undefined,
    size: undefined,
    parentUid: undefined,
    haveSignatureIssues: undefined,
    uploadedBy,
});

describe('getPublicFolderSortValue', () => {
    it('sorts by uploader when some items were uploaded anonymously', () => {
        const items = [createItem('bob-file', 'bob@example.com'), createItem('anonymous-file', undefined)];

        const sorted = sortItems(
            items,
            [{ field: SortField.uploadedBy, comparator: stringComparator }],
            SORT_DIRECTION.ASC,
            getPublicFolderSortValue,
            (item) => item.uid
        );

        expect(sorted).toEqual(['anonymous-file', 'bob-file']);
    });
});

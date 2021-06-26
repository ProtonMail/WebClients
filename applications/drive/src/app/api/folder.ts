import { SORT_DIRECTION } from '@proton/shared/lib/constants';
import { FOLDER_PAGE_SIZE, DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER } from '../constants';
import { CreateNewFolder } from '../interfaces/folder';

export const queryFolderChildren = (
    shareID: string,
    linkID: string,
    {
        Page,
        PageSize = FOLDER_PAGE_SIZE,
        FoldersOnly = 0,
        Sort = DEFAULT_SORT_FIELD,
        // @ts-ignore
        Desc = DEFAULT_SORT_ORDER === SORT_DIRECTION.ASC ? 0 : 1,
    }: { Page: number; PageSize?: number; FoldersOnly?: number; Sort?: string; Desc?: 0 | 1 }
) => ({
    method: 'get',
    url: `drive/shares/${shareID}/folders/${linkID}/children`,
    params: { Page, PageSize, FoldersOnly, Sort, Desc, Thumbnails: 1 },
});

export const queryCreateFolder = (shareID: string, data: CreateNewFolder) => ({
    method: 'post',
    url: `drive/shares/${shareID}/folders`,
    data,
});

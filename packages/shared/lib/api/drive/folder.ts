import { SORT_DIRECTION } from '../../constants';
import { DEFAULT_SORT_FIELD, DEFAULT_SORT_ORDER, FOLDER_PAGE_SIZE } from '../../drive/constants';
import type { CreateNewFolder } from '../../interfaces/drive/folder';

export const queryFolderChildren = (
    shareID: string,
    linkID: string,
    {
        Page,
        PageSize = FOLDER_PAGE_SIZE,
        FoldersOnly = 0,
        Sort = DEFAULT_SORT_FIELD,
        Desc = DEFAULT_SORT_ORDER === SORT_DIRECTION.ASC ? 0 : 1,
        ShowAll = 0,
    }: { Page: number; PageSize?: number; FoldersOnly?: number; Sort?: string; Desc?: 0 | 1; ShowAll?: 0 | 1 }
) => ({
    method: 'get',
    url: `drive/shares/${shareID}/folders/${linkID}/children`,
    params: { Page, PageSize, FoldersOnly, Sort, Desc, Thumbnails: 1, ShowAll },
});

export const queryCreateFolder = (shareID: string, data: CreateNewFolder) => ({
    method: 'post',
    url: `drive/shares/${shareID}/folders`,
    data,
});

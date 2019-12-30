import { FOLDER_PAGE_SIZE } from '../constants';

export const queryFolderChildren = (
    shareID: string,
    linkID: string,
    { Page, PageSize = FOLDER_PAGE_SIZE }: { Page: number; PageSize?: number }
) => ({
    method: 'get',
    url: `drive/shares/${shareID}/folders/${linkID}/children`,
    params: { Page, PageSize }
});

export const queryGetFolder = (ShareID: string, LinkID: string) => ({
    method: 'get',
    url: `drive/shares/${ShareID}/folders/${LinkID}`
});

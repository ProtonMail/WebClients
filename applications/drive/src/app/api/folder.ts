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

interface FolderStuff {
    ParentLinkID: string;
    Hash: string;
    Name: string;
    NodePassphrase: string;
    NodeKey: string;
    NodeHashKey: string;
}

export const queryGetFolder = (ShareID: string, LinkID: string) => ({
    method: 'get',
    url: `drive/shares/${ShareID}/folders/${LinkID}`
});

export const queryCreateFolder = (ShareID: string, data: FolderStuff) => ({
    method: 'post',
    url: `drive/shares/${ShareID}/folders`,
    data
});

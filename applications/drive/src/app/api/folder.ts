// TODO: Pagination, in later sprints
export const queryFolderChildren = (shareID: string, linkID: string) => ({
    method: 'get',
    url: `drive/shares/${shareID}/folders/${linkID}/children`
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

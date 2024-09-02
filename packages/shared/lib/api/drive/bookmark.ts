import type { CreateBookmarkPayload } from '../../interfaces/drive/bookmark';

export const queryCreateShareURLBookmark = (
    token: string,
    data: {
        BookmarkShareURL: CreateBookmarkPayload;
    }
) => {
    return {
        method: 'post',
        url: `drive/v2/urls/${token}/bookmark`,
        data,
    };
};

export const queryListShareURLBookmark = () => {
    return {
        method: 'get',
        url: `drive/v2/shared-bookmarks`,
    };
};

export const queryDeleteShareURLBookmark = (token: string) => {
    return {
        method: 'delete',
        url: `drive/v2/urls/${token}/bookmark`,
    };
};

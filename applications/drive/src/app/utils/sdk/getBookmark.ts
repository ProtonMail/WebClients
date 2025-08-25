import type { Bookmark, InvalidNameError, MaybeBookmark } from '@proton/drive/index';

type GetBookmarkType = {
    bookmark: Bookmark;
    errors: Map<'name' | 'url', Error | InvalidNameError>;
};
export const getBookmark = (maybeBookmark: MaybeBookmark): GetBookmarkType => {
    let bookmark: Bookmark;
    const errors = new Map();

    if (maybeBookmark.ok) {
        bookmark = maybeBookmark.value;
    } else {
        if (!maybeBookmark.error.node.name.ok) {
            errors.set('name', maybeBookmark.error.node.name.error);
        }
        if (!maybeBookmark.error.url.ok) {
            errors.set('url', maybeBookmark.error.url.error);
        }
        if (!maybeBookmark.error.customPassword.ok) {
            errors.set('customPassword', maybeBookmark.error.customPassword.error);
        }
        bookmark = {
            ...maybeBookmark.error,
            node: {
                ...maybeBookmark.error.node,
                name: maybeBookmark.error.node.name.ok
                    ? maybeBookmark.error.node.name.value
                    : maybeBookmark.error.node.name.error.name,
            },
            url: maybeBookmark.error.url?.ok ? maybeBookmark.error.url.value : '',
            customPassword: maybeBookmark.error.customPassword.ok
                ? maybeBookmark.error.customPassword.value
                : undefined,
        };
    }

    return {
        bookmark,
        errors,
    };
};

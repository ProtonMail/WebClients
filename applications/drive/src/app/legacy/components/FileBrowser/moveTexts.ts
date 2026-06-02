import { c, msgid } from 'ttag';

export const getMovedFiles = (n: number) => {
    return {
        allFiles: c('Notification').ngettext(msgid`Move ${n} file`, `Move ${n} files`, n),
        allFolders: c('Notification').ngettext(msgid`Move ${n} folder`, `Move ${n} folders`, n),
        mixed: c('Notification').ngettext(msgid`Move ${n} item`, `Move ${n} items`, n),
    };
};

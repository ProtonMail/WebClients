import { c, msgid } from 'ttag';

export const getItemsText = (n: number) => {
    return c('Info').ngettext(msgid`${n} item`, `${n} items`, n);
};

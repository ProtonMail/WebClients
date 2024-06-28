import { c, msgid } from 'ttag';

export const getOccurrenceString = (count: number) => c('Info').ngettext(msgid`${count} time`, `${count} times`, count);
export const getViewCountString = (count: number) => c('Info').ngettext(msgid`${count} view`, `${count} views`, count);

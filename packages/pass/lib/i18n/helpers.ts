import { c, msgid } from 'ttag';

import type { MaybeNull } from '@proton/pass/types';

export const getOccurrenceString = (count: number) => c('Info').ngettext(msgid`${count} time`, `${count} times`, count);
export const getViewCountString = (count: number, maxReads: MaybeNull<number>) =>
    maxReads
        ? c('Info').t`${count}/${maxReads} views`
        : c('Info').ngettext(msgid`${count} view`, `${count} views`, count);

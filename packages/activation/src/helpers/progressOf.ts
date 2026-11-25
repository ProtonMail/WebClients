import { c } from 'ttag';

/** translator: progress, e.g. "1 of 4" */
export const progressOf = (current: number, total: number) => c('Info').t`${current} of ${total}`;

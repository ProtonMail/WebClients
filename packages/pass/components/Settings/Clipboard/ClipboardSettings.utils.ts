import { c } from 'ttag';

import { ClipboardTTL, DEFAULT_CLIPBOARD_TTL } from '../../../lib/clipboard/types';

export const getClipboardTTLOptions = (): Map<ClipboardTTL, string> =>
    new Map([
        [ClipboardTTL.TTL_NEVER, c('Label').t`Never`],
        [ClipboardTTL.TTL_15_SEC, c('Label').t`15 seconds`],
        [ClipboardTTL.TTL_1_MIN, c('Label').t`1 minute`],
        [ClipboardTTL.TTL_2_MIN, c('Label').t`2 minutes`],
    ]);

export const getDefaultClipboardTTLOption = () => getClipboardTTLOptions().get(DEFAULT_CLIPBOARD_TTL);

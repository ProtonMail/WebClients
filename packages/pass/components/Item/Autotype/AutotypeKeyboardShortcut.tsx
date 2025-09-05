import type { FC } from 'react';

import { c } from 'ttag';

import { Kbd } from '@proton/atoms';
import { metaKey } from '@proton/shared/lib/helpers/browser';

export const AutotypeKeyboardShortcut: FC = () => {
    const metaOrCtrlKey = <Kbd shortcut={metaKey} />;
    const shiftKey = <Kbd shortcut={c('Keyboard key').t`SHIFT`} />;
    const vKey = <Kbd shortcut={c('Keyboard key').t`V`} />;

    return (
        <span>
            {metaOrCtrlKey} {shiftKey} {vKey}
        </span>
    );
};

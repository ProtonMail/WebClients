import type { ComponentPropsWithoutRef } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

import './Kbd.scss';

export interface KbdProps extends ComponentPropsWithoutRef<'kbd'> {
    shortcut: string;
}

export const Kbd = ({ shortcut, className, ...rest }: KbdProps) => {
    return (
        <kbd className={clsx('kbd', className)} aria-label={c('Label').t`Keyboard shortcut: ${shortcut}`} {...rest}>
            {shortcut}
        </kbd>
    );
};

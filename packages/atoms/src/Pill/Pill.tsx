import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import tinycolor from 'tinycolor2';

import { genPillBackgroundColorShades, genPillTextColorShades } from '@proton/colors';
import clsx from '@proton/utils/clsx';

export interface PillProps extends ComponentPropsWithoutRef<'span'> {
    children: ReactNode;
    color?: string;
    backgroundColor?: string;
    className?: string;
}

const Pill = ({ children, className, color, backgroundColor, ...rest }: PillProps) => {
    const [text, background] = (() => {
        if (color && backgroundColor) {
            return [color, backgroundColor];
        }

        if (color) {
            return genPillTextColorShades(tinycolor(color)).map((c) => c.toHexString());
        }

        if (backgroundColor) {
            return genPillBackgroundColorShades(tinycolor(backgroundColor)).map((c) => c.toHexString());
        }

        return genPillTextColorShades(tinycolor('#6645e8')).map((c) => c.toHexString());
    })();

    return (
        <span
            className={clsx('text-sm rounded-full text-normal inline-block px-3 py-0.5', className)}
            style={{ backgroundColor: background, color: text }}
            {...rest}
        >
            {children}
        </span>
    );
};

export default Pill;

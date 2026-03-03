import type { ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

export interface CircledNumberProps extends ComponentPropsWithoutRef<'span'> {
    /**
     * The number to display inside the circled number. Must be a number between 0 and 9 (design is for 1 digit numbers).
     */
    number: number;
    className?: string;
    /**
     * The class name to apply to the color of the circled number, default is 'color-primary'
     */
    colorClassName?: string;
    /**
     * The class name to apply to the text size of the circled number, default is 'text-xs'
     */
    textSizeClassName?: 'text-xs' | 'text-sm';
}

export const CircledNumber = ({
    number,
    className,
    colorClassName = 'color-primary',
    textSizeClassName = 'text-xs',
    ...rest
}: CircledNumberProps) => {
    return (
        <span
            className={clsx(
                'circled-number ratio-square shrink-0 border border-currentcolor rounded-full text-semibold text-tabular-nums inline-flex m-auto items-center justify-center min-w-custom',
                textSizeClassName,
                className,
                colorClassName
            )}
            style={{ '--min-w-custom': textSizeClassName === 'text-xs' ? '1rem' : '1.25rem' }}
            {...rest}
        >
            {number}
        </span>
    );
};

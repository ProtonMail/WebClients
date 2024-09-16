import type { FC, ReactNode } from 'react';

import type { IconSize } from '@proton/components';
import { CSS_BASE_UNIT_SIZE } from '@proton/styles';
import clsx from '@proton/utils/clsx';

import './IconBox.scss';

type Props = {
    children: ReactNode;
    className?: string;
    mode: 'image' | 'icon' | 'transparent';
    pill?: boolean;
    size: IconSize;
    style?: React.CSSProperties;
};

/** The outer size of the icon box is calculated to be 1.8 times larger than
 * the provided `size` prop. Icon sizes follow a taxonomy where `iconSize * 4`
 * equals the size in pixels. To obtain the outer size, we multiply the icon size
 * by `1.8 * 4`, resulting in a factor of `7.2`. */
export const getIconSizePx = (size: number) => size * CSS_BASE_UNIT_SIZE;
export const getOuterIconSize = (size: IconSize) => Math.round(getIconSizePx(size) * 1.8);

export const IconBox: FC<Props> = ({ className, children, mode, pill = true, size, style }) => {
    const outerSize = getOuterIconSize(size);

    return (
        <div
            className={clsx(
                'w-custom h-custom relative',
                mode === 'icon' && 'pass-item-icon',
                mode === 'image' && 'pass-item-icon pass-item-icon--has-image',
                className,
                pill ? 'rounded-xl' : 'rounded-sm'
            )}
            style={{ '--w-custom': `${outerSize}px`, '--h-custom': `${outerSize}px`, ...style }}
        >
            {children}
        </div>
    );
};

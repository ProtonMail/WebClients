import type { ReactNode, VFC } from 'react';

import type { IconSize } from '@proton/components/components';
import clsx from '@proton/utils/clsx';

import './IconBox.scss';

type Props = { children: ReactNode; className?: string; size: IconSize; mode: 'image' | 'icon' | 'transparent' };

const getOuterSize = (size: IconSize) => Math.round(size * 1.8);

export const IconBox: VFC<Props> = ({ size, mode, className, children }) => {
    const outerSize = getOuterSize(size);

    return (
        <div
            className={clsx(
                'w-custom h-custom rounded-xl overflow-hidden relative',
                mode === 'icon' && 'pass-item-icon',
                mode === 'image' && 'pass-item-icon pass-item-icon--has-image',
                className
            )}
            style={{ '--w-custom': `${outerSize}px`, '--h-custom': `${outerSize}px` }}
        >
            {children}
        </div>
    );
};

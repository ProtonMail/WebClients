import type { ReactNode, VFC } from 'react';

import type { IconSize } from '@proton/components/components';
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

const getOuterSize = (size: IconSize) => Math.round(size * 1.8);

export const IconBox: VFC<Props> = ({ className, children, mode, pill = true, size, style }) => {
    const outerSize = getOuterSize(size);

    return (
        <div
            className={clsx(
                'w-custom h-custom overflow-hidden relative',
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

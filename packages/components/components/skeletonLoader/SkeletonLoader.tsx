import type { CSSProperties, ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SkeletonLoader.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    width?: string | number;
    height?: string | number;
    className?: string;
    style?: CSSProperties;
    index?: number;
}

const SkeletonLoader = ({ width, height, className, style, index, ...rest }: Props) => {
    return (
        <div
            aria-hidden="true"
            data-testid="skeleton-loader"
            className={clsx('skeleton-loader', !!width && 'w-custom', !!height && 'h-custom', className)}
            style={{
                '--w-custom': width,
                '--h-custom': height,
                '--index': index,
                ...style,
            }}
            {...rest}
        />
    );
};

export default SkeletonLoader;

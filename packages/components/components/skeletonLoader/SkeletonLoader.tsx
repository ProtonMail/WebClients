import type { CSSProperties, ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SkeletonLoader.scss';

export interface Props extends ComponentPropsWithoutRef<'div'> {
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
            className={clsx(
                'skeleton-loader',
                !!width && 'w-custom',
                !!height && 'h-custom',
                !!rest.children && 'skeleton-loader--with-children',
                className
            )}
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

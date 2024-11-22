import type { CSSProperties, ComponentPropsWithoutRef } from 'react';

import clsx from '@proton/utils/clsx';

import './SkeletonLoader.scss';

interface Props extends ComponentPropsWithoutRef<'div'> {
    width?: string | number;
    className?: string;
    style?: CSSProperties;
    index?: number;
}

const SkeletonLoader = ({ width, className, style, index, ...rest }: Props) => {
    return (
        <div
            aria-hidden="true"
            data-testid="skeleton-loader"
            className={clsx('skeleton-loader w-custom', className)}
            style={{
                '--w-custom': width,
                '--index': index,
                ...style,
            }}
            {...rest}
        />
    );
};

export default SkeletonLoader;

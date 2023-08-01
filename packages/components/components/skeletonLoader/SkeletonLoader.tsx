import { CSSProperties } from 'react';

import clsx from '@proton/utils/clsx';

import './SkeletonLoader.scss';

interface Props {
    width?: string | number;
    className?: string;
    style?: CSSProperties;
    index?: number;
}

const SkeletonLoader = ({ width, className, style, index }: Props) => {
    return (
        <div aria-hidden="true">
            <div
                className={clsx('skeleton-loader w-custom', className)}
                style={{
                    '--w-custom': width,
                    '--index': index,
                    style,
                }}
            />
        </div>
    );
};

export default SkeletonLoader;

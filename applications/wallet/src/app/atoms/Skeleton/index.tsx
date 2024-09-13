import { cloneElement } from 'react';

import clsx from '@proton/utils/clsx';

import './Skeleton.scss';

interface Props {
    loading?: boolean;
    rounded?: boolean;

    placeholder?: JSX.Element;
    children: JSX.Element;
}

export const Skeleton = ({ loading, rounded, children, placeholder }: Props) => {
    const innerPlaceholder = placeholder ?? children;

    if (loading) {
        return cloneElement(innerPlaceholder, {
            className: clsx(innerPlaceholder.props.className, 'skeleton', rounded && 'rounded-skeleton'),
        });
    }

    return children;
};

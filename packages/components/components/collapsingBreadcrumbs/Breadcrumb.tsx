import type { LiHTMLAttributes, ReactNode, Ref } from 'react';
import { forwardRef } from 'react';

import { Button } from '@proton/atoms';
import clsx from '@proton/utils/clsx';

interface Props extends Omit<LiHTMLAttributes<HTMLLIElement>, 'onClick'> {
    title?: string;
    children: ReactNode;
    active?: boolean;
    noShrink?: boolean;
    onClick?: () => void;
}

const Breadcrumb = (
    { title, children, onClick, active, noShrink, className, ...rest }: Props,
    ref: Ref<HTMLLIElement>
) => {
    const textClass = clsx([
        'text-pre p-1 m-0 text-ellipsis *:pointer-events-none',
        active ? 'text-strong' : 'color-weak',
    ]);
    return (
        <li
            {...rest}
            ref={ref}
            className={clsx(['collapsing-breadcrumb', noShrink && 'collapsing-breadcrumb--no-shrink', className])}
        >
            {onClick ? (
                <Button shape="ghost" color="weak" title={title} onClick={onClick} className={textClass}>
                    {children}
                </Button>
            ) : (
                <span title={title} className={textClass}>
                    {children}
                </span>
            )}
        </li>
    );
};

export default forwardRef<HTMLLIElement, Props>(Breadcrumb);

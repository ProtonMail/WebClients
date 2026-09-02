import type { ReactElement, ReactNode } from 'react';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import clsx from '@proton/utils/clsx';

import Label from '../label/Label';

export interface IconRowProps {
    className?: string;
    children: ReactNode;
    icon: ReactElement;
    containerClassName?: string;
    labelClassName?: string;
    title?: string;
    id?: string;
}

const IconRow = ({
    children,
    icon,
    className,
    title,
    containerClassName,
    labelClassName = 'pb-2',
    id,
}: IconRowProps) => {
    return (
        <div className={clsx('flex flex-nowrap items-start mb-4 form--icon-labels', containerClassName)}>
            <Label className={labelClassName} htmlFor={id}>
                <Tooltip title={title}>
                    {/* `Tooltip` clones its child to attach a ref, and the generated `Ic*`
                        components are not `forwardRef`, so it needs an element of its own. */}
                    <span>
                        {icon}
                        {title ? <span className="sr-only">{title}</span> : null}
                    </span>
                </Tooltip>
            </Label>
            <div className={className || 'flex-1'}>{children}</div>
        </div>
    );
};

export default IconRow;

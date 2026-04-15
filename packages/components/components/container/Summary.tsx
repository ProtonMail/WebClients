import type { HTMLProps, ReactNode } from 'react';

import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import { IcChevronRightFilled } from '@proton/icons/icons/IcChevronRightFilled';
import clsx from '@proton/utils/clsx';

interface Props extends HTMLProps<HTMLElement> {
    children: ReactNode;
    className?: string;
    classNameChildren?: string;
    useTriangle?: boolean;
}

const Summary = ({ children, className, classNameChildren, useTriangle = false, ...rest }: Props) => (
    <summary
        className={clsx('flex flex-nowrap relative interactive-pseudo interactive--no-background rounded', className)}
        {...rest}
    >
        {useTriangle ? (
            <IcChevronRightFilled className="mr-1 shrink-0 summary-triangle mt-0.5" />
        ) : (
            <IcChevronDown className="mr-1 shrink-0 summary-caret mt-1" />
        )}
        <div className={clsx('flex-1', classNameChildren)}>{children}</div>
    </summary>
);

export default Summary;

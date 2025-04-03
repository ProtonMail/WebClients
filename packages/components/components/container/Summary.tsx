import type { HTMLProps, ReactNode } from 'react';

import Icon from '@proton/components/components/icon/Icon';
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
        <Icon
            name={useTriangle ? 'chevron-right-filled' : 'chevron-down'}
            className={clsx('mr-1 shrink-0', useTriangle ? 'summary-triangle mt-0.5' : 'summary-caret mt-1')}
        />
        <div className={clsx('flex-1', classNameChildren)}>{children}</div>
    </summary>
);

export default Summary;

import type { HTMLProps, ReactNode } from 'react';

import Icon from '@proton/components/components/icon/Icon';
import clsx from '@proton/utils/clsx';

interface Props extends HTMLProps<HTMLElement> {
    children: ReactNode;
    classNameChildren?: string;
    useTriangle?: boolean;
}

const Summary = ({ children, classNameChildren, useTriangle = false, ...rest }: Props) => (
    // Safari can't set up summary tag as a flex container, tsssss... https://bugs.webkit.org/show_bug.cgi?id=190065
    <summary {...rest}>
        <div className="flex flex-nowrap">
            <Icon
                name={useTriangle ? 'chevron-right-filled' : 'chevron-down'}
                className={clsx('mr-1 shrink-0', useTriangle ? 'summary-triangle mt-0.5' : 'summary-caret mt-1')}
            />
            <div className={clsx('flex-1', classNameChildren)}>{children}</div>
        </div>
    </summary>
);

export default Summary;

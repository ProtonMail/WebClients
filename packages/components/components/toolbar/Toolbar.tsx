import { HTMLAttributes, ReactNode } from 'react';

import { c } from 'ttag';

import clsx from '@proton/utils/clsx';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const Toolbar = ({ children, className, ...rest }: Props) => (
    <nav
        className={clsx(['toolbar flex flex-nowrap shrink-0 no-print', className])}
        aria-label={c('Label').t`Toolbar`}
        {...rest}
    >
        <div className="flex flex-nowrap toolbar-inner w-full">{children}</div>
    </nav>
);

export default Toolbar;

import { HTMLAttributes, ReactNode } from 'react';

import { c } from 'ttag';

import { classnames } from '../../helpers';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children?: ReactNode;
    className?: string;
}

const Toolbar = ({ children, className, ...rest }: Props) => (
    <nav
        className={classnames(['toolbar flex flex-nowrap no-scroll flex-item-noshrink no-print', className])}
        aria-label={c('Label').t`Toolbar`}
        {...rest}
    >
        <div className="flex toolbar-inner w100">{children}</div>
    </nav>
);

export default Toolbar;

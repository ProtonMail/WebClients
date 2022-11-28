import { HTMLAttributes, ReactNode } from 'react';

import { c } from 'ttag';

import { classnames } from '../../helpers';

interface Props extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode;
    className?: string;
}

const SidebarNav = ({ children, className, ...rest }: Props) => {
    return (
        <nav
            className={classnames(['navigation max-w100 flex-item-fluid-auto', className])}
            {...rest}
            aria-label={c('Label').t`Main`}
        >
            <h2 className="sr-only">
                {
                    // translator: This is a hidden headline for users with screen readers to highlight the main navigation
                    c('Label').t`Navigation`
                }
            </h2>
            {children}
        </nav>
    );
};

export default SidebarNav;

import { ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

interface Props {
    title: string;
    children: ReactNode;
    className?: string;
}

const Panel = ({ children, title, className }: Props) => {
    return (
        <div
            className={clsx(
                'relative border rounded px-6 py-5 flex-align-self-start on-tablet-order-1 on-mobile-order-1 panel',
                className
            )}
        >
            <h2 className="h3 m-0 pt-2 pb-4">
                <strong>{title}</strong>
            </h2>

            {children}
        </div>
    );
};

export default Panel;

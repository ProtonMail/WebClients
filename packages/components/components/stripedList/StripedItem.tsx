import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';

interface StripedItemProps extends ComponentPropsWithoutRef<'li'> {
    left: ReactNode;
    tooltip?: ReactNode;
}

const StripedItem = ({ left, tooltip, children, className, ...rest }: StripedItemProps) => {
    return (
        <li className={clsx('px-3 py-2 rounded', className)} {...rest}>
            <div className="flex flex-nowrap items-baseline">
                <div className="shrink-0 mr-2">{left}</div>
                <div className="flex-1">
                    <span className="align-middle">{children}</span>
                    {tooltip ? <Info buttonClass="ml-2 align-middle" title={tooltip} /> : null}
                </div>
            </div>
        </li>
    );
};

export default StripedItem;

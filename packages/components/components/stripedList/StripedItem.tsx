import { ComponentPropsWithoutRef, ReactNode } from 'react';

import clsx from '@proton/utils/clsx';

import Info from '../link/Info';

interface StripedItemProps extends ComponentPropsWithoutRef<'li'> {
    left: ReactNode;
    tooltip?: ReactNode;
}

const StripedItem = ({ left, tooltip, children, className, ...rest }: StripedItemProps) => {
    return (
        <li className={clsx('px1 py0-5 rounded', className)} {...rest}>
            <div className="flex flex-nowrap">
                <div className="flex-item-noshrink mr0-75">{left}</div>
                <div className="flex-item-fluid">
                    <span className="align-middle">{children}</span>
                    {tooltip ? <Info buttonClass="ml-2 align-middle" title={tooltip} /> : null}
                </div>
            </div>
        </li>
    );
};

export default StripedItem;

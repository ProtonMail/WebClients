import type { ComponentPropsWithoutRef, ReactNode } from 'react';

import Info from '@proton/components/components/link/Info';
import clsx from '@proton/utils/clsx';

interface StripedItemProps extends ComponentPropsWithoutRef<'li'> {
    left: ReactNode;
    tooltip?: ReactNode;
    rightAlignedTooltip?: boolean;
}

const StripedItem = ({
    left,
    tooltip,
    children,
    className,
    rightAlignedTooltip = false,
    ...rest
}: StripedItemProps) => {
    return (
        <li className={clsx('px-3 py-2 rounded', className)} {...rest}>
            <div className="flex flex-nowrap items-baseline">
                <div className="shrink-0 mr-2">{left}</div>
                <div className="flex-1">
                    <span className="align-middle">{children}</span>
                    {tooltip && !rightAlignedTooltip ? <Info buttonClass="ml-2 align-middle" title={tooltip} /> : null}
                </div>
                {tooltip && rightAlignedTooltip ? (
                    <Info className="shrink-0" buttonClass="ml-2 align-middle" title={tooltip} />
                ) : null}
            </div>
        </li>
    );
};

export default StripedItem;

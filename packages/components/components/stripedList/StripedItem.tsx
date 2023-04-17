import { ReactNode } from 'react';

import Info from '../link/Info';

interface StripedItemProps {
    children: ReactNode;
    left: ReactNode;
    tooltip?: ReactNode;
}

const StripedItem = ({ left, children, tooltip }: StripedItemProps) => {
    return (
        <li className="px1 py0-5 rounded">
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

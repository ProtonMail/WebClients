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
            <div className="flex">
                <div className="mr0-75">{left}</div>
                <div className="flex-item-fluid">
                    {children}
                    {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
                </div>
            </div>
        </li>
    );
};

export default StripedItem;

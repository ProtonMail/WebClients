import { ReactNode } from 'react';
import Icon, { IconName } from '../icon/Icon';
import Info from '../link/Info';

interface StrippedItemProps {
    icon: IconName;
    children: ReactNode;
    tooltip?: ReactNode;
}

const StrippedItem = ({ icon, children, tooltip }: StrippedItemProps) => {
    return (
        <li className="px1 py0-5 rounded">
            <div className="flex flex-align-items-top">
                <div className="mr1 color-success">
                    <Icon size={24} name={icon} />
                </div>
                <div className="flex-item-fluid pt0-25">
                    {children}
                    {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
                </div>
            </div>
        </li>
    );
};

export default StrippedItem;

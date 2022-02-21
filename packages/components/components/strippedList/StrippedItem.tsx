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
        <div className="flex flex-align-items-top">
            <div className="mr1 color-success">
                <Icon size={24} name={icon} />
            </div>
            <span>{children}</span>
            {tooltip ? <Info className="ml0-5" title={tooltip} /> : null}
        </div>
    );
};

export default StrippedItem;

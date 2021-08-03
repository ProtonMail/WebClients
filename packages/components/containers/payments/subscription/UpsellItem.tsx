import * as React from 'react';

import { Icon } from '../../../components';

interface UpsellItemProps {
    icon: string;
    children: React.ReactNode;
}

const UpsellItem = ({ icon, children }: UpsellItemProps) => {
    return (
        <div className="mt0-1 mb0-5 flex flex-nowrap flex-align-items-start">
            <Icon name={icon} className="mr0-5 mt0-25 color-primary" />
            <span className="text-rg m0">{children}</span>
        </div>
    );
};

export default UpsellItem;

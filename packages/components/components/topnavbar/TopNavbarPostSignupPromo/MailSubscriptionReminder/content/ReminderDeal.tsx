import React from 'react';

import { type IconName } from '@proton/components/components/icon/Icon';

export interface DealItem {
    icon: IconName;
    text: string | string[];
}

interface Props {
    items: DealItem[];
}

const ReminderDeal = ({ items }: Props) => {
    return (
        <ul className="unstyled">
            {items.map(({ icon, text }, index) => (
                <React.Fragment key={icon}>
                    <li className="border-top items-center border-weak py-4 flex gap-2 flex-nowrap">
                        <img src={icon} alt="" className="shrink-0" />
                        <span>{text}</span>
                    </li>
                    {index === items.length - 1 && <div className="border-bottom border-weak" />}
                </React.Fragment>
            ))}
        </ul>
    );
};

export default ReminderDeal;

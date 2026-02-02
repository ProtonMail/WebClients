import type { ReactNode } from 'react';

import { DropdownMenuButton, Icon } from '@proton/components';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import type { IconName } from '@proton/icons/types';

export const DropdownMenuItem = ({
    iconName,
    label,
    description,
    isSelected,
    onClick,
}: {
    iconName?: IconName;
    label: ReactNode;
    description?: string;
    isSelected?: boolean;
    onClick: () => void;
}) => (
    <DropdownMenuButton className="text-left flex justify-space-between items-center flex-nowrap" onClick={onClick}>
        <span className="flex items-center flex-nowrap mr-14">
            {iconName && <Icon name={iconName} className="mr-2" />}
            <div>
                {label}
                <p className="text-left color-weak">{description}</p>
            </div>
        </span>
        {isSelected ? <IcCheckmark /> : null}
    </DropdownMenuButton>
);

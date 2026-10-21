import type { ReactNode } from 'react';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import type { IconComponent } from '@proton/icons/component';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';

export const DropdownMenuItem = ({
    icon: Icon,
    label,
    description,
    isSelected,
    onClick,
}: {
    icon?: IconComponent;
    label: ReactNode;
    description?: string;
    isSelected?: boolean;
    onClick: () => void;
}) => (
    <DropdownMenuButton className="text-left flex justify-space-between items-center flex-nowrap" onClick={onClick}>
        <span className="flex items-center flex-nowrap mr-14">
            {Icon && <Icon className="mr-2" />}
            <div>
                {label}
                <p className="text-left color-weak text-sm">{description}</p>
            </div>
        </span>
        {isSelected ? <IcCheckmark data-testid="item-checkmark" /> : null}
    </DropdownMenuButton>
);

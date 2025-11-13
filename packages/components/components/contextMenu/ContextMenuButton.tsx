import type { ReactNode } from 'react';

import DropdownMenuButton from '@proton/components/components/dropdown/DropdownMenuButton';
import Icon from '@proton/components/components/icon/Icon';
import type { IconName } from '@proton/icons/types';

type Props = {
    id?: string;
    name: ReactNode;
    icon: IconName;
    testId?: string;
    action: () => void;
    disabled?: boolean;
};

const ContextMenuButton = ({ id, name, icon, testId, action, disabled }: Props) => {
    if (typeof name !== 'string' && !id) {
        throw Error('Either a name as string or id must be provided');
    }

    return (
        <DropdownMenuButton
            onContextMenu={(e) => e.stopPropagation()}
            className="flex items-center flex-nowrap text-left"
            onClick={(e) => {
                e.stopPropagation();
                action();
            }}
            data-testid={testId}
            disabled={disabled}
        >
            <Icon className="mr-2 shrink-0" name={icon} />
            {name}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;

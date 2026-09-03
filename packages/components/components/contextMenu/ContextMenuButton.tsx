import type { ReactElement, ReactNode } from 'react';

import DropdownMenuButton from '../dropdown/DropdownMenuButton';

type Props = {
    id?: string;
    name: ReactNode;
    icon: ReactElement;
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
            <span className="mr-2 shrink-0 flex items-center">{icon}</span>
            {name}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;

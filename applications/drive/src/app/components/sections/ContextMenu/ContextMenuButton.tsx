import { PropsWithChildren } from 'react';

import { DropdownMenuButton, Icon, IconName } from '@proton/components';

interface Props {
    name: string;
    icon: IconName;
    testId: string;
    action: () => void;
    close: () => void;
}

const ContextMenuButton = ({ name, icon, testId, action, close, children }: PropsWithChildren<Props>) => {
    return (
        <DropdownMenuButton
            key={name}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex items-center flex-nowrap text-left"
            onClick={(e) => {
                e.stopPropagation();
                action();
                close();
            }}
            data-testid={testId}
        >
            <Icon className="mr-2 flex-item-noshrink" name={icon} />
            {name}
            {children}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;

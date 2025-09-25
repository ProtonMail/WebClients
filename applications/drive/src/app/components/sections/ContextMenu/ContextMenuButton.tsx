import type { PropsWithChildren, ReactElement } from 'react';
import React from 'react';

import type { IconName } from '@proton/components';
import { DropdownMenuButton, Icon } from '@proton/components';

interface Props {
    name: string;
    icon: IconName | ReactElement<any>;
    testId: string;
    action: () => Promise<void> | void;
    loading?: boolean;
    close: () => void;
}

const ContextMenuButton = ({ name, icon, testId, action, loading, close, children }: PropsWithChildren<Props>) => {
    return (
        <DropdownMenuButton
            key={name}
            loading={loading}
            onContextMenu={(e) => e.stopPropagation()}
            className="flex items-center justify-space-between flex-nowrap"
            onClick={async (e) => {
                e.stopPropagation();
                await action();
                close();
            }}
            data-testid={testId}
        >
            <div className="flex items-center flex-nowrap text-left shrink-0">
                {typeof icon === 'string' ? <Icon className="mr-2 shrink-0" name={icon} /> : icon}
                {name}
            </div>
            {children}
        </DropdownMenuButton>
    );
};

export default ContextMenuButton;

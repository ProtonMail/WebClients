import type { PropsWithChildren, ReactElement } from 'react';

import { DropdownMenuButton } from '@proton/components';

interface Props {
    name: string;
    icon: ReactElement;
    testId: string;
    action: () => Promise<void> | void;
    loading?: boolean;
    close: () => void;
}

// A button meant to be contained inside a contextual menu.
export const ContextMenuButton = ({
    name,
    icon,
    testId,
    action,
    loading,
    close,
    children,
}: PropsWithChildren<Props>) => {
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
                <span className="flex items-center shrink-0 mr-2">{icon}</span>
                {name}
            </div>
            {children}
        </DropdownMenuButton>
    );
};

import type { FC, MouseEvent, ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import type { Props as DropdownMenuButtonCoreProps } from '@proton/components/components/dropdown/DropdownMenuButton';
import { default as DropdownMenuButtonCore } from '@proton/components/components/dropdown/DropdownMenuButton';
import clsx from '@proton/utils/clsx';

const QuickActionsDropdown: FC<{ children: ReactNode }> = ({ children }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    const handleClick = (evt: MouseEvent) => {
        evt.stopPropagation();
        toggle();
    };

    return (
        <>
            <Button
                icon
                pill
                className="ml-1"
                color="weak"
                onClick={handleClick}
                ref={anchorRef}
                shape="ghost"
                title={c('Action').t`More options`}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} color="var(--text-weak)" />
            </Button>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

type Size = 'small' | 'medium';

interface DropdownMenuButtonProps extends DropdownMenuButtonCoreProps {
    children: ReactNode;
    className?: string;
    isSelected?: boolean;
    quickActions?: ReactNode;
    size?: Size;
}

export const DropdownMenuButton: FC<DropdownMenuButtonProps> = ({
    children,
    className,
    isSelected,
    quickActions,
    size = 'medium',
    ...rest
}) => (
    <div className="relative">
        <DropdownMenuButtonCore
            className={clsx(
                'flex flex-align-items-center flex-nowrap flex-justify-space-between text-left',
                size === 'small' && 'text-sm py-2 px-4',
                className
            )}
            title={isSelected ? c('Label').t`Selected` : undefined}
            {...rest}
        >
            <div className={clsx('flex flex-align-items-center flex-nowrap', quickActions !== undefined && 'max-w80')}>
                {children}
            </div>
        </DropdownMenuButtonCore>

        <div className="absolute flex flex-align-items-center h100 pr-2 right top">
            {isSelected && (
                <Icon
                    className={clsx(!quickActions && 'mr-2')}
                    name="checkmark"
                    color="var(--interaction-norm-major-1)"
                />
            )}
            {quickActions && <QuickActionsDropdown>{quickActions}</QuickActionsDropdown>}
        </div>
    </div>
);

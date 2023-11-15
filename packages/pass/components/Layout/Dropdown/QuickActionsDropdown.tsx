import type { FC } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape, ButtonLikeSize } from '@proton/atoms/Button';
import { Button } from '@proton/atoms/Button';
import { Dropdown, DropdownMenu, Icon, usePopperAnchor } from '@proton/components/index';

export const QuickActionsDropdown: FC<{
    color?: 'weak' | 'norm';
    disabled?: boolean;
    shape?: ButtonLikeShape;
    size?: ButtonLikeSize;
}> = ({ children, color, disabled, shape, size = 'medium' }) => {
    const { anchorRef, isOpen, toggle, close } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <Button
                icon
                pill
                color={color}
                shape={shape}
                size={size}
                ref={anchorRef}
                onClick={toggle}
                disabled={disabled}
                title={c('Action').t`More options`}
            >
                <Icon name="three-dots-vertical" alt={c('Action').t`More options`} size={20} />
            </Button>

            <Dropdown isOpen={isOpen} anchorRef={anchorRef} onClose={close}>
                <DropdownMenu>{children}</DropdownMenu>
            </Dropdown>
        </>
    );
};

import { type FC } from 'react';

import { c } from 'ttag';

import { Dropdown, DropdownButton, DropdownMenu, Icon, usePopperAnchor } from '@proton/components';
import { ShareRole } from '@proton/pass/types';

import { DropdownMenuButton } from '../Layout/Dropdown/DropdownMenuButton';

type Props = { onRoleChange: (role: ShareRole) => void };

const getActions = () => [
    { role: ShareRole.READ, label: c('Label').t`Make all viewers` },
    { role: ShareRole.WRITE, label: c('Label').t`Make all editors` },
    { role: ShareRole.ADMIN, label: c('Label').t`Make all admins` },
];

export const BulkMemberActions: FC<Props> = ({ onRoleChange }) => {
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className="flex text-sm gap-2 text-semibold flex-nowrap"
                onClick={toggle}
                color="norm"
                ref={anchorRef}
                shape="outline"
                type="button"
                title={c('Action').t`Set access level`}
                style={{ '--text-norm': 'var(--interaction-norm-major-1)' }}
            >
                <span className="color-norm text-ellipsis">{c('Action').t`Set access level`}</span>
                <Icon className="shrink-0" name="chevron-down" />
            </DropdownButton>

            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    {getActions().map(({ role, label }) => (
                        <DropdownMenuButton key={role} onClick={() => onRoleChange(role)} label={label} />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

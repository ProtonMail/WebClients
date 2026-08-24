import type { FC } from 'react';

import { c } from 'ttag';

import { usePopperAnchor } from '@proton/atoms/Popper/usePopperAnchor';
import Dropdown from '@proton/components/components/dropdown/Dropdown';
import DropdownButton from '@proton/components/components/dropdown/DropdownButton';
import DropdownMenu from '@proton/components/components/dropdown/DropdownMenu';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';

import { ShareRole } from '../../../types';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { type InviteLabels, useInviteLabels } from '../useInviteLabels';

type Props = { onRoleChange: (role: ShareRole) => void };

const getActions = (labels: InviteLabels) => [
    { role: ShareRole.READ, label: c('Label').t`Make all viewers` },
    { role: ShareRole.WRITE, label: c('Label').t`Make all editors` },
    { role: ShareRole.MANAGER, label: labels.multipleAction },
];

export const AccessRoleToggle: FC<Props> = ({ onRoleChange }) => {
    // TODO: Remove this in IDTEAM-4660
    const labels = useInviteLabels();
    const { anchorRef, isOpen, close, toggle } = usePopperAnchor<HTMLButtonElement>();

    return (
        <>
            <DropdownButton
                className="flex text-sm gap-2 text-semibold flex-nowrap"
                onClick={toggle}
                color="norm"
                ref={anchorRef}
                shape="outline"
                size="small"
                type="button"
                title={c('Action').t`Set access level`}
                style={{ '--text-norm': 'var(--interaction-norm-major-1)' }}
            >
                <span className="color-norm text-ellipsis">{c('Action').t`Set access level`}</span>
                <IcChevronDown className="shrink-0" />
            </DropdownButton>

            <Dropdown anchorRef={anchorRef} isOpen={isOpen} onClose={close}>
                <DropdownMenu>
                    {getActions(labels).map(({ role, label }) => (
                        <DropdownMenuButton key={role} onClick={() => onRoleChange(role)} label={label} />
                    ))}
                </DropdownMenu>
            </Dropdown>
        </>
    );
};

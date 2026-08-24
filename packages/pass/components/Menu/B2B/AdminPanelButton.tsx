import type { FC } from 'react';

import type { Organization } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import { AccountPath } from '../../../constants';
import { useNavigateToAccount } from '../../../hooks/useNavigateToAccount';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { AdminPanelLabel } from './AdminPanelLabel';

export const AdminPanelButton: FC<Organization> = ({ Name, UsedMembers, MaxMembers }) => {
    const configured = Name && UsedMembers > 1;
    const navigateToOrganization = useNavigateToAccount(AccountPath.USERS);

    return (
        <DropdownMenuButton
            icon="users"
            className={clsx('rounded', configured ? 'py-3' : 'py-2')}
            ellipsis
            label={<AdminPanelLabel Name={Name} UsedMembers={UsedMembers} MaxMembers={MaxMembers} />}
            onClick={navigateToOrganization}
            parentClassName="mx-3"
        />
    );
};

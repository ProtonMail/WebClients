import type { FC } from 'react';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { AdminPanelLabel } from '@proton/pass/components/Menu/B2B/AdminPanelLabel';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import type { Organization } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

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

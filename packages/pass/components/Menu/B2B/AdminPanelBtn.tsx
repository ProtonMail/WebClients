import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { selectUserOrganization } from '@proton/pass/store/selectors';

export const AdminPanelBtn: FC = () => {
    const navigateToOrganization = useNavigateToAccount(AccountPath.USERS);
    const organization = useSelector(selectUserOrganization);

    return (
        <DropdownMenuButton
            onClick={navigateToOrganization}
            label={
                <div className="flex flex-column flex-nowrap">
                    <div>{c('Action').t`Admin panel`}</div>
                    {organization && (
                        <div className="flex flex-row flex-nowrap gap-2 color-weak text-sm">
                            <div className="text-ellipsis">{organization.DisplayName || organization.Name}</div>
                            <div className="shrink-0">({organization.MaxMembers})</div>
                        </div>
                    )}
                </div>
            }
            icon="users"
            parentClassName="mx-3"
            className="rounded"
            labelHCustom="2.75rem"
            ellipsis
        ></DropdownMenuButton>
    );
};

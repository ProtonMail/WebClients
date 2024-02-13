import { type FC } from 'react';
import { useSelector } from 'react-redux';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import { selectUserOrganization } from '@proton/pass/store/selectors';
import capitalize from '@proton/utils/capitalize';
import clsx from '@proton/utils/clsx';

export const AdminPanelButton: FC = () => {
    const organization = useSelector(selectUserOrganization);
    const configured = organization?.Name && organization.UsedMembers > 1;

    const navigateToOrganization = useNavigateToAccount(AccountPath.USERS);

    return (
        <DropdownMenuButton
            icon="users"
            className={clsx('rounded', configured ? 'py-4' : 'py-3')}
            ellipsis
            label={
                <div className="flex flex-column flex-nowrap">
                    <span className="text-ellipsis">{c('Action').t`Admin panel`}</span>
                    {configured && (
                        <div className="flex flex-row flex-nowrap gap-1 color-weak text-sm">
                            <span className="text-ellipsis">{capitalize(organization.Name)}</span>
                            <span className="shrink-0">
                                ({organization.UsedMembers}/{organization.MaxMembers})
                            </span>
                        </div>
                    )}
                </div>
            }
            onClick={navigateToOrganization}
            parentClassName="mx-3"
        />
    );
};

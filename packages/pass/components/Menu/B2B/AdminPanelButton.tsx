import { type FC } from 'react';

import { c } from 'ttag';

import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { AccountPath } from '@proton/pass/constants';
import { useNavigateToAccount } from '@proton/pass/hooks/useNavigateToAccount';
import type { Organization } from '@proton/shared/lib/interfaces';
import capitalize from '@proton/utils/capitalize';
import clsx from '@proton/utils/clsx';

export const AdminPanelButton: FC<Organization> = ({ Name, UsedMembers, MaxMembers }) => {
    const configured = Name && UsedMembers > 1;
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
                            <span className="text-ellipsis">{capitalize(Name)}</span>
                            <span className="shrink-0">
                                ({UsedMembers}/{MaxMembers})
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

import type { FC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon } from '@proton/components';
import type { ListFieldValue } from '@proton/pass/components/Form/Field/ListField';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import { getShareRoleDefinition } from '@proton/pass/components/Share/ShareRoleOptions';
import { type InviteFormMemberValue, ShareRole } from '@proton/pass/types';

export type InviteMemberProps = ListFieldValue<InviteFormMemberValue> & {
    onRemove?: () => void;
    onRoleChange?: (role: ShareRole) => void;
};

export const InviteMember: FC<InviteMemberProps> = ({ value, onRemove, onRoleChange }) => {
    const { role, email } = value;
    const { title: roleLabel } = useMemo(() => getShareRoleDefinition()[role], [role]);

    return (
        <div className="flex gap-3 flex-nowrap items-center  py-3 w-full">
            <IconBox size={5} mode="icon" className="relative shrink-0 ui-primary">
                <Icon name="envelope" size={5} className="absolute inset-center" color={'var(--interaction-norm)'} />
            </IconBox>
            <div className="flex-1">
                <div className="flex flex-nowrap flex-1 items-center gap-2">
                    <div className="text-ellipsis">{email}</div>
                </div>
                <div className="flex items-center gap-1">
                    <span className="color-weak">{roleLabel}</span>
                </div>
            </div>

            {onRoleChange && (
                <QuickActionsDropdown color="weak" shape="ghost">
                    <DropdownMenuButton
                        label={c('Action').t`Make viewer`}
                        icon={role === ShareRole.READ ? 'checkmark' : undefined}
                        onClick={() => onRoleChange(ShareRole.READ)}
                        className={role !== ShareRole.READ ? 'pl-10' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Make editor`}
                        icon={role === ShareRole.WRITE ? 'checkmark' : undefined}
                        onClick={() => onRoleChange(ShareRole.WRITE)}
                        className={role !== ShareRole.WRITE ? 'pl-10' : ''}
                    />
                    <DropdownMenuButton
                        label={c('Action').t`Make admin`}
                        icon={role === ShareRole.ADMIN ? 'checkmark' : undefined}
                        onClick={() => onRoleChange(ShareRole.ADMIN)}
                        className={role !== ShareRole.ADMIN ? 'pl-10' : ''}
                    />

                    {onRemove && (
                        <DropdownMenuButton
                            label={c('Action').t`Remove member`}
                            icon="circle-slash"
                            danger
                            onClick={onRemove}
                        />
                    )}
                </QuickActionsDropdown>
            )}
        </div>
    );
};

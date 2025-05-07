import type { FC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Icon, Tooltip } from '@proton/components';
import { getShareRoleDefinition } from '@proton/pass/components/Invite/Member/ShareRoleOptions';
import { useInviteLabels } from '@proton/pass/components/Invite/useInviteLabels';
import { DropdownMenuButton } from '@proton/pass/components/Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '@proton/pass/components/Layout/Dropdown/QuickActionsDropdown';
import { IconBox } from '@proton/pass/components/Layout/Icon/IconBox';
import type { AccessTarget } from '@proton/pass/lib/access/types';
import type { InviteFormMemberItem } from '@proton/pass/types';
import { ShareRole } from '@proton/pass/types';

export type InviteMemberProps = InviteFormMemberItem & {
    target: AccessTarget;
    onRemove?: () => void;
    onRoleChange?: (role: ShareRole) => void;
};

export const InviteMember: FC<InviteMemberProps> = ({ target, value, onRemove, onRoleChange }) => {
    const { role, email } = value;
    // TODO: Remove this in IDTEAM-4660
    const labels = useInviteLabels();
    const { title: roleLabel } = useMemo(() => getShareRoleDefinition(target, labels)[role], [role]);

    return (
        <div className="flex gap-3 flex-nowrap items-center  py-3 w-full">
            <IconBox size={5} mode="icon" className="relative shrink-0 ui-primary">
                <Icon name="envelope" size={5} className="absolute inset-center" color={'var(--interaction-norm)'} />
            </IconBox>
            <div className="flex-1">
                <div className="flex flex-nowrap flex-1 items-center gap-2">
                    <Tooltip openDelay={100} originalPlacement="bottom-start" title={email}>
                        <div className="text-ellipsis">{email}</div>
                    </Tooltip>
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
                        label={labels.singleAction}
                        icon={role === ShareRole.MANAGER ? 'checkmark' : undefined}
                        onClick={() => onRoleChange(ShareRole.MANAGER)}
                        className={role !== ShareRole.MANAGER ? 'pl-10' : ''}
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

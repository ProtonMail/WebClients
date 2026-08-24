import type { FC } from 'react';
import { useMemo } from 'react';

import { c } from 'ttag';

import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import generateUID from '@proton/utils/generateUID';

import type { AccessTarget } from '../../../lib/access/types';
import type { InviteFormMemberItem } from '../../../types';
import { ShareRole } from '../../../types';
import { useMaybeGroup } from '../../Groups/GroupsProvider';
import { MaybeGroupName } from '../../Groups/MaybeGroupName';
import { DropdownMenuButton } from '../../Layout/Dropdown/DropdownMenuButton';
import { QuickActionsDropdown } from '../../Layout/Dropdown/QuickActionsDropdown';
import { IconBox } from '../../Layout/Icon/IconBox';
import { ButtonIfNeeded } from '../../Utils/ButtonIfNeeded';
import { ShareMemberAvatar } from '../Member/ShareMemberAvatar';
import { getShareRoleDefinition } from '../Member/ShareRoleOptions';
import { useInviteLabels } from '../useInviteLabels';

export type InviteMemberProps = InviteFormMemberItem & {
    target: AccessTarget;
    onRemove?: () => void;
    onRoleChange?: (role: ShareRole) => void;
};

export const InviteMember: FC<InviteMemberProps> = ({ target, value, onRemove, onRoleChange }) => {
    const { role, email, isGroup } = value;
    const { name, maybeGroupProps, onShowMembers } = useMaybeGroup(email);

    // TODO: Remove this in IDTEAM-4660
    const labels = useInviteLabels();
    const { title: roleLabel } = useMemo(() => getShareRoleDefinition(target, labels)[role], [role]);
    const nameId = generateUID('InviteMemberName');

    return (
        <div className="flex gap-3 flex-nowrap items-center  py-3 w-full">
            <ButtonIfNeeded onClick={onShowMembers} aria-labelledby={nameId}>
                <IconBox size={5} mode="icon" className="shrink-0 ui-primary flex items-center justify-center">
                    <ShareMemberAvatar email={email} isGroup={isGroup} />
                </IconBox>
            </ButtonIfNeeded>

            <div className="flex-1">
                <div className="flex flex-nowrap flex-1 items-center gap-2">
                    <Tooltip openDelay={100} originalPlacement="bottom-start" title={name} id={nameId}>
                        <ButtonIfNeeded onClick={onShowMembers}>
                            <MaybeGroupName {...maybeGroupProps} />
                        </ButtonIfNeeded>
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

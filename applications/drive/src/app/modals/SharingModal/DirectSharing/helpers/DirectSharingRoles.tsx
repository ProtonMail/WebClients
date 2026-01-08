import { c } from 'ttag';

import { MemberRole, type NonProtonInvitationState } from '@proton/drive';
import useFlag from '@proton/unleash/useFlag';

import { DropdownMenuItem } from '../../DropdownMenuItem';
import type { DirectSharingRole } from '../../interfaces';
import { InvitationStateTranslations } from './DirectSharingTranslations';

export function DirectSharingRoles({
    onChangeRole,
    selectedRole,
    externalInvitationState,
}: {
    onChangeRole: (role: DirectSharingRole) => void;
    selectedRole: DirectSharingRole;
    externalInvitationState?: NonProtonInvitationState;
}) {
    const adminRoleEnabled = useFlag('DriveSharingAdminPermissions');

    const getRoleLabel = (role: DirectSharingRole, baseLabel: string) => {
        if (role === selectedRole && externalInvitationState) {
            return `${baseLabel} (${InvitationStateTranslations[externalInvitationState]})`;
        }
        return baseLabel;
    };

    return (
        <>
            <DropdownMenuItem
                label={getRoleLabel(MemberRole.Viewer, c('Label').t`Viewer`)}
                description={c('Into').t`Can view only`}
                iconName="eye"
                onClick={() => onChangeRole(MemberRole.Viewer)}
                isSelected={selectedRole === MemberRole.Viewer}
            />
            <DropdownMenuItem
                label={getRoleLabel(MemberRole.Editor, c('Label').t`Editor`)}
                description={c('Into').t`Can view and edit`}
                iconName="pencil"
                onClick={() => onChangeRole(MemberRole.Editor)}
                isSelected={selectedRole === MemberRole.Editor}
            />
            {adminRoleEnabled && (
                <DropdownMenuItem
                    label={getRoleLabel(MemberRole.Admin, c('Label').t`Admin`)}
                    description={c('Into').t`Can edit and manage access`}
                    iconName="user-circle"
                    onClick={() => onChangeRole(MemberRole.Admin)}
                    isSelected={selectedRole === MemberRole.Admin}
                />
            )}
        </>
    );
}

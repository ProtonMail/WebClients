import { c } from 'ttag';

import { MemberRole, type NonProtonInvitationState } from '@proton/drive';

import { DropdownMenuItem } from '../../DropdownMenuItem';
import type { DirectSharingRole } from '../../interfaces';
import { useEditorsManageAccessContext } from '../../useEditorsManageAccess';
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
    const { editorsManageAccess } = useEditorsManageAccessContext();

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
                description={c('Info').t`Can view only`}
                iconName="eye"
                onClick={() => onChangeRole(MemberRole.Viewer)}
                isSelected={selectedRole === MemberRole.Viewer}
            />
            <DropdownMenuItem
                label={getRoleLabel(MemberRole.Editor, c('Label').t`Editor`)}
                description={editorsManageAccess ? c('Info').t`Can edit and manage access` : c('Info').t`Can edit`}
                iconName="pencil"
                onClick={() => onChangeRole(MemberRole.Editor)}
                isSelected={selectedRole === MemberRole.Editor}
            />
        </>
    );
}

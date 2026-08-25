import { c } from 'ttag';

import { getPrivateAdminError, setMemberOwnerRole } from '@proton/account';
import { useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { canManageOwnerRole, hasUserSourcedOwnerRole } from '@proton/account/organizationRoles/helpers';
import { useUserPermissions } from '@proton/account/userPermissions/hooks';
import { useNotifications } from '@proton/app-context/useNotifications';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import { useLoading } from '@proton/hooks';
import { IcInfoCircleFilled } from '@proton/icons/icons/IcInfoCircleFilled';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';
import { getIsPasswordless } from '@proton/shared/lib/keys';
import { MemberUnprivatizationMode, getMemberUnprivatizationMode } from '@proton/shared/lib/keys/memberHelper';

import { useModalTwo } from '../../../components/modalTwo/useModalTwo';
import Toggle from '../../../components/toggle/Toggle';
import useErrorHandler from '../../../hooks/useErrorHandler';
import { useSilentApi } from '../../../hooks/useSilentApi';
import MemberRoleChangePrompt from '../MemberRoleChangePrompt';
import MemberToggleContainer from '../MemberToggleContainer';
import { adminTooltipText } from '../constants';

interface Props {
    member: EnhancedMember;
    onChangeSelectedRoles: (selectedRoles: Set<string>) => void;
    hasToggledPrivate: boolean;
}

const MemberOwnerRoleToggle = ({ member, onChangeSelectedRoles, hasToggledPrivate }: Props) => {
    const dispatch = useDispatch();
    const silentApi = useSilentApi();
    const [organizationKey] = useOrganizationKey();
    const [userPermissions] = useUserPermissions();
    const { createNotification } = useNotifications();
    const errorHandler = useErrorHandler();
    const [loadingRole, withLoadingRole] = useLoading();
    const [roleChangePrompt, showRoleChangePrompt] = useModalTwo(MemberRoleChangePrompt);

    const passwordlessMode = getIsPasswordless(organizationKey?.Key);
    const unprivatization = getMemberUnprivatizationMode(member);
    const hasOwnerRole = hasUserSourcedOwnerRole(member.UserOrganizationRoles ?? []);
    const isSelf = Boolean(member.Self);
    const canManageOwner = canManageOwnerRole({
        currentUserRoles: userPermissions?.Roles,
        isEditingSelf: isSelf,
        hasOrgKeyAccess: Boolean(organizationKey?.privateKey),
    });
    const canPromoteOwner = canManageOwner && unprivatization.mode !== MemberUnprivatizationMode.MagicLinkInvite;
    const canRevokeOwner = canManageOwner && hasOwnerRole;
    const isChecked = hasOwnerRole || unprivatization.makeAdmin;

    if (!canPromoteOwner && !canRevokeOwner) {
        return null;
    }

    const handleToggle = async (makeAdmin: boolean) => {
        const result = await dispatch(
            setMemberOwnerRole({
                member,
                makeAdmin,
                api: silentApi,
                confirm: (action) => showRoleChangePrompt({ action, subscriber: member.Subscriber }),
            })
        );
        if (!result.confirmed) {
            return;
        }
        onChangeSelectedRoles(result.desiredRoleIds);
        if (result.changed) {
            createNotification({ text: c('Success').t`User updated` });
        }
    };

    return (
        <>
            {roleChangePrompt}
            <MemberToggleContainer
                toggle={
                    <Toggle
                        id="admin-toggle"
                        loading={loadingRole || member.roleState === 'initial' || member.roleState === 'pending'}
                        disabled={member.roleState === 'rejected'}
                        checked={isChecked}
                        onChange={({ target }) => {
                            withLoadingRole(handleToggle(target.checked)).catch(errorHandler);
                        }}
                    />
                }
                label={
                    <label className="text-semibold" htmlFor="admin-toggle">
                        {c('Label for new member').t`Admin`}
                    </label>
                }
                assistiveText={
                    <div>
                        {adminTooltipText()}{' '}
                        {passwordlessMode &&
                            hasToggledPrivate &&
                            isChecked &&
                            member.addressState === 'full' &&
                            !member.Addresses?.[0]?.HasKeys && (
                                <Tooltip title={getPrivateAdminError()} openDelay={0}>
                                    <IcInfoCircleFilled className="color-danger ml-2" />
                                </Tooltip>
                            )}
                    </div>
                }
            />
        </>
    );
};

export default MemberOwnerRoleToggle;

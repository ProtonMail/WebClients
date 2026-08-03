import { c } from 'ttag';

import { selectUnprivatizationState } from '@proton/account/members/unprivatizeMembers';
import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import {
    AdminRolesUIState,
    useAdminRolesUI,
    useOrgPermissions,
    useUserPermissions,
} from '@proton/account/userPermissions/hooks';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Pill } from '@proton/atoms/Pill/Pill';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { getUser2FATagProps } from '@proton/components/containers/members/UsersAndAddressesSection/helper';
import type { UseUserMemberActions } from '@proton/components/containers/members/UsersAndAddressesSection/useMemberActions';
import useConfig from '@proton/components/hooks/useConfig';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcMinusCircle } from '@proton/icons/icons/IcMinusCircle';
import { IcShareNode } from '@proton/icons/icons/IcShareNode';
import { IcShieldHalfFilled } from '@proton/icons/icons/IcShieldHalfFilled';
import { baseUseSelector } from '@proton/react-redux-store';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import { hasMailProduct } from '@proton/shared/lib/helpers/organization';
import { getInitials } from '@proton/shared/lib/helpers/string';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { EnhancedMember } from '@proton/shared/lib/interfaces';
import {
    MemberUnprivatizationMode,
    getIsMemberDisabled,
    getIsMemberInvited,
    getMemberUnprivatizationMode,
} from '@proton/shared/lib/keys/memberHelper';
import clsx from '@proton/utils/clsx';

import MemberActions, { MagicLinkMemberActions, getMemberPermissions } from '../MemberActions';
import MemberAddresses from '../MemberAddresses';
import MemberFeatures from '../MemberFeatures';
import MemberRole from '../MemberRole';
import UserRowSkeleton from './UserRowSkeleton';
import UsersAndAddressesSectionHeader from './UsersAndAddressesSectionHeader';
import UserTableBadge from './UsersTableBadge';
import UserTableIcon from './UsersTableIcon';

import './MembersTable.scss';

export const MembersTable = ({
    members,
    loadingMembers,
    membersHook: { actions, meta, models },
}: {
    members: EnhancedMember[];
    loadingMembers: boolean;
    membersHook: UseUserMemberActions;
}) => {
    const { APP_NAME } = useConfig();
    const [permissions] = useOrgPermissions();
    const [adminRolesUIState] = useAdminRolesUI();
    const [userPermissions] = useUserPermissions();
    const isOwner =
        adminRolesUIState !== AdminRolesUIState.Hidden
            ? (userPermissions?.Roles?.some(isOwnerRole) ?? false)
            : Boolean(models.user.isAdmin);

    const unprivatizationMemberState = baseUseSelector(selectUnprivatizationState);

    const tableLabel = [
        '',
        <>
            <span className="mr-2">{c('Title header for members table').t`Role`}</span>
            <Info url={getKnowledgeBaseUrl('/user-roles')} />
        </>,
        c('Title header for members table').t`Addresses`,
        c('Title header for members table').t`Features`,
        '',
    ];

    const skeleton = loadingMembers
        ? Array.from({ length: 10 }).map((_, index) => (
              // eslint-disable-next-line react/no-array-index-key
              <UserRowSkeleton key={`user-row-skeleton-${index}`} />
          ))
        : null;

    const list = members.map((member) => {
        const memberAddresses = models.memberAddressesMap?.[member.ID] || [];
        const memberName = member.Name || memberAddresses[0]?.Email;

        const unprivatization = getMemberUnprivatizationMode(member);

        const hasPendingAllowAdminAccessRequest =
            unprivatization.mode === MemberUnprivatizationMode.AdminAccess && unprivatization.pending;

        const hasMagicLinkLayout = unprivatization.mode === MemberUnprivatizationMode.MagicLinkInvite;
        const hasPendingMagicLinkInvite = hasMagicLinkLayout && unprivatization.pending;
        const canResendMagicLink = hasPendingMagicLinkInvite;

        const hasPendingFamilyInvitation = getIsMemberInvited(member);
        const isDisabled = getIsMemberDisabled(member);

        const unprivatizationResult = unprivatizationMemberState.members[member.ID];
        const isPendingState = unprivatizationResult?.type === 'approval';
        const unprivatisationError = unprivatizationResult?.type === 'error';

        const hasDisabledLayout = hasPendingMagicLinkInvite || isDisabled;
        const hasFeaturesColumn = !hasPendingMagicLinkInvite;

        const memberPermissions = getMemberPermissions({
            permissions,
            ssoDomainsSet: models.ssoDomainsSet,
            appName: APP_NAME,
            user: models.user,
            member,
            addresses: memberAddresses,
            organization: models.organization,
            organizationKey: models.organizationKey,
            disableMemberSignIn: meta.hasExternalMemberCapableB2BPlan,
            isOwner,
        });

        const disableEdit = hasPendingFamilyInvitation && !meta.allowStorageConfiguration;

        const { hasTwoFactor, twoFactorTooltip } = getUser2FATagProps(member);

        return (
            <TableRow
                key={member.ID}
                labels={tableLabel}
                className={clsx('align-top', hasPendingFamilyInvitation && 'color-weak')}
            >
                <TableCell className="align-middle">
                    <div className="flex items-center gap-2">
                        <div className="flex flex-nowrap items-center gap-3">
                            <Avatar className="shrink-0 text-rg" color="weak">
                                {getInitials(memberName)}
                            </Avatar>
                            <button
                                type="button"
                                className={clsx(
                                    'text-ellipsis shrink align-baseline',
                                    memberPermissions.canEdit && 'link color-norm'
                                )}
                                data-testid="users-and-addresses-table:memberName"
                                title={memberName}
                                disabled={!memberPermissions.canEdit}
                                onClick={() => actions.handleEditUser(member)}
                            >
                                {memberName}
                            </button>
                        </div>
                        <div className="display-contents">
                            {(() => {
                                if (hasPendingMagicLinkInvite) {
                                    return (
                                        <Tooltip
                                            title={c('Users table: badge')
                                                .t`Invitation sent, awaiting reply from the invited member`}
                                            openDelay={0}
                                        >
                                            <span>
                                                <Pill
                                                    className="text-uppercase"
                                                    rounded="rounded-sm"
                                                    color={'var(--text-norm)'}
                                                    backgroundColor={'var(--background-weak)'}
                                                >
                                                    {c('Users table: badge').t`Invited`}
                                                </Pill>
                                            </span>
                                        </Tooltip>
                                    );
                                }

                                if (!hasMagicLinkLayout) {
                                    return (
                                        <>
                                            {meta.allowPrivateMemberConfiguration &&
                                                !meta.isOrgAFamilyPlan &&
                                                Boolean(member.Private) && (
                                                    <UserTableIcon
                                                        title={c('Users table: badge')
                                                            .t`Administrators can't access the data of private users`}
                                                        data-testid="users-and-addresses-table:memberIsPrivate"
                                                        icon={<IcKey className="color-hint" />}
                                                    />
                                                )}
                                            {hasTwoFactor && (
                                                <UserTableIcon
                                                    title={twoFactorTooltip}
                                                    icon={<IcShieldHalfFilled className="color-hint" />}
                                                />
                                            )}
                                            {Boolean(member.SSO) && (
                                                <UserTableIcon
                                                    title={c('Users table: badge')
                                                        .t`SSO user provided by your identity provider`}
                                                    icon={
                                                        <IcShareNode
                                                            className="color-hint"
                                                            style={{ transform: 'scaleX(-1)' }}
                                                        />
                                                    }
                                                />
                                            )}
                                            {isDisabled && (
                                                <UserTableIcon
                                                    title={c('Users table: badge').t`Inactive`}
                                                    icon={<IcMinusCircle className="color-hint" />}
                                                />
                                            )}

                                            {unprivatisationError && (
                                                <UserTableIcon
                                                    title={c('unprivatization')
                                                        .t`Could not enable administrator access: ${unprivatizationResult.error}`}
                                                    icon={<IcExclamationTriangleFilled className="color-danger" />}
                                                />
                                            )}

                                            {isPendingState && (
                                                <Tooltip
                                                    title={c('unprivatization').t`Waiting for admin approval`}
                                                    openDelay={0}
                                                >
                                                    <span>
                                                        <Pill
                                                            className="text-uppercase"
                                                            rounded="rounded-sm"
                                                            color="var(--signal-warning-major-3)"
                                                            backgroundColor="var(--signal-warning-minor-2)"
                                                        >
                                                            {c('Users table: badge').t`Pending`}
                                                        </Pill>
                                                    </span>
                                                </Tooltip>
                                            )}
                                            {Boolean(hasPendingAllowAdminAccessRequest) && (
                                                <Tooltip
                                                    title={c('unprivatization')
                                                        .t`Request to manage account sent, awaiting user approval`}
                                                    openDelay={0}
                                                >
                                                    <span>
                                                        <Pill
                                                            className="text-uppercase"
                                                            rounded="rounded-sm"
                                                            color="var(--signal-warning-major-3)"
                                                            backgroundColor="var(--signal-warning-minor-2)"
                                                        >
                                                            {c('Users table: badge').t`Requested`}
                                                        </Pill>
                                                    </span>
                                                </Tooltip>
                                            )}

                                            {member.NumAI > 0 &&
                                                // if the current organization doesn't have access to
                                                // Mail product then it doesn't make sense to show
                                                // Writing Assistant benefit. For example, this happens
                                                // to subusers of lumobiz2025 plan.
                                                hasMailProduct(models.organization) && (
                                                    <UserTableBadge type="weak">
                                                        {c('Users table: badge').t`Writing assistant`}
                                                    </UserTableBadge>
                                                )}
                                            {member.NumLumo > 0 && (
                                                <UserTableBadge type="weak">{LUMO_SHORT_APP_NAME}</UserTableBadge>
                                            )}
                                        </>
                                    );
                                }

                                return null;
                            })()}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-cut align-middle" data-testid="users-and-addresses-table:memberRole">
                    <div className={clsx('flex flex-column flex-nowrap', hasDisabledLayout && 'color-hint')}>
                        <MemberRole member={member} userOrganizationRoles={models.memberRolesMap?.[member.ID]} />
                        {hasPendingFamilyInvitation && (
                            <span>
                                <UserTableBadge type="weak">
                                    {c('familyOffer_2023:Family plan').t`Pending`}
                                </UserTableBadge>
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="align-middle">
                    <div className={clsx(hasDisabledLayout && 'color-hint')}>
                        {hasPendingFamilyInvitation ? (
                            <p className="m-0 text-ellipsis">{member.Name}</p>
                        ) : (
                            <MemberAddresses addresses={memberAddresses} />
                        )}
                    </div>
                </TableCell>
                {meta.showFeaturesColumn && (
                    <TableCell className="align-middle">
                        {hasFeaturesColumn && <MemberFeatures member={member} organization={models.organization} />}
                    </TableCell>
                )}
                <TableCell className="align-middle action-cell">
                    <div>
                        {hasMagicLinkLayout ? (
                            <MagicLinkMemberActions
                                state={member.Unprivatization?.State}
                                onEdit={() => actions.handleEditUser(member)}
                                onResend={
                                    canResendMagicLink ? () => actions.handleResendMagicLinkInvite(member) : undefined
                                }
                                onDelete={() => actions.handleDeleteUserConfirm(member)}
                            />
                        ) : (
                            <MemberActions
                                permissions={memberPermissions}
                                onAddAddress={actions.handleAddAddress}
                                onEdit={actions.handleEditUser}
                                onUpdateMemberState={actions.handleUpdateMemberState}
                                onDelete={actions.handleDeleteUser}
                                onSetup={actions.handleSetupUser}
                                onRevoke={actions.handleRevokeUserSessions}
                                onAttachSSO={actions.handleAttachSSO}
                                onDetachSSO={actions.handleDetachSSO}
                                onLogin={actions.handleLoginUser}
                                onChangePassword={actions.handleChangeMemberPassword}
                                member={member}
                                disableEdit={disableEdit}
                            />
                        )}
                    </div>
                </TableCell>
            </TableRow>
        );
    });

    return (
        <Table
            hasActions
            responsive="cards"
            className="members-table--actions-corner"
            data-testid="users-and-addresses-table"
        >
            <thead>
                <tr className="bg-weak">
                    <UsersAndAddressesSectionHeader
                        showFeaturesColumn={meta.showFeaturesColumn}
                        useEmail={meta.useEmail}
                    />
                </tr>
            </thead>
            <TableBody colSpan={meta.showFeaturesColumn ? 5 : 4}>{skeleton || list}</TableBody>
        </Table>
    );
};

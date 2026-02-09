import { c } from 'ttag';

import { selectUnprivatizationState } from '@proton/account/members/unprivatizeMembers';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Tooltip } from '@proton/atoms/Tooltip/Tooltip';
import Icon from '@proton/components/components/icon/Icon';
import Info from '@proton/components/components/link/Info';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import { getUser2FATagProps } from '@proton/components/containers/members/UsersAndAddressesSection/helper';
import type { UseUserMemberActions } from '@proton/components/containers/members/UsersAndAddressesSection/useMemberActions';
import useConfig from '@proton/components/hooks/useConfig';
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

        const hasDisabledLayout = hasPendingMagicLinkInvite || isDisabled;
        const hasFeaturesColumn = !hasPendingMagicLinkInvite;

        const memberPermissions = getMemberPermissions({
            ssoDomainsSet: models.ssoDomainsSet,
            appName: APP_NAME,
            user: models.user,
            member,
            addresses: memberAddresses,
            organization: models.organization,
            organizationKey: models.organizationKey,
            disableMemberSignIn: meta.hasExternalMemberCapableB2BPlan,
        });

        const disableEdit = hasPendingFamilyInvitation && !meta.allowStorageConfiguration;

        const { hasTwoFactor, twoFactorTooltip } = getUser2FATagProps(member);

        return (
            <TableRow
                key={member.ID}
                labels={tableLabel}
                className={clsx('align-top', hasPendingFamilyInvitation && 'color-weak')}
            >
                <TableCell className="align-baseline">
                    <div className="flex items-center gap-3">
                        <div className="flex flex-nowrap items-center gap-3">
                            <Avatar className="shrink-0 text-rg" color="weak">
                                {getInitials(memberName)}
                            </Avatar>
                            <div
                                className="text-ellipsis shrink"
                                data-testid="users-and-addresses-table:memberName"
                                title={memberName}
                            >
                                {memberName}
                            </div>
                        </div>
                        <div className="flex items-center gap-1">
                            {(() => {
                                if (!hasMagicLinkLayout) {
                                    return (
                                        <>
                                            {Boolean(member.Self) && (
                                                <UserTableBadge type="success">
                                                    {c('Users table: badge').t`It's you`}
                                                </UserTableBadge>
                                            )}
                                            {(() => {
                                                const result = unprivatizationMemberState.members[member.ID];
                                                if (result?.type !== 'error') {
                                                    return;
                                                }
                                                const error = result.error;
                                                return (
                                                    <Tooltip
                                                        title={c('unprivatization')
                                                            .t`Could not enable administrator access: ${error}`}
                                                        openDelay={0}
                                                    >
                                                        <Icon
                                                            name="exclamation-triangle-filled"
                                                            className="color-danger"
                                                        />
                                                    </Tooltip>
                                                );
                                            })()}
                                            {meta.allowPrivateMemberConfiguration &&
                                                !meta.isOrgAFamilyPlan &&
                                                Boolean(member.Private) && (
                                                    <UserTableBadge
                                                        type="info"
                                                        tooltip={c('Users table: badge')
                                                            .t`Administrators can't access the data of private users`}
                                                        data-testid="users-and-addresses-table:memberIsPrivate"
                                                    >
                                                        {c('Users table: badge').t`Private`}
                                                    </UserTableBadge>
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
                                            {Boolean(hasPendingAllowAdminAccessRequest) && (
                                                <UserTableBadge
                                                    type="weak"
                                                    tooltip={c('unprivatization')
                                                        .t`Request to manage account sent, awaiting user approval`}
                                                >
                                                    {c('Users table: badge').t`Pending admin access`}
                                                </UserTableBadge>
                                            )}
                                            {hasTwoFactor && (
                                                <UserTableBadge type="weak" tooltip={twoFactorTooltip}>
                                                    {c('Users table: badge').t`2FA`}
                                                </UserTableBadge>
                                            )}
                                            {Boolean(member.SSO) && (
                                                <UserTableBadge
                                                    type="success"
                                                    tooltip={c('Users table: badge')
                                                        .t`SSO user provided by your identity provider`}
                                                >
                                                    {c('Users table: badge').t`SSO`}
                                                </UserTableBadge>
                                            )}
                                            {isDisabled && (
                                                <UserTableBadge type="weak">
                                                    {c('Users table: badge').t`Inactive`}
                                                </UserTableBadge>
                                            )}
                                        </>
                                    );
                                }

                                if (hasPendingMagicLinkInvite) {
                                    return (
                                        <UserTableBadge
                                            type="info"
                                            tooltip={c('Users table: badge')
                                                .t`Invitation sent, awaiting reply from the invited member`}
                                        >
                                            {c('Users table: badge').t`Invite sent`}
                                        </UserTableBadge>
                                    );
                                }
                            })()}
                        </div>
                    </div>
                </TableCell>
                <TableCell className="text-cut align-baseline" data-testid="users-and-addresses-table:memberRole">
                    <div className={clsx('flex flex-column flex-nowrap', hasDisabledLayout && 'color-hint')}>
                        <MemberRole member={member} />
                        {hasPendingFamilyInvitation && (
                            <span>
                                <UserTableBadge type="weak">
                                    {c('familyOffer_2023:Family plan').t`Pending`}
                                </UserTableBadge>
                            </span>
                        )}
                    </div>
                </TableCell>
                <TableCell className="align-baseline">
                    <div className={clsx(hasDisabledLayout && 'color-hint')}>
                        {hasPendingFamilyInvitation ? (
                            <p className="m-0 text-ellipsis">{member.Name}</p>
                        ) : (
                            <MemberAddresses addresses={memberAddresses} />
                        )}
                    </div>
                </TableCell>
                {meta.showFeaturesColumn && (
                    <TableCell className="align-baseline">
                        {hasFeaturesColumn && <MemberFeatures member={member} organization={models.organization} />}
                    </TableCell>
                )}
                <TableCell className="align-baseline">
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
        <Table hasActions responsive="cards" data-testid="users-and-addresses-table">
            <thead>
                <tr>
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

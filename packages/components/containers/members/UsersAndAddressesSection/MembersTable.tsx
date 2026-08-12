import type { ReactNode } from 'react';

import { c } from 'ttag';

import { selectUnprivatizationState } from '@proton/account/members/unprivatizeMembers';
import type { UseMembersUsageResult } from '@proton/account/members/useMembersUsage';
import { isOwnerRole } from '@proton/account/organizationRoles/helpers';
import { AdminRolesUIState, useAdminRolesUI, useUserPermissions } from '@proton/account/userPermissions/hooks';
import { Avatar } from '@proton/atoms/Avatar/Avatar';
import { Button } from '@proton/atoms/Button/Button';
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
import useLocalState from '@proton/components/hooks/useLocalState';
import { IcCross } from '@proton/icons/icons/IcCross';
import { IcExclamationTriangleFilled } from '@proton/icons/icons/IcExclamationTriangleFilled';
import { IcKey } from '@proton/icons/icons/IcKey';
import { IcMinusCircle } from '@proton/icons/icons/IcMinusCircle';
import { IcShareNode } from '@proton/icons/icons/IcShareNode';
import { IcShieldHalfFilled } from '@proton/icons/icons/IcShieldHalfFilled';
import { baseUseSelector } from '@proton/react-redux-store';
import type { MemberUsageColumnState } from '@proton/shared/lib/api/members';
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
import MemberUsageColumnPrompt from './MemberUsageColumnPrompt';
import { LastActivityValue, LastConnectionValue } from './MemberUsageValues';
import UserRowSkeleton from './UserRowSkeleton';
import UsersAndAddressesSectionHeader from './UsersAndAddressesSectionHeader';
import UserTableBadge from './UsersTableBadge';
import UserTableIcon from './UsersTableIcon';
import useUserActivityTelemetry from './useUserActivityTelemetry';

import './MembersTable.scss';

export const MembersTable = ({
    members,
    loadingMembers,
    membersHook: { actions, meta, models },
    membersUsage,
}: {
    members: EnhancedMember[];
    loadingMembers: boolean;
    membersHook: UseUserMemberActions;
    membersUsage?: UseMembersUsageResult;
}) => {
    const showUsage = membersUsage !== undefined;
    const {
        usageByMemberID = {},
        columnDisplay,
        loading: usageLoading = false,
        refetch: refetchUsage,
    } = membersUsage ?? {};

    const { APP_NAME } = useConfig();
    const [adminRolesUIState] = useAdminRolesUI();
    const [{ permissions, Roles }] = useUserPermissions();
    const isOwner =
        adminRolesUIState !== AdminRolesUIState.Hidden
            ? (Roles?.some(isOwnerRole) ?? false)
            : Boolean(models.user.isAdmin);

    const unprivatizationMemberState = baseUseSelector(selectUnprivatizationState);

    const { trackConnectionUpsellDismissed: reportConnectionUpsellDismissed } = useUserActivityTelemetry();

    const usageRowCount = members.length;

    // The connection column can be permanently dismissed (per browser) while it's just an upsell.
    // If the org later gains gateways (state becomes "data"/"enable") the column returns regardless.
    const [connectionUpsellDismissed, setConnectionUpsellDismissed] = useLocalState(
        false,
        `members-usage:last-connection-upsell-dismissed:${models.organization?.ID ?? ''}`
    );
    // While dismissed, keep the column hidden for the upsell state and during loading (state not yet known),
    // so it never flashes in before the response arrives.
    const connectionState = columnDisplay?.Connection;
    const showConnectionColumn =
        showUsage && !(connectionUpsellDismissed && (connectionState === undefined || connectionState === 'upsell'));

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

    const list = members.map((member, index) => {
        const memberAddresses = models.memberAddressesMap?.[member.ID] || [];
        const memberName = member.Name || memberAddresses[0]?.Email;
        const primaryEmail = memberAddresses[0]?.Email;

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
            backupPasswordDisabled: !!models.organization?.Settings.SSOBackupPasswordDisabled,
            isOwner,
        });

        const disableEdit = hasPendingFamilyInvitation && !meta.allowStorageConfiguration;

        const { hasTwoFactor, twoFactorTooltip } = getUser2FATagProps(member);

        // "data" renders the value per row. "upsell"/"enable" render one centered prompt spanning the whole
        // column (a single rowSpan cell in the first row), so the column reads as one greyed panel.
        const renderUsageColumn = (
            state: MemberUsageColumnState,
            value: ReactNode,
            label: string,
            testId: string,
            onDismiss?: () => void
        ): ReactNode => {
            if (state !== 'data' && !usageLoading) {
                if (index !== 0) {
                    return null;
                }
                return (
                    <TableCell
                        rowSpan={usageRowCount}
                        className="bg-weak align-middle text-center relative"
                        data-testid={testId}
                    >
                        {onDismiss && state === 'upsell' && (
                            <Tooltip title={c('Action').t`Dismiss`}>
                                <Button
                                    icon
                                    shape="ghost"
                                    size="small"
                                    className="absolute top-0 right-0 mt-1 mr-1"
                                    onClick={onDismiss}
                                >
                                    <IcCross alt={c('Action').t`Dismiss`} />
                                </Button>
                            </Tooltip>
                        )}
                        <MemberUsageColumnPrompt state={state} onEnabled={refetchUsage} />
                    </TableCell>
                );
            }
            return (
                <TableCell className="align-middle" data-testid={testId} label={label}>
                    {!usageLoading && value}
                </TableCell>
            );
        };

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
                            <div className="flex flex-column flex-nowrap">
                                <Button
                                    type="button"
                                    shape="underline"
                                    color="norm"
                                    size="small"
                                    className="text-ellipsis shrink align-baseline text-left"
                                    data-testid="users-and-addresses-table:memberName"
                                    title={memberName}
                                    disabled={!memberPermissions.canEdit}
                                    onClick={() => actions.handleEditUser(member)}
                                >
                                    {memberName}
                                </Button>
                                {showUsage && primaryEmail && primaryEmail !== memberName && (
                                    <span className="color-weak text-sm text-ellipsis" title={primaryEmail}>
                                        {primaryEmail}
                                    </span>
                                )}
                            </div>
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
                {!showUsage && (
                    <TableCell className="align-middle">
                        <div className={clsx(hasDisabledLayout && 'color-hint')}>
                            {hasPendingFamilyInvitation ? (
                                <p className="m-0 text-ellipsis">{member.Name}</p>
                            ) : (
                                <MemberAddresses addresses={memberAddresses} />
                            )}
                        </div>
                    </TableCell>
                )}
                {meta.showFeaturesColumn && (
                    <TableCell className="align-middle">
                        {hasFeaturesColumn && <MemberFeatures member={member} organization={models.organization} />}
                    </TableCell>
                )}
                {showUsage &&
                    renderUsageColumn(
                        columnDisplay?.Activity ?? 'data',
                        <LastActivityValue lastActivity={usageByMemberID[member.ID]?.LastActivity ?? null} />,
                        c('Title header for members table').t`Last app activity`,
                        'users-and-addresses-table:lastActivity'
                    )}
                {showConnectionColumn &&
                    renderUsageColumn(
                        columnDisplay?.Connection ?? 'data',
                        <LastConnectionValue lastConnection={usageByMemberID[member.ID]?.LastConnection ?? null} />,
                        c('Title header for members table').t`Last connection`,
                        'users-and-addresses-table:lastConnection',
                        () => {
                            reportConnectionUpsellDismissed();
                            setConnectionUpsellDismissed(true);
                        }
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
            responsiveBreakpoint={showUsage ? 'wide' : undefined}
            className={clsx('members-table--actions-corner', showUsage && 'members-table--usage')}
            data-testid="users-and-addresses-table"
        >
            <thead>
                <tr className="bg-weak">
                    <UsersAndAddressesSectionHeader
                        showFeaturesColumn={meta.showFeaturesColumn}
                        useEmail={meta.useEmail}
                        showUsage={showUsage}
                        showConnectionColumn={showConnectionColumn}
                        columnDisplay={columnDisplay}
                    />
                </tr>
            </thead>
            <TableBody colSpan={4 + (showConnectionColumn ? 1 : 0) + (meta.showFeaturesColumn ? 1 : 0)}>
                {skeleton || list}
            </TableBody>
        </Table>
    );
};

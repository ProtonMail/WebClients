import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { Button } from '@proton/atoms';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { removeMember, updateRole } from '@proton/shared/lib/api/members';
import { APP_NAMES, DOMAIN_STATE, MEMBER_ROLE, MEMBER_TYPE } from '@proton/shared/lib/constants';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { normalize } from '@proton/shared/lib/helpers/string';
import { hasFamily, hasNewVisionary, hasVisionary } from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { FAMILY_PLAN_INVITE_STATE, Member } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import {
    Badge,
    Block,
    Info,
    SearchInput,
    Table,
    TableBody,
    TableCell,
    TableRow,
    useModalState,
} from '../../../components';
import {
    useApi,
    useDomains,
    useEventManager,
    useMemberAddresses,
    useMembers,
    useNotifications,
    useOrganization,
    useOrganizationKey,
    useSubscription,
} from '../../../hooks';
import { SettingsParagraph, SettingsSectionWide } from '../../account';
import { AddressModal } from '../../addresses';
import RestoreAdministratorPrivileges from '../../organization/RestoreAdministratorPrivileges';
import InviteUserCreateSubUserModal from '../InviteUserCreateSubUserModal';
import LoginMemberModal, { validateMemberLogin } from '../LoginMemberModal';
import MemberActions from '../MemberActions';
import MemberAddresses from '../MemberAddresses';
import MemberFeatures from '../MemberFeatures';
import MemberRole from '../MemberRole';
import SubUserCreateModal from '../SubUserCreateModal';
import SubUserDeleteModal from '../SubUserDeleteModal';
import SubUserEditModal from '../SubUserEditModal';
import UserInviteOrEditModal from '../UserInviteOrEditModal';
import UserRemoveModal from '../UserRemoveModal';
import UsersAndAddressesSectionHeader from './UsersAndAddressesSectionHeader.tsx';

const { DOMAIN_STATE_ACTIVE } = DOMAIN_STATE;

const UsersAndAddressesSection = ({ app }: { app: APP_NAMES }) => {
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey, loadingOrganizationKey] = useOrganizationKey(organization);
    const [domains, loadingDomains] = useDomains();
    const [members, loadingMembers] = useMembers();
    const [subscription] = useSubscription();
    const [memberAddressesMap] = useMemberAddresses(members, true);
    const [keywords, setKeywords] = useState('');
    const [tmpMember, setTmpMember] = useState<Member | null>(null);
    const api = useApi();
    const { call } = useEventManager();
    const hasReachedLimit = organization.InvitationsRemaining === 0;
    const hasSetupOrganization = hasOrganizationSetup(organization);
    const hasSetupOrganizationWithKeys = hasOrganizationSetupWithKeys(organization);

    const canInviteProtonUsers = hasNewVisionary(subscription) || hasFamily(subscription);
    const { createNotification } = useNotifications();

    const cleanOption = {
        onClose: () => setTmpMember(null),
    };

    const [addAddressModalProps, setAddAddressModalOpen, renderAddAddressModal] = useModalState();
    const [subUserCreateModalProps, setSubUserCreateModalOpen, renderSubUserCreateModal] = useModalState();
    const [subUserEditModalProps, setSubUserEditModalOpen, renderSubUserEditModal] = useModalState(cleanOption);
    const [loginMemberModalProps, setLoginMemberModalOpen, renderLoginMemberModal] = useModalState(cleanOption);
    const [subUserDeleteModalProps, setSubUserDeleteModalOpen, renderSubUserDeleteModal] = useModalState(cleanOption);
    const [userRemoveModalProps, setUserRemoveModalOpen, renderUserRemoveModal] = useModalState(cleanOption);
    const [inviteOrCreateUserModalProps, setInviteOrCreateUserModalOpen, renderInviteOrCreateUserModal] =
        useModalState(cleanOption);
    const [userInviteOrEditModalProps, setUserInviteOrEditModalOpen, renderUserInviteOrEditModal] =
        useModalState(cleanOption);

    const verifiedDomains = useMemo(
        () => (domains || []).filter(({ State }) => State === DOMAIN_STATE_ACTIVE),
        [domains]
    );

    const handleSearch = (value: string) => setKeywords(value);

    const membersSelected = useMemo(() => {
        if (!members) {
            return [];
        }
        if (!keywords) {
            return members;
        }

        const normalizedWords = normalize(keywords, true);

        return members.filter((member) => {
            const memberAddresses = memberAddressesMap?.[member.ID] || [];
            const addressMatch = memberAddresses?.some((address) =>
                normalize(address.Email, true).includes(normalizedWords)
            );
            const nameMatch = normalize(member.Name, true).includes(normalizedWords);

            return addressMatch || nameMatch;
        });
    }, [keywords, members]);

    const handleDeleteUserConfirm = async (member: Member) => {
        if (member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
            await api(updateRole(member.ID, MEMBER_ROLE.ORGANIZATION_MEMBER));
        }
        await api(removeMember(member.ID));
        await call();
        createNotification({ text: c('Success message').t`User deleted` });
    };

    const handleDeleteUser = (member: Member) => {
        setTmpMember(member);

        //  We can remove members if the user is a Proton member (excluding logged user)
        if (canInviteProtonUsers && member.Type === MEMBER_TYPE.PROTON && !member.Self) {
            setUserRemoveModalOpen(true);
        } else {
            setSubUserDeleteModalOpen(true);
        }
    };

    const handleRevokeUserSessions = async (member: Member) => {
        await api(revokeSessions(member.ID));
        await call();
        createNotification({ text: c('Success message').t`Sessions revoked` });
    };

    const handleInviteUser = () => {
        setUserInviteOrEditModalOpen(true);
    };

    const handleAddAddress = () => {
        setAddAddressModalOpen(true);
    };

    const handleEditUser = (member: Member) => {
        setTmpMember(member);

        // We can open the invite modal if the user is a Proton member (excluding logged user)
        if (canInviteProtonUsers && member.Type === MEMBER_TYPE.PROTON && !member.Self) {
            setUserInviteOrEditModalOpen(true);
        } else {
            setSubUserEditModalOpen(true);
        }
    };

    const handleAddUser = () => {
        // Visionary can either create a sub user or invite existing users
        if (hasVisionary(subscription) || hasNewVisionary(subscription) || hasFamily(subscription)) {
            setInviteOrCreateUserModalOpen(true);
        } else {
            setSubUserCreateModalOpen(true);
        }
    };

    const handleLoginUser = (member: Member) => {
        const error = validateMemberLogin(organization, organizationKey);
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        setTmpMember(member);
        setLoginMemberModalOpen(true);
    };

    const userFound = membersSelected.length;

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

    const disableInviteUserButton = loadingOrganization || loadingDomains || hasReachedLimit;
    const disableAddUserButton = loadingOrganization || loadingDomains || loadingOrganizationKey;
    const loadingAddAddresses = loadingOrganization || loadingDomains || loadingOrganizationKey || loadingMembers;

    const settingsTitle = hasFamily(subscription)
        ? c('familyOffer_2023:Info for members section')
              .t`Add, remove, and make changes to user accounts in your family group.`
        : c('familyOffer_2023:Info for members section')
              .t`Add, remove, and make changes to user accounts in your organization.`;

    return (
        <SettingsSectionWide>
            <RestoreAdministratorPrivileges />
            <SettingsParagraph>{settingsTitle}</SettingsParagraph>
            <Block className="flex flex-align-items-start">
                {renderAddAddressModal && members && (
                    <AddressModal members={members} organizationKey={organizationKey} {...addAddressModalProps} />
                )}
                {renderSubUserDeleteModal && tmpMember && (
                    <SubUserDeleteModal
                        member={tmpMember}
                        onDelete={handleDeleteUserConfirm}
                        {...subUserDeleteModalProps}
                    />
                )}
                {renderUserRemoveModal && tmpMember && (
                    <UserRemoveModal member={tmpMember} organization={organization} {...userRemoveModalProps} />
                )}
                {renderSubUserCreateModal && organizationKey && verifiedDomains?.length > 0 && (
                    <SubUserCreateModal
                        organization={organization}
                        organizationKey={organizationKey}
                        domains={verifiedDomains}
                        {...subUserCreateModalProps}
                    />
                )}
                {renderSubUserEditModal && tmpMember && (
                    <SubUserEditModal member={tmpMember} {...subUserEditModalProps} />
                )}
                {renderUserInviteOrEditModal && (
                    <UserInviteOrEditModal
                        member={tmpMember}
                        organization={organization}
                        domains={verifiedDomains}
                        {...userInviteOrEditModalProps}
                    />
                )}
                {renderLoginMemberModal && tmpMember && (
                    <LoginMemberModal app={app} member={tmpMember} {...loginMemberModalProps} />
                )}
                {renderInviteOrCreateUserModal && (
                    <InviteUserCreateSubUserModal
                        organization={organization}
                        organizationKey={organizationKey}
                        verifiedDomains={verifiedDomains}
                        onInviteUser={handleInviteUser}
                        {...inviteOrCreateUserModalProps}
                    />
                )}

                <div className="flex flex-align-items-center mb-2 lg:mb-0 gap-4">
                    {hasSetupOrganization && (
                        <Button color="norm" disabled={disableInviteUserButton} onClick={handleInviteUser}>
                            {c('Action').t`Invite user`}
                        </Button>
                    )}

                    {hasSetupOrganizationWithKeys && (
                        <Button color="norm" disabled={disableAddUserButton} onClick={handleAddUser}>
                            {c('Action').t`Add user`}
                        </Button>
                    )}

                    {/* Only family and visionary can invite existing Proton users */}
                    {canInviteProtonUsers &&
                        (hasReachedLimit ? (
                            <Info
                                className="color-danger"
                                title={c('familyOffer_2023:Family plan')
                                    .t`You have reached the limit of 10 accepted invitations in 6 months.`}
                            />
                        ) : (
                            <Info
                                title={c('familyOffer_2023:Family plan')
                                    .t`Only 10 accepted invitations are allowed in a 6-month period.`}
                            />
                        ))}

                    <Button shape="outline" disabled={loadingAddAddresses} onClick={handleAddAddress}>
                        {c('Action').t`Add address`}
                    </Button>
                </div>
                <div className="ml-0 lg:ml-auto w24e on-tablet-w100">
                    <SearchInput
                        onChange={handleSearch}
                        placeholder={c('Placeholder').t`Search for a user or address`}
                        value={keywords}
                        aria-label={c('Placeholder').t`Search users`}
                    />
                </div>
            </Block>
            <span className="sr-only" aria-live="polite" aria-atomic="true">
                {c('Info').ngettext(msgid`${userFound} user found`, `${userFound} users found`, userFound)}
            </span>

            <Table hasActions responsive="cards" data-testid="users-and-addresses-table">
                <thead>
                    <tr>
                        <UsersAndAddressesSectionHeader />
                    </tr>
                </thead>
                <TableBody loading={loadingMembers} colSpan={5}>
                    {membersSelected.map((member) => {
                        const memberAddresses = memberAddressesMap?.[member.ID] || [];
                        const isInvitationPending = !!(member.State === FAMILY_PLAN_INVITE_STATE.STATUS_INVITED);

                        return (
                            <TableRow
                                key={member.ID}
                                labels={tableLabel}
                                className={clsx('align-top', isInvitationPending && 'color-weak')}
                            >
                                <TableCell>
                                    <div className="lg:py-4" title={member.Name}>
                                        <div>
                                            <span
                                                className="block text-ellipsis flex-item-fluid"
                                                data-testid="users-and-addresses-table:memberName"
                                            >
                                                {hasFamily(subscription) &&
                                                member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN
                                                    ? member?.Addresses?.[0]?.Email || member.Name
                                                    : member.Name}
                                            </span>
                                            <span
                                                data-testid="users-and-addresses-table:memberIsPrivate"
                                                className="mr-1"
                                            >
                                                {Boolean(member.Private) && !hasFamily(subscription) && (
                                                    <Badge type="origin" className="rounded-sm">{c('Private Member')
                                                        .t`private`}</Badge>
                                                )}
                                            </span>
                                            {member['2faStatus'] > 0 && (
                                                <Badge type="origin" className="rounded-sm">{c('Enabled 2FA')
                                                    .t`2FA`}</Badge>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell className="text-cut" data-testid="users-and-addresses-table:memberRole">
                                    <div className="lg:py-4 flex flex-column flex-nowrap">
                                        <MemberRole member={member} />
                                        {isInvitationPending && (
                                            <span>
                                                <Badge type="origin" className="rounded-sm color-weak">{c(
                                                    'familyOffer_2023:Family plan'
                                                ).t`Pending`}</Badge>
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="lg:py-4">
                                        {member.State && member.State === FAMILY_PLAN_INVITE_STATE.STATUS_INVITED ? (
                                            <p className="m-0 text-ellipsis">{member.Name}</p>
                                        ) : (
                                            <MemberAddresses addresses={memberAddresses} />
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="lg:py-4">
                                        <MemberFeatures member={member} organization={organization} />
                                    </div>
                                </TableCell>
                                <TableCell>
                                    <div className="lg:py-4">
                                        <MemberActions
                                            onEdit={handleEditUser}
                                            onDelete={handleDeleteUser}
                                            onRevoke={handleRevokeUserSessions}
                                            onLogin={handleLoginUser}
                                            member={member}
                                            addresses={memberAddresses}
                                            organization={organization}
                                            organizationKey={organizationKey}
                                        />
                                    </div>
                                </TableCell>
                            </TableRow>
                        );
                    })}
                </TableBody>
            </Table>
        </SettingsSectionWide>
    );
};

export default UsersAndAddressesSection;

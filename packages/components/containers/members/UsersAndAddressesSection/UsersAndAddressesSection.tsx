import { MutableRefObject, useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useMemberAddresses } from '@proton/account';
import { getDomainError } from '@proton/account/members/validateAddUser';
import { Avatar, Button } from '@proton/atoms';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { removeMember, updateRole } from '@proton/shared/lib/api/members';
import { APP_NAMES, MEMBER_ROLE, MEMBER_SUBSCRIBER, MEMBER_TYPE } from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getInitials, normalize } from '@proton/shared/lib/helpers/string';
import {
    getHasPassB2BPlan,
    getHasVpnOrPassB2BPlan,
    hasBundlePro,
    hasFamily,
    hasMailPro,
    hasNewVisionary,
} from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import { Address, EnhancedMember, MEMBER_STATE, Member } from '@proton/shared/lib/interfaces';
import {
    getIsDomainActive,
    getOrganizationKeyInfo,
    validateOrganizationKey,
} from '@proton/shared/lib/organization/helper';
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
    useAddresses,
    useApi,
    useCustomDomains,
    useEventManager,
    useGetOrganizationKey,
    useMembers,
    useNotifications,
    useOrganization,
    useOrganizationKey,
    useProtonDomains,
    useSubscription,
    useUser,
} from '../../../hooks';
import { SettingsParagraph, SettingsSectionWide, useAccountSpotlights } from '../../account';
import { SetupOrgSpotlight } from '../../account/spotlights/passB2bOnboardingSpotlights/PassB2bOnboardingSpotlights';
import { AddressModal } from '../../addresses';
import CreateMissingKeysAddressModal from '../../addresses/missingKeys/CreateMissingKeysAddressModal';
import useOrganizationModals from '../../organization/useOrganizationModals';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '../../payments/subscription';
import ChangeMemberPasswordModal from '../ChangeMemberPasswordModal';
import InviteUserCreateSubUserModal from '../InviteUserCreateSubUserModal';
import LoginMemberModal from '../LoginMemberModal';
import MemberActions from '../MemberActions';
import MemberAddresses from '../MemberAddresses';
import MemberFeatures from '../MemberFeatures';
import MemberRole from '../MemberRole';
import SubUserCreateModal from '../SubUserCreateModal';
import SubUserDeleteModal from '../SubUserDeleteModal';
import SubUserEditModal from '../SubUserEditModal';
import UserInviteOrEditModal from '../UserInviteOrEditModal';
import UserRemoveModal from '../UserRemoveModal';
import UsersAndAddressesSectionHeader from './UsersAndAddressesSectionHeader';

const UsersAndAddressesSection = ({ app, onceRef }: { app: APP_NAMES; onceRef: MutableRefObject<boolean> }) => {
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey] = useOrganizationKey();
    const getOrganizationKey = useGetOrganizationKey();
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [{ protonDomains, premiumDomains }] = useProtonDomains();
    const [members, loadingMembers] = useMembers();
    const [subscription] = useSubscription();
    const [addresses] = useAddresses();
    const [user] = useUser();
    const [openSubscriptionModal] = useSubscriptionModal();
    const { value: memberAddressesMap, retry } = useMemberAddresses({ members, partial: true });
    const [keywords, setKeywords] = useState('');
    const [tmpMemberID, setTmpMemberID] = useState<string | null>(null);
    const api = useApi();
    const { call } = useEventManager();
    const hasReachedLimit = organization?.InvitationsRemaining === 0;
    const hasSetupOrganization = hasOrganizationSetup(organization);
    const hasSetupOrganizationWithKeys = hasOrganizationSetupWithKeys(organization);
    const organizationModals = useOrganizationModals(onceRef);

    const {
        passOnboardingSpotlights: { setupOrgSpotlight },
    } = useAccountSpotlights();

    const hasPassB2BPlan = getHasPassB2BPlan(subscription);
    const hasVpnOrPassB2BPlan = getHasVpnOrPassB2BPlan(subscription);
    const hasInboxB2BPlan = hasBundlePro(subscription) || hasMailPro(subscription);

    const useEmail = hasVpnOrPassB2BPlan;
    const allowStorageConfiguration = !hasVpnOrPassB2BPlan;
    const allowVpnAccessConfiguration = !hasVpnOrPassB2BPlan;
    const allowPrivateMemberConfiguration = !hasVpnOrPassB2BPlan;

    const showMultipleUserUploadButton = hasVpnOrPassB2BPlan;
    const showAddressesSection = !hasVpnOrPassB2BPlan;
    const showFeaturesColumn = !hasVpnOrPassB2BPlan;

    const canInviteProtonUsers = hasNewVisionary(subscription) || hasFamily(subscription);
    const { createNotification } = useNotifications();

    const cleanOption = {
        onExit: () => setTmpMemberID(null),
    };

    const [addAddressModalProps, setAddAddressModalOpen, renderAddAddressModal] = useModalState();
    const [subUserCreateModalProps, setSubUserCreateModalOpen, renderSubUserCreateModal] = useModalState();
    const [subUserEditModalProps, setSubUserEditModalOpen, renderSubUserEditModal] = useModalState(cleanOption);
    const [loginMemberModalProps, setLoginMemberModalOpen, renderLoginMemberModal] = useModalState(cleanOption);
    const [changeMemberPasswordModalProps, setChangeMemberPasswordModalOpen, renderChangeMemberPasswordModal] =
        useModalState(cleanOption);
    const [subUserDeleteModalProps, setSubUserDeleteModalOpen, renderSubUserDeleteModal] = useModalState(cleanOption);
    const [userRemoveModalProps, setUserRemoveModalOpen, renderUserRemoveModal] = useModalState(cleanOption);
    const [userSetupModal, setUserSetupModal, renderUserSetupModal] = useModalState(cleanOption);
    const [inviteOrCreateUserModalProps, setInviteOrCreateUserModalOpen, renderInviteOrCreateUserModal] =
        useModalState(cleanOption);
    const [userInviteOrEditModalProps, setUserInviteOrEditModalOpen, renderUserInviteOrEditModal] =
        useModalState(cleanOption);

    const verifiedDomains = useMemo(() => (customDomains || []).filter(getIsDomainActive), [customDomains]);

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

    const handleSetupUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);
        retry([member]);
        setUserSetupModal(true);
    };

    const handleDeleteUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);

        //  We can remove members if the user is a Proton member (excluding logged user)
        if (canInviteProtonUsers && member.Type === MEMBER_TYPE.PROTON && !member.Self) {
            setUserRemoveModalOpen(true);
        } else {
            setSubUserDeleteModalOpen(true);
        }
    };

    const handleRevokeUserSessions = async (member: EnhancedMember) => {
        await api(revokeSessions(member.ID));
        await call();
        createNotification({ text: c('Success message').t`Sessions revoked` });
    };

    const handleInviteUser = () => {
        setUserInviteOrEditModalOpen(true);
    };

    const handleAddAddress = (member?: EnhancedMember) => {
        setTmpMemberID(member?.ID || null);
        setAddAddressModalOpen(true);
    };

    const handleEditUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);

        // We can open the invite modal if the user is a Proton member (excluding logged user)
        if (
            canInviteProtonUsers &&
            member.Type === MEMBER_TYPE.PROTON &&
            !member.Self &&
            member.State === MEMBER_STATE.STATUS_INVITED
        ) {
            setUserInviteOrEditModalOpen(true);
        } else {
            setSubUserEditModalOpen(true);
        }
    };

    const handleAddUser = () => {
        // Visionary can either create a sub user or invite existing users
        if (hasNewVisionary(subscription) || hasFamily(subscription)) {
            setInviteOrCreateUserModalOpen(true);
            return;
        }

        if (!useEmail && !verifiedDomains.length) {
            createNotification({ text: getDomainError(), type: 'error' });
            return;
        }

        setSubUserCreateModalOpen(true);
    };

    const handleLoginUser = async (member: EnhancedMember) => {
        const organizationKey = await getOrganizationKey();
        const error = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        setTmpMemberID(member.ID);
        setLoginMemberModalOpen(true);
    };

    const handleChangeMemberPassword = async (member: EnhancedMember) => {
        const organizationKey = await getOrganizationKey();
        const error = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
        if (error) {
            return createNotification({ type: 'error', text: error });
        }
        setTmpMemberID(member.ID);
        setChangeMemberPasswordModalOpen(true);
    };

    const handleGetMoreLicense = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT_WITH_CUSTOMIZATION,
            disablePlanSelection: true,
            metrics: {
                /**
                 * The `vpn` in `vpn-um-get-more` is unimportant.
                 * The intention is to observe the user journey, not the specific plan the journey is for.
                 * However changing this would require a new metric schema version.
                 */
                source: 'vpn-um-get-more',
            },
        });
    };

    // Members for which addresses can be created
    const filteredMembers = (() => {
        if (useEmail) {
            return members;
        }

        return members?.filter((member) => {
            const availableAddressDomains = getAvailableAddressDomains({
                user,
                member,
                protonDomains,
                customDomains,
                premiumDomains,
            });

            return availableAddressDomains.length;
        });
    })();

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

    const disableInviteUserButton = loadingOrganization || loadingCustomDomains || hasReachedLimit;

    const disableAddUserButton =
        loadingOrganization ||
        loadingCustomDomains ||
        (organization?.UsedMembers || 0) >= (organization?.MaxMembers || 0);
    const loadingAddAddresses = loadingOrganization || loadingCustomDomains || loadingMembers;
    const selfMember = members?.find((member) => member.Self);

    const settingsParagraphContent = (() => {
        if (hasFamily(subscription)) {
            return c('familyOffer_2023:Info for members section')
                .t`Add, remove, and make changes to user accounts in your family group.`;
        }

        const defaultString = c('familyOffer_2023:Info for members section')
            .t`Add, remove, and make changes to user accounts in your organization.`;

        if (hasVpnOrPassB2BPlan || hasInboxB2BPlan) {
            const maxMembers = organization?.MaxMembers || 0;
            const usedMembers = organization?.UsedMembers || 0;
            return (
                <>
                    {c('Info').ngettext(
                        msgid`You are currently using ${usedMembers} of your ${maxMembers} available user license.`,
                        `You are currently using ${usedMembers} of your ${maxMembers} available user licenses.`,
                        maxMembers
                    )}
                    {user.canPay && selfMember?.Subscriber === MEMBER_SUBSCRIBER.PAYER && (
                        <Button shape="outline" color="norm" size="small" onClick={handleGetMoreLicense}>
                            {c('Action').t`Get more licenses`}
                        </Button>
                    )}
                </>
            );
        }

        return defaultString;
    })();

    const tmpMember = members?.find((member) => tmpMemberID === member.ID);

    return (
        <SettingsSectionWide>
            {organizationModals.info}
            {organizationModals.modals}
            <SettingsParagraph large className="flex items-baseline mb-6 gap-2">
                {settingsParagraphContent}
            </SettingsParagraph>
            <Block className="flex items-start">
                {renderUserSetupModal && (
                    <CreateMissingKeysAddressModal
                        member={tmpMember}
                        addressesToGenerate={(() => {
                            if (!tmpMember) {
                                return [];
                            }
                            const addresses = memberAddressesMap[tmpMember.ID];
                            return (
                                addresses?.filter((address): address is Address => {
                                    return 'HasKeys' in address && !address.HasKeys;
                                }) ?? []
                            );
                        })()}
                        {...userSetupModal}
                    />
                )}
                {renderAddAddressModal && filteredMembers && (
                    <AddressModal
                        useEmail={useEmail}
                        member={members?.find((member) => tmpMemberID === member.ID)}
                        members={filteredMembers}
                        {...addAddressModalProps}
                    />
                )}
                {renderSubUserDeleteModal && (
                    <SubUserDeleteModal
                        member={tmpMember}
                        onDelete={handleDeleteUserConfirm}
                        {...subUserDeleteModalProps}
                    />
                )}
                {renderUserRemoveModal && (
                    <UserRemoveModal member={tmpMember} organization={organization} {...userRemoveModalProps} />
                )}
                {renderSubUserCreateModal && (
                    <SubUserCreateModal
                        organization={organization}
                        verifiedDomains={verifiedDomains}
                        app={app}
                        onSuccess={setupOrgSpotlight.close}
                        useEmail={useEmail}
                        optionalName={hasVpnOrPassB2BPlan}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowVpnAccessConfiguration={allowVpnAccessConfiguration}
                        allowPrivateMemberConfiguration={allowPrivateMemberConfiguration}
                        showMultipleUserUploadButton={showMultipleUserUploadButton}
                        disableStorageValidation={!allowStorageConfiguration}
                        disableDomainValidation={useEmail}
                        disableAddressValidation={hasPassB2BPlan}
                        {...subUserCreateModalProps}
                    />
                )}
                {renderSubUserEditModal && tmpMember && (
                    <SubUserEditModal
                        member={tmpMember}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowVpnAccessConfiguration={allowVpnAccessConfiguration}
                        allowPrivateMemberConfiguration={allowPrivateMemberConfiguration}
                        showAddressesSection={showAddressesSection}
                        {...subUserEditModalProps}
                    />
                )}
                {renderUserInviteOrEditModal && (
                    <UserInviteOrEditModal
                        member={tmpMember}
                        organization={organization}
                        {...userInviteOrEditModalProps}
                    />
                )}
                {renderLoginMemberModal && tmpMember && (
                    <LoginMemberModal app={app} member={tmpMember} {...loginMemberModalProps} />
                )}
                {renderChangeMemberPasswordModal && tmpMember && (
                    <ChangeMemberPasswordModal member={tmpMember} {...changeMemberPasswordModalProps} />
                )}
                {renderInviteOrCreateUserModal && (
                    <InviteUserCreateSubUserModal
                        organization={organization}
                        verifiedDomains={verifiedDomains}
                        onInviteUser={handleInviteUser}
                        app={app}
                        {...inviteOrCreateUserModalProps}
                    />
                )}
                <div className="flex items-center mb-2 gap-2 mr-4">
                    {hasVpnOrPassB2BPlan ? (
                        <>
                            {hasSetupOrganizationWithKeys && (
                                <SetupOrgSpotlight app={app}>
                                    <Button color="norm" disabled={disableAddUserButton} onClick={handleAddUser}>
                                        {c('Action').t`Add user`}
                                    </Button>
                                </SetupOrgSpotlight>
                            )}
                        </>
                    ) : (
                        <>
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

                            <Button shape="outline" disabled={loadingAddAddresses} onClick={() => handleAddAddress()}>
                                {c('Action').t`Add address`}
                            </Button>
                        </>
                    )}
                </div>
                <div className="ml-0 lg:ml-auto mb-2 w-full lg:w-custom" style={{ '--lg-w-custom': '24em' }}>
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
                        <UsersAndAddressesSectionHeader showFeaturesColumn={showFeaturesColumn} useEmail={useEmail} />
                    </tr>
                </thead>
                <TableBody loading={loadingMembers} colSpan={showFeaturesColumn ? 5 : 4}>
                    {membersSelected.map((member) => {
                        const memberAddresses = memberAddressesMap?.[member.ID] || [];
                        const isInvitationPending = !!(member.State === MEMBER_STATE.STATUS_INVITED);

                        const memberName = (() => {
                            if (hasFamily(subscription) && member.Role === MEMBER_ROLE.ORGANIZATION_ADMIN) {
                                return member?.Addresses?.[0]?.Email || member.Name;
                            }

                            return member.Name;
                        })();
                        return (
                            <TableRow
                                key={member.ID}
                                labels={tableLabel}
                                className={clsx('align-top', isInvitationPending && 'color-weak')}
                            >
                                <TableCell style={{ verticalAlign: 'baseline' }}>
                                    <div className="flex items-center gap-3">
                                        <Avatar className="shrink-0 text-rg" color="weak">
                                            {getInitials(memberName)}
                                        </Avatar>
                                        <div
                                            className="text-ellipsis flex-1 min-w-custom"
                                            style={{ '--min-w-custom': '6rem' }}
                                            data-testid="users-and-addresses-table:memberName"
                                            title={memberName}
                                        >
                                            {memberName}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {allowPrivateMemberConfiguration &&
                                                !hasFamily(subscription) &&
                                                Boolean(member.Private) && (
                                                    <Badge
                                                        type="origin"
                                                        className="rounded-sm"
                                                        data-testid="users-and-addresses-table:memberIsPrivate"
                                                    >
                                                        {c('Private Member').t`private`}
                                                    </Badge>
                                                )}
                                            {member['2faStatus'] > 0 && (
                                                <Badge type="origin" className="rounded-sm">
                                                    {c('Enabled 2FA').t`2FA`}
                                                </Badge>
                                            )}
                                            {member.SSO > 0 && (
                                                <Badge
                                                    type="success"
                                                    className="rounded-sm"
                                                    tooltip={c('Users table: single sign-on tooltip')
                                                        .t`SSO user provided by your identity provider`}
                                                >
                                                    {c('Users table: single sign-on enabled').t`SSO`}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>
                                </TableCell>
                                <TableCell
                                    className="text-cut"
                                    data-testid="users-and-addresses-table:memberRole"
                                    style={{ verticalAlign: 'baseline' }}
                                >
                                    <div className="flex flex-column flex-nowrap">
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
                                <TableCell style={{ verticalAlign: 'baseline' }}>
                                    <div>
                                        {member.State && member.State === MEMBER_STATE.STATUS_INVITED ? (
                                            <p className="m-0 text-ellipsis">{member.Name}</p>
                                        ) : (
                                            <MemberAddresses addresses={memberAddresses} />
                                        )}
                                    </div>
                                </TableCell>
                                {showFeaturesColumn && (
                                    <TableCell>
                                        <MemberFeatures member={member} organization={organization} />
                                    </TableCell>
                                )}
                                <TableCell style={{ verticalAlign: 'baseline' }}>
                                    <MemberActions
                                        user={user}
                                        organizationKey={organizationKey}
                                        onAddAddress={(member) => handleAddAddress(member)}
                                        onEdit={handleEditUser}
                                        onDelete={handleDeleteUser}
                                        onSetup={handleSetupUser}
                                        onRevoke={handleRevokeUserSessions}
                                        onLogin={handleLoginUser}
                                        onChangePassword={handleChangeMemberPassword}
                                        member={member}
                                        addresses={memberAddresses}
                                        organization={organization}
                                        disableMemberSignIn={hasVpnOrPassB2BPlan}
                                    />
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

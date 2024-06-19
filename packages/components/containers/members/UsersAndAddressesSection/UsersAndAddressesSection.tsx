import { MutableRefObject, useMemo, useState } from 'react';

import { useFlag } from '@unleash/proxy-client-react';
import { c, msgid } from 'ttag';

import { getDomainAddressError, useMemberAddresses } from '@proton/account';
import { getDomainError } from '@proton/account/members/validateAddUser';
import { Avatar, Button } from '@proton/atoms';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { removeMember, resendUnprivatizationLink, updateRole } from '@proton/shared/lib/api/members';
import {
    APP_NAMES,
    MEMBER_PRIVATE,
    MEMBER_ROLE,
    MEMBER_SUBSCRIBER,
    MEMBER_TYPE,
    ORGANIZATION_STATE,
} from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { hasOrganizationSetup, hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getInitials, normalize } from '@proton/shared/lib/helpers/string';
import {
    getHasMailB2BPlan,
    getHasPassB2BPlan,
    getHasVpnOrPassB2BPlan,
    hasAnyBundlePro,
    hasFamily,
    hasNewVisionary,
} from '@proton/shared/lib/helpers/subscription';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import {
    Address,
    EnhancedMember,
    MEMBER_STATE,
    Member,
    MemberUnprivatizationState,
} from '@proton/shared/lib/interfaces';
import { parseInvitationData } from '@proton/shared/lib/keys/unprivatization';
import {
    getIsDomainActive,
    getOrganizationKeyInfo,
    validateOrganizationKey,
} from '@proton/shared/lib/organization/helper';
import clsx from '@proton/utils/clsx';

import { Block, Info, SearchInput, Table, TableBody, TableCell, TableRow, useModalState } from '../../../components';
import {
    useAddresses,
    useApi,
    useConfig,
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
import useUnprivatizeMembers from '../../organization/useUnprivatizeMembers';
import { SUBSCRIPTION_STEPS, useSubscriptionModal } from '../../payments/subscription';
import ChangeMemberPasswordModal from '../ChangeMemberPasswordModal';
import InviteUserCreateSubUserModal from '../InviteUserCreateSubUserModal';
import LoginMemberModal from '../LoginMemberModal';
import MemberActions, { MagicLinkMemberActions, getMemberPermissions } from '../MemberActions';
import MemberAddresses from '../MemberAddresses';
import MemberFeatures from '../MemberFeatures';
import MemberRole from '../MemberRole';
import ResendInvitePrompt from '../ResendInvitePrompt';
import SubUserCreateModal from '../SubUserCreateModal';
import SubUserDeleteModal from '../SubUserDeleteModal';
import SubUserEditModal from '../SubUserEditModal';
import UserInviteOrEditModal from '../UserInviteOrEditModal';
import UserRemoveModal from '../UserRemoveModal';
import UsersAndAddressesSectionHeader from './UsersAndAddressesSectionHeader';
import UserTableBadge from './UsersTableBadge';

const getHasMagicLinkLayout = (
    member?: Member
): member is Member & { Unprivatization: NonNullable<Member['Unprivatization']> } => {
    return Boolean(
        member &&
            member.Unprivatization &&
            [MemberUnprivatizationState.Pending, MemberUnprivatizationState.Declined].includes(
                member.Unprivatization.State as any
            )
    );
};

const UsersAndAddressesSection = ({ app, onceRef }: { app: APP_NAMES; onceRef: MutableRefObject<boolean> }) => {
    const { APP_NAME } = useConfig();
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
    const accessToAssistant = useFlag('ComposerAssistant');

    const hasReachedLimit = organization?.InvitationsRemaining === 0;
    const hasSetupActiveOrganization =
        organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganizationSetup(organization);
    const hasSetupActiveOrganizationWithKeys =
        organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganizationSetupWithKeys(organization);
    const organizationModals = useOrganizationModals(onceRef);

    useUnprivatizeMembers();

    const {
        passOnboardingSpotlights: { setupOrgSpotlight },
    } = useAccountSpotlights();

    const hasPassB2BPlan = getHasPassB2BPlan(subscription);
    const hasVpnOrPassB2BPlan = getHasVpnOrPassB2BPlan(subscription);
    const hasInboxB2BPlan = hasAnyBundlePro(subscription) || getHasMailB2BPlan(subscription);

    const useEmail = hasVpnOrPassB2BPlan;
    const allowStorageConfiguration = !hasVpnOrPassB2BPlan;
    const allowVpnAccessConfiguration = !hasVpnOrPassB2BPlan;
    const allowPrivateMemberConfiguration = !hasVpnOrPassB2BPlan;
    const allowAIAssistantConfiguration = accessToAssistant;

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
    const [resendInviteProps, setResendInviteModalOpen, renderResendInviteModal] = useModalState(cleanOption);
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

    const handleResendMagicLinkInvite = async (member: EnhancedMember) => {
        await api(resendUnprivatizationLink(member.ID));
        createNotification({ text: c('Success message').t`Invitation resent` });
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

    const handleAddAddress = async (member?: EnhancedMember) => {
        if (member) {
            if (member.Private === MEMBER_PRIVATE.READABLE) {
                const organizationKey = await getOrganizationKey();
                const orgKeyError = validateOrganizationKey(
                    getOrganizationKeyInfo(organization, organizationKey, addresses)
                );
                if (orgKeyError) {
                    createNotification({ type: 'error', text: orgKeyError });
                    return;
                }
            }

            if (!useEmail) {
                const domains = getAvailableAddressDomains({
                    member,
                    user,
                    premiumDomains,
                    customDomains,
                    protonDomains,
                });
                if (!domains.length) {
                    createNotification({ type: 'error', text: getDomainAddressError() });
                    return;
                }
            }
        }

        // There needs to be available members for the add address modal to be able to open properly. We assume it's failing because of an incorrect domain
        // and not members not being fetched etc.
        if (!filteredMembers?.length) {
            createNotification({ type: 'error', text: getDomainAddressError() });
            return;
        }

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
        const orgKeyError = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
        if (orgKeyError) {
            return createNotification({ type: 'error', text: orgKeyError });
        }
        setTmpMemberID(member.ID);
        setLoginMemberModalOpen(true);
    };

    const handleChangeMemberPassword = async (member: EnhancedMember) => {
        const organizationKey = await getOrganizationKey();
        const orgKeyError = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
        if (orgKeyError) {
            return createNotification({ type: 'error', text: orgKeyError });
        }
        setTmpMemberID(member.ID);
        setChangeMemberPasswordModalOpen(true);
    };

    const handleGetMoreLicense = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
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
    const disableAddAddressButton = loadingAddAddresses || organization?.State === ORGANIZATION_STATE.DELINQUENT;
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
                {renderAddAddressModal && filteredMembers && filteredMembers.length > 0 && (
                    <AddressModal
                        useEmail={useEmail}
                        member={filteredMembers.find((member) => tmpMemberID === member.ID)}
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
                        members={members}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowVpnAccessConfiguration={allowVpnAccessConfiguration}
                        allowPrivateMemberConfiguration={allowPrivateMemberConfiguration}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration}
                        showMultipleUserUploadButton={showMultipleUserUploadButton}
                        disableStorageValidation={!allowStorageConfiguration}
                        disableDomainValidation={useEmail}
                        disableAddressValidation={hasPassB2BPlan}
                        {...subUserCreateModalProps}
                    />
                )}
                {renderResendInviteModal && tmpMember && (
                    <ResendInvitePrompt
                        email={(() => {
                            try {
                                const parsedInvitationData = parseInvitationData(
                                    tmpMember.Unprivatization?.InvitationData || ''
                                );
                                return parsedInvitationData.Address;
                            } catch {
                                return tmpMember.Name;
                            }
                        })()}
                        onResend={() => handleResendMagicLinkInvite(tmpMember)}
                        {...resendInviteProps}
                    />
                )}
                {renderSubUserEditModal && tmpMember && (
                    <SubUserEditModal
                        member={tmpMember}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowVpnAccessConfiguration={allowVpnAccessConfiguration}
                        allowPrivateMemberConfiguration={allowPrivateMemberConfiguration}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration}
                        showAddressesSection={showAddressesSection && !getHasMagicLinkLayout(tmpMember)}
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
                        members={members}
                        organization={organization}
                        verifiedDomains={verifiedDomains}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration}
                        onInviteUser={handleInviteUser}
                        app={app}
                        {...inviteOrCreateUserModalProps}
                    />
                )}
                <div className="flex items-center mb-2 gap-2 mr-4">
                    {hasVpnOrPassB2BPlan ? (
                        <>
                            {hasSetupActiveOrganizationWithKeys && (
                                <SetupOrgSpotlight app={app}>
                                    <Button color="norm" disabled={disableAddUserButton} onClick={handleAddUser}>
                                        {c('Action').t`Add user`}
                                    </Button>
                                </SetupOrgSpotlight>
                            )}
                        </>
                    ) : (
                        <>
                            {hasSetupActiveOrganization && (
                                <Button color="norm" disabled={disableInviteUserButton} onClick={handleInviteUser}>
                                    {c('Action').t`Invite user`}
                                </Button>
                            )}

                            {hasSetupActiveOrganizationWithKeys && (
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

                            <Button
                                shape="outline"
                                disabled={disableAddAddressButton}
                                onClick={() => handleAddAddress()}
                            >
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
                        const memberName = member.Name || memberAddresses[0]?.Email;

                        const hasMagicLinkLayout = getHasMagicLinkLayout(member);
                        const magicLinkInvitationPending =
                            hasMagicLinkLayout && member.Unprivatization.State === MemberUnprivatizationState.Pending;
                        const canMagicLinkResend = magicLinkInvitationPending;

                        const isFamilyInvitationPending = member.State === MEMBER_STATE.STATUS_INVITED;

                        const hasFeatures = !magicLinkInvitationPending;

                        const memberPermissions = getMemberPermissions({
                            appName: APP_NAME,
                            user,
                            member,
                            addresses: memberAddresses,
                            organization,
                            organizationKey,
                            disableMemberSignIn: hasVpnOrPassB2BPlan,
                        });

                        return (
                            <TableRow
                                key={member.ID}
                                labels={tableLabel}
                                className={clsx('align-top', isFamilyInvitationPending && 'color-weak')}
                            >
                                <TableCell className="align-baseline">
                                    <div className="flex items-center gap-3">
                                        <Avatar className="shrink-0 text-rg" color="weak">
                                            {getInitials(memberName)}
                                        </Avatar>
                                        <div
                                            className="text-ellipsis shrink-0"
                                            data-testid="users-and-addresses-table:memberName"
                                            title={memberName}
                                        >
                                            {memberName}
                                        </div>
                                        <div className="flex items-center gap-1">
                                            {(() => {
                                                if (!hasMagicLinkLayout) {
                                                    return (
                                                        <>
                                                            {Boolean(member.Self) && (
                                                                <UserTableBadge type="success" className="">
                                                                    {c('Users table: badge').t`It's you`}
                                                                </UserTableBadge>
                                                            )}
                                                            {allowPrivateMemberConfiguration &&
                                                                !hasFamily(subscription) &&
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
                                                            {member.NumAI > 0 && (
                                                                <UserTableBadge type="info">
                                                                    {c('Users table: badge').t`AI`}
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
                                                        </>
                                                    );
                                                }

                                                if (
                                                    hasMagicLinkLayout &&
                                                    member.Unprivatization.State === MemberUnprivatizationState.Pending
                                                ) {
                                                    return (
                                                        <UserTableBadge
                                                            type="weak"
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
                                <TableCell
                                    className="text-cut align-baseline"
                                    data-testid="users-and-addresses-table:memberRole"
                                >
                                    <div
                                        className={clsx(
                                            'flex flex-column flex-nowrap',
                                            magicLinkInvitationPending && 'color-hint'
                                        )}
                                    >
                                        <MemberRole member={member} />
                                        {isFamilyInvitationPending && (
                                            <span>
                                                <UserTableBadge type="weak">
                                                    {c('familyOffer_2023:Family plan').t`Pending`}
                                                </UserTableBadge>
                                            </span>
                                        )}
                                    </div>
                                </TableCell>
                                <TableCell className="align-baseline">
                                    <div className={clsx(magicLinkInvitationPending && 'color-hint')}>
                                        {isFamilyInvitationPending ? (
                                            <p className="m-0 text-ellipsis">{member.Name}</p>
                                        ) : (
                                            <MemberAddresses addresses={memberAddresses} />
                                        )}
                                    </div>
                                </TableCell>
                                {showFeaturesColumn && (
                                    <TableCell className="align-baseline">
                                        {hasFeatures && <MemberFeatures member={member} organization={organization} />}
                                    </TableCell>
                                )}
                                <TableCell className="align-baseline">
                                    <div>
                                        {hasMagicLinkLayout ? (
                                            <MagicLinkMemberActions
                                                state={member.Unprivatization.State}
                                                onEdit={() => handleEditUser(member)}
                                                onResend={
                                                    canMagicLinkResend
                                                        ? () => {
                                                              setTmpMemberID(member.ID);
                                                              setResendInviteModalOpen(true);
                                                          }
                                                        : undefined
                                                }
                                                onDelete={() => handleDeleteUserConfirm(member)}
                                            />
                                        ) : (
                                            <MemberActions
                                                permissions={memberPermissions}
                                                onAddAddress={handleAddAddress}
                                                onEdit={handleEditUser}
                                                onDelete={handleDeleteUser}
                                                onSetup={handleSetupUser}
                                                onRevoke={handleRevokeUserSessions}
                                                onLogin={handleLoginUser}
                                                onChangePassword={handleChangeMemberPassword}
                                                member={member}
                                            />
                                        )}
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

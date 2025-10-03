import type { MutableRefObject } from 'react';
import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import {
    attachMemberSSO,
    deleteMember,
    detachMemberSSO,
    disableMember,
    enableMember,
    getDomainAddressError,
    useMemberAddresses,
} from '@proton/account';
import { useAddresses } from '@proton/account/addresses/hooks';
import { useCustomDomains } from '@proton/account/domains/hooks';
import { useMembers } from '@proton/account/members/hooks';
import { selectUnprivatizationState } from '@proton/account/members/unprivatizeMembers';
import { getDomainError } from '@proton/account/members/validateAddUser';
import { useOrganization } from '@proton/account/organization/hooks';
import { useGetOrganizationKey, useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { accessMemberThunk } from '@proton/account/organizationKey/memberAccessAction';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { getSSODomainsSet } from '@proton/account/samlSSO/helper';
import { useSamlSSO } from '@proton/account/samlSSO/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Avatar, Button, Tooltip } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import SearchInput from '@proton/components/components/input/SearchInput';
import Info from '@proton/components/components/link/Info';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import Table from '@proton/components/components/table/Table';
import TableBody from '@proton/components/components/table/TableBody';
import TableCell from '@proton/components/components/table/TableCell';
import TableRow from '@proton/components/components/table/TableRow';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSectionWide from '@proton/components/containers/account/SettingsSectionWide';
import { useAccountSpotlights } from '@proton/components/containers/account/spotlights/AccountSpotlightsProvider';
import {
    getInvitationAcceptLimit,
    getInvitationLimit,
} from '@proton/components/containers/members/UsersAndAddressesSection/helper';
import { isB2bPlanSupportingScribe } from '@proton/components/helpers/assistant';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import useApi from '@proton/components/hooks/useApi';
import useConfig from '@proton/components/hooks/useConfig';
import { useErrorWrapper } from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import {
    getHasDriveB2BPlan,
    getHasExternalMemberCapableB2BPlan,
    getHasPassB2BPlan,
    hasDuo,
    hasPassBusiness,
    hasVisionary,
} from '@proton/payments';
import { baseUseSelector } from '@proton/react-redux-store';
import { useDispatch } from '@proton/redux-shared-store';
import { getSilentApi } from '@proton/shared/lib/api/helpers/customConfig';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { resendUnprivatizationLink } from '@proton/shared/lib/api/members';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { LUMO_SHORT_APP_NAME, MEMBER_PRIVATE, MEMBER_TYPE, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { APPS } from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { hasBit } from '@proton/shared/lib/helpers/bitset';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { getInitials, normalize } from '@proton/shared/lib/helpers/string';
import { getKnowledgeBaseUrl } from '@proton/shared/lib/helpers/url';
import type { Address, EnhancedMember, Member } from '@proton/shared/lib/interfaces';
import { MEMBER_STATE, TwoFactorStatusFlags } from '@proton/shared/lib/interfaces';
import {
    MemberUnprivatizationMode,
    getIsMemberDisabled,
    getIsMemberInvited,
    getMemberUnprivatizationMode,
} from '@proton/shared/lib/keys/memberHelper';
import {
    getIsDomainActive,
    getOrganizationDenomination,
    getOrganizationKeyInfo,
    validateOrganizationKey,
} from '@proton/shared/lib/organization/helper';
import clsx from '@proton/utils/clsx';

import { SetupOrgSpotlight } from '../../account/spotlights/passB2bOnboardingSpotlights/PassB2bOnboardingSpotlights';
import AddressModal from '../../addresses/AddressModal';
import CreateMissingKeysAddressModal from '../../addresses/missingKeys/CreateMissingKeysAddressModal';
import useOrganizationModals from '../../organization/useOrganizationModals';
import useOrganizationUnprivatizationModals from '../../organization/useOrganizationUnprivatizationModals';
import AttachSSOMemberPrompt from '../AttachSSOMemberPrompt';
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
import UserAndAddressesSectionIntro from './UserAndAddressesSectionIntro';
import UsersAndAddressesSectionHeader from './UsersAndAddressesSectionHeader';
import UserTableBadge from './UsersTableBadge';

const UsersAndAddressesSection = ({ app, onceRef }: { app: APP_NAMES; onceRef: MutableRefObject<boolean> }) => {
    const { APP_NAME } = useConfig();
    const [organization, loadingOrganization] = useOrganization();
    const [organizationKey] = useOrganizationKey();
    const getOrganizationKey = useGetOrganizationKey();
    const [samlSSO] = useSamlSSO();
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [{ protonDomains, premiumDomains }] = useProtonDomains();
    const [members, loadingMembers] = useMembers();
    const [subscription, loadingSubscription] = useSubscription();
    const [addresses] = useAddresses();
    const [user] = useUser();
    const { value: memberAddressesMap, retry } = useMemberAddresses({ members, partial: true });
    const [keywords, setKeywords] = useState('');
    const [tmpMemberID, setTmpMemberID] = useState<string | null>(null);
    const normalApi = useApi();
    const api = getSilentApi(normalApi);
    const wrapError = useErrorWrapper();
    const dispatch = useDispatch();
    const accessToAssistant = useAssistantFeatureEnabled();
    const unprivatizationMemberState = baseUseSelector(selectUnprivatizationState);

    const hasReachedLimit = organization?.InvitationsRemaining === 0;
    const hasSetupActiveOrganizationWithKeys =
        organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganizationSetupWithKeys(organization);
    const organizationModals = useOrganizationModals(onceRef);
    const organizationUnprivatizationModals = useOrganizationUnprivatizationModals();

    const {
        passOnboardingSpotlights: { setupOrgSpotlight },
    } = useAccountSpotlights();

    const hasPassB2BPlan = getHasPassB2BPlan(subscription);
    const hasDriveB2BPlan = getHasDriveB2BPlan(subscription);
    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);

    const hasMaxAddresses = Boolean(organization?.MaxAddresses ?? 0);
    const useEmail = hasExternalMemberCapableB2BPlan;
    const allowStorageConfiguration =
        !hasExternalMemberCapableB2BPlan || hasDriveB2BPlan || hasPassBusiness(subscription);
    const allowVpnAccessConfiguration = !hasExternalMemberCapableB2BPlan;
    const allowPrivateMemberConfiguration = !hasExternalMemberCapableB2BPlan;
    // Allow to display a toggle in the UI
    const allowAIAssistantConfiguration = accessToAssistant.enabled && isB2bPlanSupportingScribe(organization, user);
    // Allow to update seats (this should be done automatically for visionary, family and duo plans)
    const allowAIAssistantUpdate = accessToAssistant.enabled;

    const lumoAddonAvailable = true;
    const visionary = hasVisionary(subscription);

    // Allow to display a toggle in the UI
    const allowLumoConfiguration =
        lumoAddonAvailable && !visionary && app !== APPS.PROTONVPN_SETTINGS && app !== APPS.PROTONPASS;
    // Allow to update seats (this should be done automatically for visionary)
    const allowLumoUpdate = lumoAddonAvailable;

    const showMultipleUserUploadButton = hasExternalMemberCapableB2BPlan;
    const showAddAddress = !hasExternalMemberCapableB2BPlan || hasPassB2BPlan;
    const showAddressesSection = !hasExternalMemberCapableB2BPlan && hasMaxAddresses;
    const showFeaturesColumn = !hasExternalMemberCapableB2BPlan || hasDriveB2BPlan || hasPassBusiness(subscription);

    const { MaxAI = 0, UsedAI = 0, MaxLumo = 0, UsedLumo = 0 } = organization || {};
    const aiSeatsRemaining = MaxAI > UsedAI;
    const lumoSeatsRemaining = MaxLumo > UsedLumo;

    const isOrgAFamilyPlan = getOrganizationDenomination(organization) === 'familyGroup';
    const hasDuoPlan = hasDuo(subscription);

    const canInviteProtonUsers = visionary || isOrgAFamilyPlan;
    const { createNotification } = useNotifications();

    const cleanOption = {
        onExit: () => setTmpMemberID(null),
    };

    const [addAddressModalProps, setAddAddressModalOpen, renderAddAddressModal] = useModalState();
    const [subUserCreateModalProps, setSubUserCreateModalOpen, renderSubUserCreateModal] = useModalState();
    const [attachSSOPromptProps, setAttachSSOPrompt, renderAttachSSOPrompt] = useModalState(cleanOption);
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

    const verifiedMailDomains = useMemo(() => (customDomains || []).filter(getIsDomainActive), [customDomains]);
    const ssoDomainsSet = useMemo(() => {
        return getSSODomainsSet({ domains: customDomains, ssoConfigs: samlSSO?.configs });
    }, [customDomains, samlSSO?.configs]);

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

    const handleDeleteUserConfirm = wrapError(async (member: Member) => {
        await dispatch(deleteMember({ api, member }));
        createNotification({ text: c('Success message').t`User deleted` });
    });

    const handleSetupUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);
        retry([member]);
        setUserSetupModal(true);
    };

    const handleResendMagicLinkInvite = wrapError(async (member: EnhancedMember) => {
        await api(resendUnprivatizationLink(member.ID));
        createNotification({ text: c('Success message').t`Invitation resent` });
    });

    const handleDeleteUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);

        //  We can remove members if the user is a Proton member (excluding logged user)
        if (canInviteProtonUsers && member.Type === MEMBER_TYPE.PROTON && !member.Self) {
            setUserRemoveModalOpen(true);
        } else {
            setSubUserDeleteModalOpen(true);
        }
    };

    const handleAttachSSO = wrapError(async (member: EnhancedMember) => {
        await dispatch(attachMemberSSO({ api, member }));
        const n = 1;
        createNotification({
            text: c('sso').ngettext(msgid`${n} user converted to SSO`, `${n} users converted to SSO`, n),
        });
        setTmpMemberID(member.ID);
        setAttachSSOPrompt(true);
    });

    const handleDetachSSO = wrapError(async (member: EnhancedMember) => {
        await dispatch(detachMemberSSO({ api, member }));
        const n = 1;
        createNotification({
            text: c('sso').ngettext(msgid`${n} user detached from SSO`, `${n} users detached from SSO`, n),
        });
    });

    const handleRevokeUserSessions = wrapError(async (member: EnhancedMember) => {
        await api(revokeSessions(member.ID));
        createNotification({ text: c('Success message').t`Sessions revoked` });
    });

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
        if (canInviteProtonUsers) {
            setInviteOrCreateUserModalOpen(true);
            return;
        }

        if (!useEmail && !verifiedMailDomains.length) {
            createNotification({ text: getDomainError(), type: 'error' });
            return;
        }

        setSubUserCreateModalOpen(true);
    };

    const handleLoginUser = wrapError(async (member: EnhancedMember) => {
        const organizationKey = await getOrganizationKey();
        const orgKeyError = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
        if (orgKeyError) {
            createNotification({ type: 'error', text: orgKeyError });
            return;
        }
        setTmpMemberID(member.ID);
        await dispatch(accessMemberThunk({ member }));
        setLoginMemberModalOpen(true);
    });

    const handleUpdateMemberState = wrapError(async (member: EnhancedMember, status: MEMBER_STATE) => {
        const action = status === MEMBER_STATE.STATUS_DISABLED ? disableMember : enableMember;
        await dispatch(action({ api, member }));
        const text =
            status === MEMBER_STATE.STATUS_DISABLED
                ? c('Success message').t`User disabled`
                : c('Success message').t`User enabled`;
        createNotification({ text });
    });

    const handleChangeMemberPassword = async (member: EnhancedMember) => {
        const organizationKey = await getOrganizationKey();
        const orgKeyError = validateOrganizationKey(getOrganizationKeyInfo(organization, organizationKey, addresses));
        if (orgKeyError) {
            return createNotification({ type: 'error', text: orgKeyError });
        }
        setTmpMemberID(member.ID);
        setChangeMemberPasswordModalOpen(true);
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

    const disableInviteUserButton =
        loadingSubscription || loadingOrganization || loadingCustomDomains || hasReachedLimit;

    const disableAddUserButton =
        loadingSubscription ||
        loadingOrganization ||
        loadingCustomDomains ||
        (organization?.UsedMembers || 0) >= (organization?.MaxMembers || 0);

    const loadingAddAddresses = loadingOrganization || loadingCustomDomains || loadingMembers;
    const disableAddAddressButton = loadingAddAddresses || organization?.State === ORGANIZATION_STATE.DELINQUENT;

    const tmpMember = members?.find((member) => tmpMemberID === member.ID);

    return (
        <SettingsSectionWide>
            {organizationModals.info}
            {organizationUnprivatizationModals.memberInfo}
            {organizationModals.modals}
            <SettingsParagraph large className="flex items-center mb-6 gap-2">
                <UserAndAddressesSectionIntro />
            </SettingsParagraph>
            <div className="mb-4 flex items-start">
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
                        verifiedDomains={verifiedMailDomains}
                        app={app}
                        onSuccess={setupOrgSpotlight.close}
                        useEmail={useEmail}
                        optionalName={hasExternalMemberCapableB2BPlan}
                        members={members}
                        aiSeatsRemaining={aiSeatsRemaining}
                        lumoSeatsRemaining={lumoSeatsRemaining}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowVpnAccessConfiguration={allowVpnAccessConfiguration}
                        allowPrivateMemberConfiguration={allowPrivateMemberConfiguration}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration}
                        allowLumoConfiguration={allowLumoConfiguration}
                        showMultipleUserUploadButton={showMultipleUserUploadButton}
                        disableStorageValidation={!allowStorageConfiguration}
                        disableDomainValidation={useEmail}
                        disableAddressValidation={hasPassB2BPlan}
                        {...subUserCreateModalProps}
                    />
                )}
                {renderResendInviteModal && tmpMember && (
                    <ResendInvitePrompt
                        email={tmpMember.Unprivatization?.InvitationEmail || tmpMember.Name || ''}
                        onResend={() => handleResendMagicLinkInvite(tmpMember)}
                        {...resendInviteProps}
                    />
                )}
                {renderSubUserEditModal && tmpMember && (
                    <SubUserEditModal
                        member={tmpMember}
                        aiSeatsRemaining={aiSeatsRemaining}
                        lumoSeatsRemaining={lumoSeatsRemaining}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowVpnAccessConfiguration={allowVpnAccessConfiguration}
                        allowPrivateMemberConfiguration={allowPrivateMemberConfiguration}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration && !Boolean(tmpMember.SSO)}
                        allowLumoConfiguration={allowLumoConfiguration && !Boolean(tmpMember.SSO)}
                        showAddressesSection={(() => {
                            const unprivatization = getMemberUnprivatizationMode(tmpMember);
                            return (
                                showAddressesSection &&
                                unprivatization.mode !== MemberUnprivatizationMode.MagicLinkInvite
                            );
                        })()}
                        {...subUserEditModalProps}
                    />
                )}
                {renderUserInviteOrEditModal && (
                    <UserInviteOrEditModal
                        member={tmpMember}
                        organization={organization}
                        aiSeatsRemaining={aiSeatsRemaining}
                        lumoSeatsRemaining={lumoSeatsRemaining}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration && !Boolean(tmpMember?.SSO)}
                        allowAIAssistantUpdate={allowAIAssistantUpdate}
                        allowStorageConfiguration={allowStorageConfiguration}
                        allowLumoConfiguration={allowLumoConfiguration && !Boolean(tmpMember?.SSO)}
                        allowLumoUpdate={allowLumoUpdate}
                        {...userInviteOrEditModalProps}
                    />
                )}
                {renderLoginMemberModal && tmpMember && (
                    <LoginMemberModal app={app} member={tmpMember} {...loginMemberModalProps} />
                )}
                {renderChangeMemberPasswordModal && tmpMember && (
                    <ChangeMemberPasswordModal member={tmpMember} {...changeMemberPasswordModalProps} />
                )}
                {renderAttachSSOPrompt && tmpMember && (
                    <AttachSSOMemberPrompt member={tmpMember} {...attachSSOPromptProps} />
                )}
                {renderInviteOrCreateUserModal && (
                    <InviteUserCreateSubUserModal
                        members={members}
                        organization={organization}
                        aiSeatsRemaining={aiSeatsRemaining}
                        lumoSeatsRemaining={lumoSeatsRemaining}
                        verifiedDomains={verifiedMailDomains}
                        allowAIAssistantConfiguration={allowAIAssistantConfiguration}
                        allowLumoConfiguration={allowLumoConfiguration}
                        onInviteUser={handleInviteUser}
                        app={app}
                        {...inviteOrCreateUserModalProps}
                    />
                )}
                <div className="flex items-center mb-2 gap-2 mr-4">
                    {!showAddAddress ? (
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
                            {isOrgAFamilyPlan ? (
                                <Button color="norm" disabled={disableInviteUserButton} onClick={handleInviteUser}>
                                    {c('Action').t`Invite user`}
                                </Button>
                            ) : (
                                <Button color="norm" disabled={disableAddUserButton} onClick={handleAddUser}>
                                    {c('Action').t`Add user`}
                                </Button>
                            )}

                            {/* Only family and visionary can invite existing Proton users */}
                            {canInviteProtonUsers &&
                                (hasReachedLimit ? (
                                    <Info
                                        className="color-danger"
                                        title={hasDuoPlan ? getInvitationLimit(3) : getInvitationLimit(10)}
                                    />
                                ) : (
                                    <Info
                                        title={hasDuoPlan ? getInvitationAcceptLimit(3) : getInvitationAcceptLimit(10)}
                                    />
                                ))}

                            {hasMaxAddresses ? (
                                <Button
                                    shape="outline"
                                    disabled={disableAddAddressButton}
                                    onClick={() => handleAddAddress()}
                                >
                                    {c('Action').t`Add address`}
                                </Button>
                            ) : null}
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
            </div>
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
                            ssoDomainsSet,
                            appName: APP_NAME,
                            user,
                            member,
                            addresses: memberAddresses,
                            organization,
                            organizationKey,
                            disableMemberSignIn: hasExternalMemberCapableB2BPlan,
                        });

                        const disableEdit = hasPendingFamilyInvitation && !allowStorageConfiguration;

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
                                                                const result =
                                                                    unprivatizationMemberState.members[member.ID];
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
                                                            {allowPrivateMemberConfiguration &&
                                                                !isOrgAFamilyPlan &&
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
                                                                <UserTableBadge type="weak">
                                                                    {c('Users table: badge').t`Writing assistant`}
                                                                </UserTableBadge>
                                                            )}
                                                            {member.NumLumo > 0 && (
                                                                <UserTableBadge type="weak">
                                                                    {LUMO_SHORT_APP_NAME}
                                                                </UserTableBadge>
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
                                                            {hasBit(member['2faStatus'], TwoFactorStatusFlags.Totp) && (
                                                                <UserTableBadge type="weak">
                                                                    {c('Users table: badge').t`Authenticator app`}
                                                                </UserTableBadge>
                                                            )}
                                                            {hasBit(
                                                                member['2faStatus'],
                                                                TwoFactorStatusFlags.Fido2
                                                            ) && (
                                                                <UserTableBadge type="weak">
                                                                    {c('Users table: badge').t`Security key`}
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
                                <TableCell
                                    className="text-cut align-baseline"
                                    data-testid="users-and-addresses-table:memberRole"
                                >
                                    <div
                                        className={clsx(
                                            'flex flex-column flex-nowrap',
                                            hasDisabledLayout && 'color-hint'
                                        )}
                                    >
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
                                {showFeaturesColumn && (
                                    <TableCell className="align-baseline">
                                        {hasFeaturesColumn && (
                                            <MemberFeatures member={member} organization={organization} />
                                        )}
                                    </TableCell>
                                )}
                                <TableCell className="align-baseline">
                                    <div>
                                        {hasMagicLinkLayout ? (
                                            <MagicLinkMemberActions
                                                state={member.Unprivatization?.State}
                                                onEdit={() => handleEditUser(member)}
                                                onResend={
                                                    canResendMagicLink
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
                                                onUpdateMemberState={handleUpdateMemberState}
                                                onDelete={handleDeleteUser}
                                                onSetup={handleSetupUser}
                                                onRevoke={handleRevokeUserSessions}
                                                onAttachSSO={handleAttachSSO}
                                                onDetachSSO={handleDetachSSO}
                                                onLogin={handleLoginUser}
                                                onChangePassword={handleChangeMemberPassword}
                                                member={member}
                                                disableEdit={disableEdit}
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

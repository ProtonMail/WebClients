import { useMemo, useState } from 'react';

import { c, msgid } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { useCustomDomains } from '@proton/account/domains/hooks';
import {
    attachMemberSSO,
    deleteMember,
    detachMemberSSO,
    disableMember,
    enableMember,
} from '@proton/account/members/actions';
import { useMemberAddresses } from '@proton/account/members/useMemberAddresses';
import { getDomainAddressError, getDomainError } from '@proton/account/members/validateAddUser';
import { useOrganization } from '@proton/account/organization/hooks';
import { useGetOrganizationKey, useOrganizationKey } from '@proton/account/organizationKey/hooks';
import { accessMemberThunk } from '@proton/account/organizationKey/memberAccessAction';
import { useProtonDomains } from '@proton/account/protonDomains/hooks';
import { getSSODomainsSet } from '@proton/account/samlSSO/helper';
import { useSamlSSO } from '@proton/account/samlSSO/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useAccountSpotlights } from '@proton/components/containers/account/spotlights/AccountSpotlightsProvider';
import AddressModal from '@proton/components/containers/addresses/AddressModal';
import CreateMissingKeysAddressModal from '@proton/components/containers/addresses/missingKeys/CreateMissingKeysAddressModal';
import AttachSSOMemberPrompt from '@proton/components/containers/members/AttachSSOMemberPrompt';
import InviteUserCreateSubUserModal from '@proton/components/containers/members/InviteUserCreateSubUserModal';
import LoginMemberModal from '@proton/components/containers/members/LoginMemberModal';
import SubUserCreateModal from '@proton/components/containers/members/SubUserCreateModal';
import SubUserDeleteModal from '@proton/components/containers/members/SubUserDeleteModal';
import UserRemoveModal from '@proton/components/containers/members/UserRemoveModal';
import { isB2bPlanSupportingScribe } from '@proton/components/helpers/assistant';
import useAssistantFeatureEnabled from '@proton/components/hooks/assistant/useAssistantFeatureEnabled';
import { useErrorWrapper } from '@proton/components/hooks/useErrorHandler';
import useNotifications from '@proton/components/hooks/useNotifications';
import { useSilentApi } from '@proton/components/hooks/useSilentApi';
import {
    getHasDriveB2BPlan,
    getHasExternalMemberCapableB2BPlan,
    getHasPassB2BPlan,
    hasDuo,
    hasPassBusiness,
    hasVPNPassProfessional,
    hasVisionary,
} from '@proton/payments/core/subscription/helpers';
import { useDispatch } from '@proton/redux-shared-store/sharedProvider';
import { revokeSessions } from '@proton/shared/lib/api/memberSessions';
import { resendUnprivatizationLink } from '@proton/shared/lib/api/members';
import { APPS, type APP_NAMES, MEMBER_PRIVATE, MEMBER_TYPE, ORGANIZATION_STATE } from '@proton/shared/lib/constants';
import { getAvailableAddressDomains } from '@proton/shared/lib/helpers/address';
import { hasOrganizationSetupWithKeys } from '@proton/shared/lib/helpers/organization';
import { type Address, type EnhancedMember, MEMBER_STATE, type Member } from '@proton/shared/lib/interfaces';
import { MemberUnprivatizationMode, getMemberUnprivatizationMode } from '@proton/shared/lib/keys/memberHelper';
import {
    getIsDomainActive,
    getOrganizationDenomination,
    getOrganizationKeyInfo,
    validateOrganizationKey,
} from '@proton/shared/lib/organization/helper';

import ChangeMemberPasswordModal from '../ChangeMemberPasswordModal';
import ResendInvitePrompt from '../ResendInvitePrompt';
import SubUserEditModal from '../SubUserEditModal';
import UserInviteOrEditModal from '../UserInviteOrEditModal';

export const useMemberActions = ({
    app,
    members,
    loadingMembers,
    syncMembers,
}: {
    app: APP_NAMES;
    members: EnhancedMember[] | undefined;
    loadingMembers: boolean;
    syncMembers: () => void;
}) => {
    const { value: memberAddressesMap, retry } = useMemberAddresses({ members, partial: true });
    const api = useSilentApi();
    const dispatch = useDispatch();

    const {
        passOnboardingSpotlights: { setupOrgSpotlight },
    } = useAccountSpotlights();

    const getOrganizationKey = useGetOrganizationKey();
    const [subscription, loadingSubscription] = useSubscription();
    const [organization, loadingOrganization] = useOrganization();
    const [customDomains, loadingCustomDomains] = useCustomDomains();
    const [addresses] = useAddresses();
    const [user] = useUser();
    const [organizationKey] = useOrganizationKey();
    const [samlSSO] = useSamlSSO();
    const accessToAssistant = useAssistantFeatureEnabled();
    const [{ protonDomains, premiumDomains }] = useProtonDomains();
    const ssoDomainsSet = useMemo(() => {
        return getSSODomainsSet({ domains: customDomains, ssoConfigs: samlSSO?.configs });
    }, [customDomains, samlSSO?.configs]);

    const wrapError = useErrorWrapper();
    const { createNotification } = useNotifications();

    const [tmpMemberID, setTmpMemberID] = useState<string | null>(null);
    const cleanOption = {
        onExit: () => setTmpMemberID(null),
    };

    const hasDriveB2BPlan = getHasDriveB2BPlan(subscription);
    const hasExternalMemberCapableB2BPlan = getHasExternalMemberCapableB2BPlan(subscription);

    const hasMaxAddresses = Boolean(organization?.MaxAddresses ?? 0);
    const useEmail = hasExternalMemberCapableB2BPlan;
    const allowStorageConfiguration =
        !hasExternalMemberCapableB2BPlan ||
        hasDriveB2BPlan ||
        hasPassBusiness(subscription) ||
        hasVPNPassProfessional(subscription);
    // VPN + Pass B2B bundle needs to disable VPN to be able to downgrade to Pass Professional
    const allowVpnAccessConfiguration = !hasExternalMemberCapableB2BPlan || hasVPNPassProfessional(subscription);
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
    const showAddressesSection = !hasExternalMemberCapableB2BPlan && hasMaxAddresses;

    const { MaxAI = 0, UsedAI = 0, MaxLumo = 0, UsedLumo = 0 } = organization || {};
    const aiSeatsRemaining = MaxAI > UsedAI;
    const lumoSeatsRemaining = MaxLumo > UsedLumo;

    const isOrgAFamilyPlan = getOrganizationDenomination(organization) === 'familyGroup';

    const canInviteProtonUsers = visionary || isOrgAFamilyPlan;

    const verifiedMailDomains = useMemo(() => (customDomains || []).filter(getIsDomainActive), [customDomains]);

    const hasPassB2BPlan = getHasPassB2BPlan(subscription);
    const hasDuoPlan = hasDuo(subscription);

    const showFeaturesColumn =
        !hasExternalMemberCapableB2BPlan ||
        hasDriveB2BPlan ||
        hasPassBusiness(subscription) ||
        hasVPNPassProfessional(subscription);

    const disableAddUserButton =
        loadingSubscription ||
        loadingOrganization ||
        loadingCustomDomains ||
        (organization?.UsedMembers || 0) >= (organization?.MaxMembers || 0);

    const showAddAddress = !hasExternalMemberCapableB2BPlan || hasPassB2BPlan;

    const hasReachedInvitationLimit = organization?.InvitationsRemaining === 0;
    const disableInviteUserButton =
        loadingSubscription || loadingOrganization || loadingCustomDomains || hasReachedInvitationLimit;

    const loadingAddAddresses = loadingOrganization || loadingCustomDomains || loadingMembers;
    const disableAddAddressButton = loadingAddAddresses || organization?.State === ORGANIZATION_STATE.DELINQUENT;

    const hasSetupActiveOrganizationWithKeys =
        organization?.State === ORGANIZATION_STATE.ACTIVE && hasOrganizationSetupWithKeys(organization);

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

    const handleDeleteUserConfirm = wrapError(async (member: Member) => {
        await dispatch(deleteMember({ api, member }));
        await syncMembers();
        createNotification({ text: c('Success message').t`User deleted` });
    });

    const handleSetupUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);
        retry([member]);
        setUserSetupModal(true);
    };

    const handleResendMagicLinkInvite = wrapError(async (member: EnhancedMember) => {
        await api(resendUnprivatizationLink(member.ID));
        await syncMembers();
        createNotification({ text: c('Success message').t`Invitation resent` });
    });

    const handleDeleteUser = (member: EnhancedMember) => {
        setTmpMemberID(member.ID);

        //  We can remove members if the user is a Proton member (excluding logged user)
        if (member.Type === MEMBER_TYPE.PROTON && !member.Self) {
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
        await syncMembers();
        createNotification({ text: c('Success message').t`Sessions revoked` });
    });

    const handleInviteUser = () => {
        setUserInviteOrEditModalOpen(true);
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
        if (member.Type === MEMBER_TYPE.PROTON && !member.Self && member.State === MEMBER_STATE.STATUS_INVITED) {
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
        await syncMembers();
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

    const tmpMember = members?.find((member) => tmpMemberID === member.ID);

    const modals = (
        <>
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
                    disableAddressValidation={hasExternalMemberCapableB2BPlan}
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
                            showAddressesSection && unprivatization.mode !== MemberUnprivatizationMode.MagicLinkInvite
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
        </>
    );

    const actions = {
        handleAddUser,
        handleEditUser,
        handleAddAddress,
        handleAttachSSO,
        handleDetachSSO,
        handleLoginUser,
        handleSetupUser,
        handleDeleteUser,
        handleChangeMemberPassword,
        handleUpdateMemberState,
        handleRevokeUserSessions,
        handleInviteUser,
        handleDeleteUserConfirm,
        handleResendMagicLinkInvite: (member: Member) => {
            setTmpMemberID(member.ID);
            setResendInviteModalOpen(true);
        },
    };

    const meta = {
        showFeaturesColumn,
        allowStorageConfiguration,
        allowPrivateMemberConfiguration,
        isOrgAFamilyPlan,
        useEmail,
        hasExternalMemberCapableB2BPlan,
        disableAddUserButton,
        showAddAddress,
        canInviteProtonUsers,
        disableInviteUserButton,
        disableAddAddressButton,
        hasSetupActiveOrganizationWithKeys,
        hasMaxAddresses,
        hasReachedInvitationLimit,
        hasDuoPlan,
    };

    const models = {
        memberAddressesMap,
        user,
        organization,
        organizationKey,
        ssoDomainsSet,
    };

    return {
        models,
        modals,
        actions,
        meta,
    };
};

export type UseUserMemberActions = ReturnType<typeof useMemberActions>;

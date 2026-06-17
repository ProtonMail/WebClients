import { c } from 'ttag';

import { useAddresses } from '@proton/account/addresses/hooks';
import { getIsOutgoingDelegatedAccessAvailable } from '@proton/account/delegatedAccess/available';
import { useOrganization } from '@proton/account/organization/hooks';
import { useIsDataRecoveryAvailable } from '@proton/account/recovery/dataRecovery';
import { useIsSessionRecoveryAvailable } from '@proton/account/recovery/sessionRecoveryHooks';
import { useReferralInfo } from '@proton/account/referralInfo/hooks';
import { useUser } from '@proton/account/user/hooks';
import { useUserKeys } from '@proton/account/userKeys/hooks';
import { useUserSettings } from '@proton/account/userSettings/hooks';
import type { SectionConfig } from '@proton/components/containers/layout/interface';
import { SettingsLayoutVariant } from '@proton/components/containers/layout/interface';
import { useReferralUserEligible } from '@proton/components/containers/referral/hooks/useReferralUserEligible';
import useRecoveryNotification from '@proton/components/hooks/useRecoveryNotification';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import { isAndroid } from '@proton/shared/lib/helpers/browser';
import { getIsAccountRecoveryAvailable } from '@proton/shared/lib/helpers/recovery';
import { UserType } from '@proton/shared/lib/interfaces';
import { getIsExternalAccount } from '@proton/shared/lib/keys/setupAddress';
import { useFlag } from '@proton/unleash/useFlag';

import { LiteAppPaths } from '../../helper';

export const useAccountSettingRoutes = () => {
    const [user] = useUser();
    const [organization, loadingOrganization] = useOrganization();
    const [, loadingUserSettings] = useUserSettings();
    const [, loadingAddress] = useAddresses();
    useUserKeys();

    const isZoomIntegrationDisabled = useFlag('ZoomIntegrationDisabled');
    const isProtonMeetIntegrationEnabled = useFlag('NewScheduleOption');

    const [{ isMnemonicAvailable, isRecoveryFileAvailable }, loadingDataRecovery] = useIsDataRecoveryAvailable();
    const isAccountRecoveryAvailable = getIsAccountRecoveryAvailable(user);
    const isDelegatedAccessAvailable = user.isPrivate && getIsOutgoingDelegatedAccessAvailable(user);
    const [isSessionRecoveryAvailable, loadingIsSessionRecoveryAvailable] = useIsSessionRecoveryAvailable();
    const recoveryNotification = useRecoveryNotification(false, false);
    const { isUserEligible: isReferralProgramEnabled } = useReferralUserEligible();
    const [referralInfo] = useReferralInfo();
    const credits = referralInfo.uiData.maxRewardAmount;
    const isExternalUser = getIsExternalAccount(user);

    const showVideoConferenceSection =
        (!isZoomIntegrationDisabled || isProtonMeetIntegrationEnabled) &&
        !isExternalUser &&
        (organization?.Settings.VideoConferencingEnabled || !user.hasPaidMail);

    const loading =
        loadingDataRecovery ||
        loadingIsSessionRecoveryAvailable ||
        loadingUserSettings ||
        loadingAddress ||
        loadingOrganization;

    const routes: Record<string, SectionConfig> = {
        recovery: {
            to: LiteAppPaths.Recovery,
            noTitle: true,
            id: 'recovery',
            text: c('Title').t`Recovery`,
            description: c('Description')
                .t`${BRAND_NAME}'s end-to-end encryption means only you can unlock your data. Set up recovery options now to ensure you never lose access.`,
            icon: 'key',
            available: isAccountRecoveryAvailable,
            notification: recoveryNotification?.color,
            subsections: [
                {
                    text: '',
                    id: 'checklist',
                },
            ],
            subrouteGroups: {
                passwordReset: {
                    id: 'password-reset-options',
                    title: c('Title').t`Password reset options`,
                    description: c('Description')
                        .t`This allows you to regain access to your ${BRAND_NAME} account but does not recover your encrypted data.`,
                    subroutes: {
                        email: {
                            id: 'email',
                            text: c('Title').t`Email verification`,
                            to: '/email',
                            variant: SettingsLayoutVariant.Mobile,
                        },
                        phone: {
                            id: 'phone',
                            text: c('Title').t`SMS verification`,
                            to: '/phone',
                            variant: SettingsLayoutVariant.Mobile,
                        },
                    },
                },
                dataRecovery: {
                    id: 'data-recovery-options',
                    title: c('Title').t`Data recovery options`,
                    description: c('Description').t`How you unlock your encrypted data if you lose your password.`,
                    subroutes: {
                        deviceRecovery: {
                            id: 'device-backup',
                            text: c('Title').t`Device data backup`,
                            to: '/device-backup',
                            available: isRecoveryFileAvailable,
                            variant: SettingsLayoutVariant.Mobile,
                        },
                        backupFile: {
                            id: 'backup-file',
                            text: c('Title').t`Recovery file`,
                            to: '/backup-file',
                            available: isRecoveryFileAvailable,
                            variant: SettingsLayoutVariant.Mobile,
                        },
                        recoveryContacts: {
                            id: 'recovery-contacts',
                            text: c('emergency_access').t`Data recovery contacts`,
                            to: '/recovery-contacts',
                            available: isDelegatedAccessAvailable,
                            variant: SettingsLayoutVariant.Mobile,
                        },
                    },
                },
                advancedRecovery: {
                    id: 'advanced-recovery-options',
                    title: c('Title').t`Advanced recovery options`,
                    description: c('Description').t`Methods that include both password reset and data recovery.`,
                    subroutes: {
                        phrase: {
                            id: 'phrase',
                            text: c('Title').t`Recovery phrase`,
                            to: '/phrase',
                            available: isMnemonicAvailable,
                            variant: SettingsLayoutVariant.Mobile,
                        },
                        signedInReset: {
                            id: 'signed-in-reset',
                            text: c('Title').t`Signed-in reset`,
                            to: '/signed-in-reset',
                            available: isSessionRecoveryAvailable && isAndroid(),
                            variant: SettingsLayoutVariant.Mobile,
                        },
                        qrCode: {
                            id: 'qr-code',
                            text: c('Title').t`QR code sign-in`,
                            to: '/qr-code',
                            variant: SettingsLayoutVariant.Mobile,
                        },
                        emergencyContacts: {
                            id: 'emergency-contacts',
                            text: c('emergency_access').t`Emergency access`,
                            to: '/emergency-contacts',
                            available: isDelegatedAccessAvailable,
                            variant: SettingsLayoutVariant.Mobile,
                        },
                    },
                },
            },
        },
        referral: {
            id: 'referral',
            text: c('Title').t`Refer a friend`,
            title: c('Title').t`Invite friends. Get credits.`,
            description: c('Description').t`Get up to ${credits} in credits by inviting friends to ${BRAND_NAME}.`,
            to: LiteAppPaths.Referral,
            icon: 'money-bills',
            available: isReferralProgramEnabled,
            subsections: [
                {
                    id: 'referral-invite-section',
                },
                {
                    text: c('Title').t`Your referrals`,
                    id: 'referral-reward-section',
                },
            ],
        },
        notifications: {
            id: 'notifications',
            noTitle: true,
            icon: 'bell',
            to: LiteAppPaths.Notifications,
            text: c('Title').t`Notifications`,
            available: !user.isMember,
            subsections: [
                {
                    id: 'notification-settings',
                },
            ],
        },
        privacy: {
            id: 'privacy',
            noTitle: true,
            icon: 'alias',
            to: LiteAppPaths.Privacy,
            text: c('Title').t`Privacy`,
            available: true,
            subsections: [
                {
                    text: c('Title').t`Data collection`,
                    id: 'data-collection',
                },
                {
                    text: c('Title').t`Third-party apps and services`,
                    id: 'third-party',
                    available: showVideoConferenceSection,
                },
                {
                    text: c('Title').t`Delete account`,
                    id: 'delete',
                    available: user.isSelf && (user.Type === UserType.PROTON || user.Type === UserType.EXTERNAL),
                },
            ],
        },
    };

    return {
        loading,
        routes,
    };
};

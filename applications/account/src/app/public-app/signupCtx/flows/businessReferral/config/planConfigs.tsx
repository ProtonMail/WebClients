import { c } from 'ttag';

import DriveLogo from '@proton/components/components/logo/DriveLogo';
import LumoLogo from '@proton/components/components/logo/LumoLogo';
import MeetLogo from '@proton/components/components/logo/MeetLogo';
import PassLogo from '@proton/components/components/logo/PassLogo';
import VpnLogo from '@proton/components/components/logo/VpnLogo';
import {
    getDocumentEditor,
    getShortStorageFeatureB2B,
    getSyncAndBackupFeature,
    getVersionHistory,
} from '@proton/components/containers/payments/features/drive';
import {
    getFullChatHistoryText,
    getUnlimitedChatsText,
    getWebSearchAccess,
} from '@proton/components/containers/payments/features/lumo';
import { getNDomainsFeatureText } from '@proton/components/containers/payments/features/mail';
import {
    PAID_MAX_PARTICIPANTS,
    getMaxParticipantsText,
    getMeetMeetingRecordingText,
    getMeetingMaxLengthText,
} from '@proton/components/containers/payments/features/meet';
import {
    PASS_BIZ_VAULTS,
    get2FAAuthenticatorText,
    getNVaultsText,
    getUnlimitedHideMyEmailAliasesText,
} from '@proton/components/containers/payments/features/pass';
import {
    getB2BHighSpeedVPNConnectionsText,
    getNetShieldText,
    getVPNSpeed,
} from '@proton/components/containers/payments/features/vpn';
import { IcAlias } from '@proton/icons/icons/IcAlias';
import { IcBolt } from '@proton/icons/icons/IcBolt';
import { IcBrandProtonDrive } from '@proton/icons/icons/IcBrandProtonDrive';
import { IcBrandProtonMail } from '@proton/icons/icons/IcBrandProtonMail';
import { IcBrandProtonPass } from '@proton/icons/icons/IcBrandProtonPass';
import { IcBrandProtonVpn } from '@proton/icons/icons/IcBrandProtonVpn';
import { IcClockRotateLeft } from '@proton/icons/icons/IcClockRotateLeft';
import { IcHourglass } from '@proton/icons/icons/IcHourglass';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcMeetRecord } from '@proton/icons/icons/IcMeetRecord';
import { IcPenSquare } from '@proton/icons/icons/IcPenSquare';
import { IcShield } from '@proton/icons/icons/IcShield';
import { IcSpeechBubble } from '@proton/icons/icons/IcSpeechBubble';
import { IcUsers } from '@proton/icons/icons/IcUsers';
import { IcVault } from '@proton/icons/icons/IcVault';
import { PLANS } from '@proton/payments/core/constants';
import {
    DRIVE_SHORT_APP_NAME,
    LUMO_SHORT_APP_NAME,
    MEET_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_CONNECTIONS,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';

import LogoBundleProducts from '../../referral/components/PlanSelector/icons/bundle-products.svg';
import { getSecureStorageString } from '../../referral/helpers/i18n';
import type { BusinessPlanConfig } from '../components/plans/PlanSelector/PlanCard';

export type BusinessReferralPlan =
    | PLANS.BUNDLE_PRO_2024
    | PLANS.BUNDLE_BIZ_2025
    | PLANS.DRIVE_BUSINESS
    | PLANS.MEET_BUSINESS
    | PLANS.PASS_BUSINESS
    | PLANS.VPN_BUSINESS
    | PLANS.LUMO_BUSINESS;

export const getBusinessReferralPlanConfigs = (): BusinessPlanConfig[] => [
    {
        // Icon reuses the same bundle-products asset as Workspace Premium below — there's no
        // dedicated Workspace Standard icon in the codebase yet (the b2c referral flow's own
        // getPlanIconPath also maps both plans to the same icon).
        plan: PLANS.BUNDLE_PRO_2024,
        icon: <img src={LogoBundleProducts} alt="" />,
        iconTitle: c('Signup').t`WS Standard`,
        description: c('Plan description').t`Essential privacy and security suite for your business.`,
        features: [
            {
                icon: IcBrandProtonDrive,
                loading: true,
                textGetter: (payments) => {
                    const maxSpaceBytes = payments.plansMap[PLANS.BUNDLE_PRO_2024]?.MaxSpace;
                    return maxSpaceBytes ? getShortStorageFeatureB2B(maxSpaceBytes).text : '';
                },
            },
            {
                icon: IcBrandProtonMail,
                textGetter: (payments) =>
                    getNDomainsFeatureText(payments.plansMap[PLANS.BUNDLE_PRO_2024]?.MaxDomains ?? 20),
            },
            { icon: IcBrandProtonVpn, textGetter: () => getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS) },
            { icon: IcBrandProtonPass, textGetter: () => c('Signup').t`Unlimited vaults for your passwords` },
        ],
    },
    {
        plan: PLANS.BUNDLE_BIZ_2025,
        icon: <img src={LogoBundleProducts} alt="" />,
        iconTitle: c('Signup').t`WS Premium`,
        description: c('Plan description').t`Premium privacy and security suite for your business.`,
        features: [
            {
                icon: IcBrandProtonDrive,
                loading: true,
                textGetter: (payments) => {
                    const maxSpaceBytes = payments.plansMap[PLANS.BUNDLE_BIZ_2025]?.MaxSpace;
                    return maxSpaceBytes ? getShortStorageFeatureB2B(maxSpaceBytes).text : '';
                },
            },
            {
                icon: IcBrandProtonMail,
                textGetter: (payments) =>
                    getNDomainsFeatureText(payments.plansMap[PLANS.BUNDLE_BIZ_2025]?.MaxDomains ?? 20),
            },
            { icon: IcBrandProtonVpn, textGetter: () => getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS) },
            { icon: IcBrandProtonPass, textGetter: () => c('Signup').t`Unlimited vaults for your passwords` },
        ],
    },
    {
        plan: PLANS.DRIVE_BUSINESS,
        icon: <DriveLogo variant="glyph-only" />,
        iconTitle: DRIVE_SHORT_APP_NAME,
        description: c('Plan description').t`Secure cloud storage and file sharing for your business.`,
        features: [
            {
                icon: IcBrandProtonDrive,
                loading: true,
                textGetter: (payments) => {
                    const maxSpaceBytes = payments.plansMap[PLANS.DRIVE_BUSINESS]?.MaxSpace;
                    return getSecureStorageString(
                        maxSpaceBytes
                            ? humanSize({ bytes: maxSpaceBytes, fraction: 0, unitOptions: { max: 'TB' } })
                            : undefined
                    );
                },
            },
            { icon: IcClockRotateLeft, textGetter: () => getVersionHistory(365).text },
            { icon: IcPenSquare, textGetter: () => getDocumentEditor().text },
            { icon: IcPenSquare, textGetter: () => getSyncAndBackupFeature().text },
        ],
    },
    {
        plan: PLANS.MEET_BUSINESS,
        icon: <MeetLogo variant="glyph-only" />,
        iconTitle: MEET_SHORT_APP_NAME,
        description: c('Plan description').t`Confidential video conferencing for your business.`,
        features: [
            { icon: IcHourglass, textGetter: () => getMeetingMaxLengthText('paid') },
            { icon: IcUsers, textGetter: () => getMaxParticipantsText(PAID_MAX_PARTICIPANTS) },
            { icon: IcMeetRecord, textGetter: getMeetMeetingRecordingText },
        ],
    },
    {
        plan: PLANS.PASS_BUSINESS,
        icon: <PassLogo variant="glyph-only" />,
        iconTitle: PASS_SHORT_APP_NAME,
        description: c('Plan description').t`Next-level password management for your business.`,
        features: [
            { icon: IcVault, textGetter: () => getNVaultsText(PASS_BIZ_VAULTS) },
            { icon: IcAlias, textGetter: getUnlimitedHideMyEmailAliasesText },
            { icon: IcShield, textGetter: get2FAAuthenticatorText },
        ],
    },
    {
        plan: PLANS.VPN_BUSINESS,
        icon: <VpnLogo variant="glyph-only" />,
        iconTitle: VPN_SHORT_APP_NAME,
        description: c('Plan description').t`Secure, high-speed VPN access for your business.`,
        features: [
            { icon: IcBrandProtonVpn, textGetter: () => getB2BHighSpeedVPNConnectionsText(VPN_CONNECTIONS) },
            { icon: IcShield, textGetter: getNetShieldText },
            { icon: IcBolt, textGetter: () => getVPNSpeed('highest').text },
        ],
    },
    {
        plan: PLANS.LUMO_BUSINESS,
        icon: <LumoLogo variant="glyph-only" />,
        iconTitle: LUMO_SHORT_APP_NAME,
        description: c('Plan description').t`Privacy-first AI writing assistant for your business.`,
        features: [
            { icon: IcSpeechBubble, textGetter: getUnlimitedChatsText },
            { icon: IcClockRotateLeft, textGetter: getFullChatHistoryText },
            { icon: IcMagnifier, textGetter: () => getWebSearchAccess().text },
        ],
    },
];

import { c } from 'ttag';

import { WalletLogo } from '@proton/components';
import { getNUsersText } from '@proton/components/containers/payments/features/highlights';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { getNDomainsFeatureText } from '@proton/components/containers/payments/features/mail';
import {
    FREE_WALLETS,
    FREE_WALLET_ACCOUNTS,
    FREE_WALLET_EMAIL,
    UNLIMITED_WALLETS,
    UNLIMITED_WALLET_ACCOUNTS,
    UNLIMITED_WALLET_EMAIL,
    VISIONARY_WALLETS,
    VISIONARY_WALLET_ACCOUNTS,
    VISIONARY_WALLET_EMAIL,
    getBitcoinViaEmail,
    getWalletAccounts,
    getWalletEmailAddresses,
    getWallets,
} from '@proton/components/containers/payments/features/wallet';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { IcLock } from '@proton/icons/icons/IcLock';
import { IcMagnifier } from '@proton/icons/icons/IcMagnifier';
import { IcUser } from '@proton/icons/icons/IcUser';
import { CYCLE, PLANS } from '@proton/payments/core/constants';
import type { Plan, PlansMap } from '@proton/payments/core/plan/interface';
import {
    APPS,
    BRAND_NAME,
    PROTON_SENTINEL_NAME,
    VISIONARY_MAX_USERS,
    WALLET_APP_NAME,
    WALLET_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import humanSize from '@proton/shared/lib/helpers/humanSize';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import { planCardFeatureProps } from '../PlanCardSelector';
import SignupHeaderV2 from '../SignupHeaderV2';
import {
    getBenefits,
    getJoinString,
    getOpenSourceFeature,
    getSwissFeature,
    getSwissPrivacyLawsBenefit,
} from '../configuration/helper';
import CustomStep from '../defaultCustomStep/CustomStep';
import type { SignupConfiguration } from '../interface';
import { SignupMode } from '../interface';
import setupAccount from '../mail/account-setup.svg';

const getWalletBenefits = (): BenefitItem[] => {
    return [
        {
            id: 'end-to-end-encrypted-transactions',
            text: c('Signup: Info').t`End-to-end encrypted transactions`,
            icon: {
                component: IcLock,
            },
        },
        {
            id: 'self-custody',
            text: c('Signup: Info').t`Self-custody — only you have access to your wallet keys`,
            icon: {
                component: IcUser,
            },
        },
        getSwissPrivacyLawsBenefit(),
        {
            id: 'open-source-and-verified',
            text: c('Signup: Info').t`Open source and verified`,
            icon: {
                component: IcMagnifier,
            },
        },
    ].filter(isTruthy);
};

const getStorageFeature = (bytes: number): PlanCardFeatureDefinition => {
    const size = humanSize({ bytes, fraction: 0, unitOptions: { max: 'TB' } });

    return {
        id: 'storage',
        text: c('new_plans: feature').jt`${size} storage`,
        tooltip: c('wallet_signup_2024: Info').t`Encrypted email and file storage`,
        included: true,
    };
};

const getVpnFeature = () => {
    return {
        id: 'vpn',
        text: c('wallet_signup_2024: Info').t`Ultra fast and private VPN`,
        included: true,
    };
};

const getPasswordManagerFeature = () => {
    return {
        id: 'password-manager',
        text: c('wallet_signup_2024: Info').t`Encrypted password manager`,
        included: true,
    };
};

const getDriveFeature = () => {
    return {
        id: 'drive',
        text: c('wallet_signup_2024: Info').t`Encrypted cloud storage for photos and documents`,
        included: true,
    };
};

const getSentinelFeature = () => {
    return {
        id: 'sentinel',
        text: c('wallet_signup_2024: Info').t`Advanced account protection`,
        included: true,
        tooltip: c('wallet_signup_2024: Info').t`${PROTON_SENTINEL_NAME} program`,
    };
};

const getFreeWalletFeatures = () => {
    return [
        getWallets(FREE_WALLETS),
        getWalletAccounts(FREE_WALLET_ACCOUNTS),
        getWalletEmailAddresses(FREE_WALLET_EMAIL),
        getBitcoinViaEmail(),
    ];
};

const getUnlimitedFeatures = ({ plan }: { plan: Plan | undefined }) => {
    if (!plan) {
        return [];
    }
    return [
        getWallets(UNLIMITED_WALLETS),
        getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
        getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
        getBitcoinViaEmail(),
        getStorageFeature(plan.MaxSpace),
        {
            id: 'n-domains',
            text: getNDomainsFeatureText(plan.MaxDomains),
            included: true,
        },
        getVpnFeature(),
        getPasswordManagerFeature(),
        getDriveFeature(),
        getSentinelFeature(),
    ];
};

const getVisionaryFeatures = ({ plan }: { plan: Plan | undefined }) => {
    if (!plan) {
        return [];
    }
    return [
        getWallets(VISIONARY_WALLETS),
        getWalletAccounts(VISIONARY_WALLET_ACCOUNTS),
        getWalletEmailAddresses(VISIONARY_WALLET_EMAIL),
        getBitcoinViaEmail(),
        getStorageFeature(plan.MaxSpace),
        {
            id: 'n-domains',
            text: getNDomainsFeatureText(plan.MaxDomains),
            included: true,
        },

        getVpnFeature(),
        getPasswordManagerFeature(),
        getDriveFeature(),
        getSentinelFeature(),

        {
            id: 'users',
            text: getNUsersText(VISIONARY_MAX_USERS),
            included: true,
        },
    ];
};

export const getWalletConfiguration = ({
    mode,
    audience,
    hideFreePlan,
    isLargeViewport,
    plansMap,
}: {
    mode: SignupMode;
    audience: Audience.B2B | Audience.B2C;
    hideFreePlan: boolean;
    signedIn: boolean;
    plan: Plan;
    isLargeViewport: boolean;
    plansMap?: PlansMap;
}): SignupConfiguration => {
    const logo = <WalletLogo />;

    const appName = WALLET_APP_NAME;

    const title = c('wallet_signup_2024: Info').t`A safer way to hold your Bitcoin`;
    const inviteTitle1 = c('wallet_signup_2024: Info').t`You're Invited.`;
    const inviteTitle2 = c('wallet_signup_2024: Info').t`Exclusive early access to ${appName}.`;

    const features = [
        {
            id: 'self-custodial-wallet',
            left: <IcLock size={6} className="color-primary" />,
            text: c('wallet_signup_2024: Info').t`Self-custodial wallet`,
        },
        getOpenSourceFeature(),
        getSwissFeature({ fullText: isLargeViewport }),
    ];

    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [],
        [Audience.B2C]: [
            !hideFreePlan && {
                plan: PLANS.FREE,
                subline: c('wallet_signup_2024: Info').t`Securely hold and transact Bitcoin for free.`,
                subsection: (
                    <PlanCardFeatureList {...planCardFeatureProps} tooltip features={getFreeWalletFeatures()} />
                ),
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.BUNDLE,
                subline: c('wallet_signup_2024: Info')
                    .t`Take control of all your data with premium ${BRAND_NAME} services.`,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        tooltip
                        features={getUnlimitedFeatures({ plan: plansMap?.[PLANS.BUNDLE] })}
                    />
                ),
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.VISIONARY,
                subline: c('wallet_signup_2024: Info')
                    .t`Our most exclusive plan. Get early access to new features and all premium ${BRAND_NAME} services.`,
                subsection: (
                    <PlanCardFeatureList
                        {...planCardFeatureProps}
                        tooltip
                        features={getVisionaryFeatures({ plan: plansMap?.[PLANS.VISIONARY] })}
                    />
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

    const benefits = (() => {
        const benefitItems = getWalletBenefits();
        return (
            <div>
                <div className="text-lg text-semibold">{getBenefits(appName)}</div>
                <Benefits className="mt-5 mb-5" features={benefitItems} />
                <div>{getJoinString(audience)}</div>
            </div>
        );
    })();

    return {
        logo,
        title: {
            [SignupMode.Default]: <SignupHeaderV2>{title}</SignupHeaderV2>,
            [SignupMode.Invite]: (
                <SignupHeaderV2 className="max-w-full">
                    {inviteTitle1}
                    <br />
                    {inviteTitle2}
                </SignupHeaderV2>
            ),
            [SignupMode.MailReferral]: <SignupHeaderV2>{title}</SignupHeaderV2>,
            [SignupMode.PassSimpleLogin]: <SignupHeaderV2>{title}</SignupHeaderV2>,
        }[mode],
        features,
        benefits,
        planCards,
        audience,
        signupTypes: [SignupType.Proton, SignupType.External],
        generateMnemonic: false,
        defaults: {
            plan: PLANS.BUNDLE,
            cycle: CYCLE.YEARLY,
        },
        onboarding: {
            user: false,
            signup: true,
        },
        product: APPS.PROTONWALLET,
        shortProductAppName: WALLET_SHORT_APP_NAME,
        productAppName: WALLET_APP_NAME,
        setupImg: <img src={setupAccount} alt="" />,
        preload: (
            <>
                <link rel="prefetch" href={setupAccount} as="image" />
            </>
        ),
        CustomStep,
        cycles: [CYCLE.MONTHLY, CYCLE.YEARLY],
    };
};

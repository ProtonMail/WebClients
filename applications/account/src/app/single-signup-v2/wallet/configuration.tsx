import { c } from 'ttag';

import { Icon, WalletLogo } from '@proton/components';
import { getSentinel } from '@proton/components/containers/payments/features/highlights';
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
    WALLET_PLUS_WALLETS,
    WALLET_PLUS_WALLET_ACCOUNTS,
    WALLET_PLUS_WALLET_EMAIL,
    getBitcoinViaEmail,
    getWalletAccounts,
    getWalletEmailAddresses,
    getWallets,
} from '@proton/components/containers/payments/features/wallet';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { APPS, BRAND_NAME, CYCLE, PLANS, WALLET_APP_NAME, WALLET_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import type { Plan, PlansMap, VPNServersCountData } from '@proton/shared/lib/interfaces';
import { Audience } from '@proton/shared/lib/interfaces';
import isTruthy from '@proton/utils/isTruthy';

import { SignupType } from '../../signup/interfaces';
import type { BenefitItem } from '../Benefits';
import Benefits from '../Benefits';
import { planCardFeatureProps } from '../PlanCardSelector';
import StepLabel, { StepLabelSize } from '../StepLabel';
import { getBenefits, getGenericFeatures, getJoinString } from '../configuration/helper';
import type { SignupConfiguration } from '../interface';
import { SignupMode } from '../interface';
import setupAccount from '../mail/account-setup.svg';
import CustomStep from './CustomStep';

export const getWalletBenefits = (): BenefitItem[] => {
    return [
        {
            key: 1,
            text: c('pass_signup_2023: Info').t`End-to-end encryption`,
            icon: {
                name: 'lock' as const,
            },
        },
        {
            key: 2,
            text: c('pass_signup_2023: Info').t`Protected by Swiss privacy laws`,
            icon: {
                name: 'shield' as const,
            },
        },
        {
            key: 3,
            text: c('pass_signup_2023: Info').t`Open source and audited`,
            icon: {
                name: 'magnifier' as const,
            },
        },
        {
            key: 4,
            text: c('pass_signup_2023: Info').t`Works on all devices`,
            icon: {
                name: 'mobile' as const,
            },
        },
    ].filter(isTruthy);
};

export const getFreeWalletFeatures = () => {
    return [
        getWallets(FREE_WALLETS),
        getWalletAccounts(FREE_WALLET_ACCOUNTS),
        getWalletEmailAddresses(FREE_WALLET_EMAIL),
        getBitcoinViaEmail(),
    ];
};

export const getWalletPlusFeatures = () => {
    return [
        getWallets(WALLET_PLUS_WALLETS),
        getWalletAccounts(WALLET_PLUS_WALLET_ACCOUNTS),
        getWalletEmailAddresses(WALLET_PLUS_WALLET_EMAIL),
        getBitcoinViaEmail(),
        getSentinel(true),
    ];
};

export const getUnlimitedFeatures = () => {
    return [
        getWallets(UNLIMITED_WALLETS),
        getWalletAccounts(UNLIMITED_WALLET_ACCOUNTS),
        getWalletEmailAddresses(UNLIMITED_WALLET_EMAIL),
        getBitcoinViaEmail(),
        getSentinel(true),
    ];
};

export const getVisionaryFeatures = () => {
    return [
        getWallets(VISIONARY_WALLETS),
        getWalletAccounts(VISIONARY_WALLET_ACCOUNTS),
        getWalletEmailAddresses(VISIONARY_WALLET_EMAIL),
        getBitcoinViaEmail(),
        getSentinel(true),
    ];
};

const VisionaryWalletFeature = () => {
    return (
        <div className="mt-4 px-4 py-3 grow-0 bg-weak rounded flex items-center justify-center flex-nowrap gap-2 w-full">
            <Icon name="clock" className="color-hint shrink-0" />
            <p className="color-weak text-sm m-0">{c('wallet_signup_2024: Info').t`Early access to new features`}</p>
        </div>
    );
};

export const getWalletConfiguration = ({
    mode,
    audience,
    hideFreePlan,
    isLargeViewport,
    signedIn,
    plan,
}: {
    mode: SignupMode;
    audience: Audience.B2B | Audience.B2C;
    hideFreePlan: boolean;
    signedIn: boolean;
    plan: Plan;
    isLargeViewport: boolean;
    vpnServersCountData: VPNServersCountData;
    plansMap?: PlansMap;
}): SignupConfiguration => {
    const logo = <WalletLogo />;

    const appName = WALLET_APP_NAME;

    const title = c('wallet_signup_2024: Info').t`A safer way to hold your Bitcoin`;
    const inviteTitle1 = c('wallet_signup_2024: Info').t`You're Invited.`;
    const inviteTitle2 = c('wallet_signup_2024: Info').t`Exclusive early access to ${appName}.`;
    const onboardingTitle = c('wallet_signup_2024: Info').t`Unlock ${appName} premium features by upgrading`;

    const features = getGenericFeatures(isLargeViewport);

    const planCards: SignupConfiguration['planCards'] = {
        [Audience.B2B]: [],
        [Audience.B2C]: [
            !hideFreePlan && {
                plan: PLANS.FREE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getFreeWalletFeatures()} />,
                type: 'standard' as const,
                guarantee: false,
            },
            {
                plan: PLANS.WALLET,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getWalletPlusFeatures()} />,
                type: 'best' as const,
                guarantee: true,
            },
            {
                plan: PLANS.BUNDLE,
                subsection: <PlanCardFeatureList {...planCardFeatureProps} features={getUnlimitedFeatures()} />,
                type: 'standard' as const,
                guarantee: true,
            },
            {
                plan: PLANS.VISIONARY,
                subsection: (
                    <>
                        <PlanCardFeatureList {...planCardFeatureProps} features={getVisionaryFeatures()} />
                        <VisionaryWalletFeature />
                    </>
                ),
                type: 'standard' as const,
                guarantee: true,
            },
        ].filter(isTruthy),
    };

    const benefits = (() => {
        // TODO: WalletEA
        if (mode === SignupMode.Invite) {
            return (
                <div>
                    <div className="text-lg text-semibold">
                        {c('wallet_signup_2024: Info').t`Join ${appName} early access!`}
                    </div>
                    <div className="flex flex-column gap-2 my-6">
                        {[
                            {
                                title: c('wallet_signup_2024: Info').t`Get started`,
                                message: c('wallet_signup_2024: Info')
                                    .t`As an invited user, sign up for a free ${BRAND_NAME} account to exclusively get access to ${appName}`,
                            },
                            {
                                title: c('wallet_signup_2024: Info').t`Invite Friends`,
                                message: c('wallet_signup_2024: Info')
                                    .t`Visionary users and their invited friends can share early access with others, invite your friends to try ${appName} for free!`,
                            },
                        ].map(({ title, message }, i) => {
                            return (
                                <div className="flex flex-nowrap gap-2" key={title}>
                                    <div className="shrink-0">
                                        <StepLabel step={i + 1} size={StepLabelSize.small} className="color-primary" />
                                    </div>
                                    <div>
                                        <div className="text-semibold mb-1">{title}</div>
                                        <div className="text-sm">{message}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div>{getJoinString(audience)}</div>
                </div>
            );
        }
        if (signedIn || plan.Name !== PLANS.FREE) {
            const benefitItems = getWalletBenefits();
            return (
                benefitItems && (
                    <div>
                        <div className="text-lg text-semibold">{getBenefits(appName)}</div>
                        <Benefits className="mt-5 mb-5" features={benefitItems} />
                        <div>{getJoinString(audience)}</div>
                    </div>
                )
            );
        }
        // TODO: WalletEA
        return (
            <div>
                <div>
                    <div
                        className="py-0.5 px-2 rounded-lg text-sm text-semibold inline-flex flex-nowrap mb-6 items-center"
                        style={{
                            background: 'var(--interaction-norm-minor-1)',
                            color: 'var(--interaction-norm)',
                        }}
                    >
                        <Icon name="hourglass" size={4} className="shrink-0" />
                        <span className="ml-1 flex-1">{c('wallet_signup_2024: Info').t`Early access waitlist`}</span>
                    </div>
                </div>
                <div className="text-lg text-semibold">
                    {c('wallet_signup_2024: Info').t`Join ${appName} early access!`}
                </div>
                <div className="my-6">
                    {c('wallet_signup_2024: Info')
                        .t`Sign up for a free ${BRAND_NAME} account to secure your spot. The earlier you sign up, the sooner you will get access to ${appName}. After signup, you can also upgrade to our exclusive Visionary plan to skip the waitlist and start using ${appName} right away.`}
                </div>
                <div>{getJoinString(audience)}</div>
            </div>
        );
    })();

    return {
        logo,
        title: {
            [SignupMode.Default]: title,
            [SignupMode.Onboarding]: onboardingTitle,
            [SignupMode.Invite]: (
                <>
                    {inviteTitle1}
                    <br />
                    {inviteTitle2}
                </>
            ),
            [SignupMode.MailReferral]: title,
        }[mode],
        features,
        benefits,
        planCards,
        audience,
        signupTypes: [SignupType.Email, SignupType.Username],
        generateMnemonic: false,
        defaults: {
            plan: PLANS.WALLET,
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

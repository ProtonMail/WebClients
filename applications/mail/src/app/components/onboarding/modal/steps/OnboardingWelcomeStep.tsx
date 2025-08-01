import { type ReactNode } from 'react';

import { c } from 'ttag';

import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import { OnboardingStep, type OnboardingStepRenderCallback, useActiveBreakpoint } from '@proton/components';
import { MAIL_APP_NAME } from '@proton/shared/lib/constants';
import type { User } from '@proton/shared/lib/interfaces';
import { getIsBYOEAccount } from '@proton/shared/lib/keys';
import blockTrackersSvg from '@proton/styles/assets/img/onboarding/mail_onboarding_block_trackers_new.svg';
import encryptionSvg from '@proton/styles/assets/img/onboarding/mail_onboarding_encryption_new.svg';
import noAdsSvg from '@proton/styles/assets/img/onboarding/mail_onboarding_no_ads.svg';
import spamProtectionSvg from '@proton/styles/assets/img/onboarding/mail_onboarding_spam_protection.svg';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import { useGetStartedChecklist } from 'proton-mail/containers/onboardingChecklist/provider/GetStartedChecklistProvider';

import type { OnboardingStepEligibleCallback } from '../interface';
import OnboardingContent from '../layout/OnboardingContent';

const getPrivacyFeatures = (user: User) => {
    const isBYOE = getIsBYOEAccount(user);

    // translator: full sentence "Advanced encryption ensures only you and intended recipients can access your emails."
    const advancedEncryptionTitle = <b key="advancedEncryptionTitle">{c('Onboarding modal').t`Advanced encryption`}</b>;
    // translator: full sentence "Advanced encryption ensures only you and intended recipients can access your emails."
    const advancedEncryptionRule = c('Onboarding modal')
        .jt`${advancedEncryptionTitle} ensures only you and intended recipients can access your emails.`;

    // translator: full sentence "Add free promise means you'll never see sponsored ads in our apps."
    const addFreePromiseTitle = <b key="addFreePromiseTitle">{c('Onboarding modal').t`Ad-free promise`}</b>;
    // translator: full sentence "Add free promise means you'll never see sponsored ads in our apps."
    const addFreePromiseRule = c('Onboarding modal')
        .jt`${addFreePromiseTitle} means you'll never see sponsored ads in our apps.`;

    // translator: full sentence "Industry-leading spam protection keeps scam emails from ever reaching your inbox."
    const industryLeadingSpamProtectionTitle = (
        <b key={'industryLeadingSpamProtectionTitle'}>{c('Onboarding modal').t`Industry-leading spam protection`}</b>
    );
    // translator: full sentence "Industry-leading spam protection keeps scam emails from ever reaching your inbox."
    const industryLeadingSpamProtectionRule = c('Onboarding modal')
        .jt`${industryLeadingSpamProtectionTitle} keeps scam emails from ever reaching your inbox.`;

    // translator: full sentence "Protection from trackers means no more being followed across the internet."
    const protectionFromTrackersTitle = (
        <b key="protectionFromTrackersTitle">{c('Onboarding modal').t`Protection from trackers`}</b>
    );
    // translator: full sentence "Protection from trackers means no more being followed across the internet."
    const protectionFromTrackersRule = c('Onboarding modal')
        .jt`${protectionFromTrackersTitle} means no more being followed across the internet.`;

    return [
        !isBYOE && {
            id: 'advancedEncryption',
            description: advancedEncryptionRule,
            img: encryptionSvg,
        },
        isBYOE && {
            id: 'addFreePromise',
            description: addFreePromiseRule,
            img: noAdsSvg,
        },
        {
            id: 'industryLeadingSpamProtection',
            description: industryLeadingSpamProtectionRule,
            img: spamProtectionSvg,
        },
        {
            id: 'protectionFromTrackers',
            description: protectionFromTrackersRule,
            img: blockTrackersSvg,
        },
    ].filter(isTruthy);
};

export const isOnboardingWelcomeStepEligible: OnboardingStepEligibleCallback = async () => ({
    canDisplay: true,
    preload: [encryptionSvg, spamProtectionSvg, blockTrackersSvg],
});

const PrivacyFeature = ({ description, imgSrc }: { imgSrc: string; description: ReactNode }) => {
    const { viewportWidth } = useActiveBreakpoint();
    const isSmallViewPort = viewportWidth['<=small'];
    return (
        <div className="flex flex-row gap-4 items-center">
            <img
                className={clsx('w-custom', isSmallViewPort && 'self-start')}
                style={{ '--w-custom': isSmallViewPort ? '3rem' : '5rem' }}
                src={imgSrc}
                alt=""
                width="80"
                height="80"
            />
            <div className="flex-1 flex gap-0">
                <p className="m-0 text-weak">{description}</p>
            </div>
        </div>
    );
};

const OnboardingWelcomeStep = ({ onNext }: OnboardingStepRenderCallback) => {
    const { markItemsAsDone } = useGetStartedChecklist();
    const [user] = useUser();
    const privacyFeature = getPrivacyFeatures(user);

    const handleNext = () => {
        markItemsAsDone('ProtectInbox');
        onNext();
    };

    return (
        <OnboardingStep>
            <OnboardingContent
                title={c('Onboarding modal').t`Welcome to ${MAIL_APP_NAME}`}
                description={c('Onboarding modal').t`Where privacy is default.`}
                className="mb-16"
            >
                <div className="flex gap-y-4">
                    {privacyFeature.map(({ id, description, img }) => (
                        <PrivacyFeature key={id} imgSrc={img} description={description} />
                    ))}
                </div>
            </OnboardingContent>
            <footer>
                <Button size="large" color="norm" fullWidth onClick={handleNext}>
                    {c('Onboarding modal').t`Let's get started`}
                </Button>
            </footer>
        </OnboardingStep>
    );
};

export default OnboardingWelcomeStep;

/* eslint-disable @typescript-eslint/no-use-before-define */
import { useState } from 'react';

import { c } from 'ttag';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import { Button } from '@proton/atoms/Button/Button';
import { DriveLogo, MailLogo, PassLogo, VpnLogo } from '@proton/components';
import { getNormalizedPlanTitleToPlus } from '@proton/components/containers/payments/subscription/plusToPlusHelper';
import { IcChevronLeft } from '@proton/icons/icons/IcChevronLeft';
import { IcChevronRight } from '@proton/icons/icons/IcChevronRight';
import { PLANS, PLAN_NAMES, type PlanIDs } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import {
    DRIVE_SHORT_APP_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import { getPlanIconPath } from '../../helpers/planIcons';
import { type SupportedReferralPlans, getReferralSelectedPlan } from '../../helpers/plans';
import { BundleFeatures } from '../Features/BundleFeatures';
import { DriveFeatures } from '../Features/DriveFeatures';
import { MailFeatures } from '../Features/MailFeatures';
import { PassFeatures } from '../Features/PassFeatures';
import { VPNFeatures } from '../Features/VPNFeatures';
import { NoCreditCardBadge } from '../Layout/NoCreditCardBadge';
import { PlanLogo } from '../Layout/PlanLogo';
import PlanCard from './PlanCard';
import Pricing from './Pricing';
import { ReferralPlanIcon } from './ReferralPlanIcon';
import LogoBundleProducts from './icons/bundle-products.svg';

import './PlanSelector.scss';

interface Props {
    onPlanClick: (selectedPlan: { planIDs: PlanIDs }) => void;
    onCTAClick: () => void;
}

/** Visual order of plans as they appear in the icon grid */
const PLAN_DISPLAY_ORDER: SupportedReferralPlans[] = [PLANS.BUNDLE, PLANS.MAIL, PLANS.DRIVE, PLANS.PASS, PLANS.VPN2024];

enum CarouselDirection {
    Prev = 'prev',
    Next = 'next',
    Fade = 'fade',
}

const getAdjacentPlan = (
    eligiblePlans: string[],
    current: string,
    direction: Exclude<CarouselDirection, CarouselDirection.Fade>
): SupportedReferralPlans => {
    const orderedEligiblePlans = PLAN_DISPLAY_ORDER.filter((plan) => eligiblePlans.includes(plan));
    const currentIndex = orderedEligiblePlans.indexOf(current as SupportedReferralPlans);
    const offset = direction === CarouselDirection.Next ? 1 : -1;
    const nextIndex = (currentIndex + offset + orderedEligiblePlans.length) % orderedEligiblePlans.length;
    return orderedEligiblePlans[nextIndex];
};

const CarouselButton = ({ direction, onClick }: { direction: 'left' | 'right'; onClick: () => void }) => {
    const Icon = direction === 'left' ? IcChevronLeft : IcChevronRight;
    return (
        <Button
            shape="outline"
            size="medium"
            icon
            pill
            className={clsx(
                'PlanSelector-carouselButton absolute hidden lg:block rtl:mirror',
                `PlanSelector-carouselButton--${direction}`
            )}
            onClick={onClick}
        >
            <Icon size={8} className="color-primary" />
        </Button>
    );
};

const PlanSelector = ({ onPlanClick, onCTAClick }: Props) => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;
    const { eligibleTrials } = useEligibleTrials();

    const isSelected = (plan: SupportedReferralPlans) => {
        return selectedPlan.name === plan;
    };

    const isEligible = (plan: SupportedReferralPlans) => {
        return eligibleTrials.trialPlans.includes(plan);
    };

    const [cardAnimation, setCardAnimation] = useState<CarouselDirection | null>();

    const handlePlanClick = (plan: SupportedReferralPlans, direction: CarouselDirection = CarouselDirection.Fade) => {
        setCardAnimation(direction);
        // Update the selected plan in the payments context
        const selectedPlan = getReferralSelectedPlan(plan);
        void payments.selectPlan(selectedPlan);
        onPlanClick({ planIDs: selectedPlan.planIDs });
    };

    const handlePrev = () => {
        handlePlanClick(
            getAdjacentPlan(eligibleTrials.trialPlans, selectedPlan.name, CarouselDirection.Prev),
            CarouselDirection.Prev
        );
    };

    const handleNext = () => {
        handlePlanClick(
            getAdjacentPlan(eligibleTrials.trialPlans, selectedPlan.name, CarouselDirection.Next),
            CarouselDirection.Next
        );
    };

    const sharedPlanCardProps: PlanCardProps = {
        isSelected,
        isEligible,
        onCTAClick,
    };

    return (
        <div>
            <div id="plans" className="w-full max-w-custom mx-auto" style={{ '--max-w-custom': '28rem' }}>
                <div className="grid grid-cols-5 items-start w-full gap-2 mb-8">
                    <ReferralPlanIcon
                        icon={<img src={LogoBundleProducts} alt="" />}
                        plan={PLANS.BUNDLE}
                        selected={isSelected(PLANS.BUNDLE)}
                        handleClick={handlePlanClick}
                        title={
                            // translator: As short as possible title for the unlimited plan
                            c('Signup').t`Bundle`
                        }
                    />
                    <ReferralPlanIcon
                        icon={<MailLogo variant="glyph-only" />}
                        plan={PLANS.MAIL}
                        selected={isSelected(PLANS.MAIL)}
                        handleClick={handlePlanClick}
                        title={MAIL_SHORT_APP_NAME}
                    />
                    <ReferralPlanIcon
                        icon={<DriveLogo variant="glyph-only" />}
                        plan={PLANS.DRIVE}
                        selected={isSelected(PLANS.DRIVE)}
                        handleClick={handlePlanClick}
                        title={DRIVE_SHORT_APP_NAME}
                    />
                    <ReferralPlanIcon
                        icon={<PassLogo variant="glyph-only" />}
                        plan={PLANS.PASS}
                        selected={isSelected(PLANS.PASS)}
                        handleClick={handlePlanClick}
                        title={PASS_SHORT_APP_NAME}
                    />
                    <ReferralPlanIcon
                        icon={<VpnLogo variant="glyph-only" />}
                        plan={PLANS.VPN2024}
                        selected={isSelected(PLANS.VPN2024)}
                        handleClick={handlePlanClick}
                        title={VPN_SHORT_APP_NAME}
                    />
                </div>
            </div>
            <div
                key={cardAnimation ? selectedPlan.name : undefined}
                id="plans-cards"
                className={clsx(
                    'PlanSelector-carouselContainer',
                    cardAnimation &&
                        `PlanSelector-carouselContainer--animate PlanSelector-carouselContainer--animate-${cardAnimation}`,
                    'w-full relative max-w-custom lg:max-w-custom flex justify-center items-start flex-nowrap gap-8'
                )}
                style={{ '--max-w-custom': '28rem', '--lg-max-w-custom': '54rem' }}
                onAnimationEnd={() => setCardAnimation(null)}
            >
                <CarouselButton direction="left" onClick={handlePrev} />
                <div className="PlanSelector-carouselItem PlanSelector-carouselItem--left hidden lg:block grow-0 shrink-0 rounded-xl mt-4" />
                <div
                    className="PlanSelector-planCard z-1 relative w-custom max-w-custom mx-auto flex flex-column md:flex-row flex-nowrap border border-weak bg-norm p-4 lg:p-8"
                    style={{ '--max-w-custom': 'calc(100vw - var(--space-4) - var(--space-4))', '--w-custom': '26rem' }}
                >
                    <BundlePlanCard {...sharedPlanCardProps} />
                    <MailPlanCard {...sharedPlanCardProps} />
                    <DrivePlanCard {...sharedPlanCardProps} />
                    <PassPlanCard {...sharedPlanCardProps} />
                    <VPNPlanCard {...sharedPlanCardProps} />
                </div>
                <div className="PlanSelector-carouselItem PlanSelector-carouselItem--right hidden lg:block grow-0 shrink-0 rounded-xl mt-4" />
                <CarouselButton direction="right" onClick={handleNext} />
            </div>
        </div>
    );
};

export default PlanSelector;

interface PlanCardProps {
    isSelected: (plan: SupportedReferralPlans) => boolean;
    isEligible: (plan: SupportedReferralPlans) => boolean;
    onCTAClick: () => void;
}

function BundlePlanCard({ isSelected, isEligible, onCTAClick }: PlanCardProps) {
    const plan = PLANS.BUNDLE;

    if (!isSelected(plan) || !isEligible(plan)) {
        return null;
    }

    return (
        <PlanCard
            planName={PLAN_NAMES[plan]}
            header={<PlanLogo logoSrc={getPlanIconPath(plan)} planName={getNormalizedPlanTitleToPlus(plan)} />}
            headerTrailing={<NoCreditCardBadge plan={plan} />}
            footer={<Pricing plan={plan} />}
            description={c('Plan description').t`Comprehensive privacy and security suite.`}
            features={<BundleFeatures />}
            onCTAClick={onCTAClick}
        />
    );
}

function MailPlanCard({ isSelected, isEligible, onCTAClick }: PlanCardProps) {
    const plan = PLANS.MAIL;

    if (!isSelected(plan) || !isEligible(plan)) {
        return null;
    }

    return (
        <PlanCard
            planName={PLAN_NAMES[plan]}
            header={<PlanLogo logoSrc={getPlanIconPath(plan)} planName={getNormalizedPlanTitleToPlus(plan)} />}
            headerTrailing={<NoCreditCardBadge plan={plan} />}
            footer={<Pricing plan={plan} />}
            description={c('Plan description')
                .t`Defeat spam, tracking, and ads with encrypted email and a secure calendar.`}
            features={<MailFeatures />}
            onCTAClick={onCTAClick}
        />
    );
}

function DrivePlanCard({ isSelected, isEligible, onCTAClick }: PlanCardProps) {
    const plan = PLANS.DRIVE;

    if (!isSelected(plan) || !isEligible(plan)) {
        return null;
    }

    return (
        <PlanCard
            planName={PLAN_NAMES[plan]}
            header={<PlanLogo logoSrc={getPlanIconPath(plan)} planName={getNormalizedPlanTitleToPlus(plan)} />}
            headerTrailing={<NoCreditCardBadge plan={plan} />}
            footer={<Pricing plan={plan} />}
            description={c('Plan description').t`Cloud storage and file sharing, secured by end-to-end encryption.`}
            features={<DriveFeatures />}
            onCTAClick={onCTAClick}
        />
    );
}

function PassPlanCard({ isSelected, isEligible, onCTAClick }: PlanCardProps) {
    const plan = PLANS.PASS;

    if (!isSelected(plan) || !isEligible(plan)) {
        return null;
    }

    return (
        <PlanCard
            planName={PLAN_NAMES[plan]}
            header={<PlanLogo logoSrc={getPlanIconPath(plan)} planName={getNormalizedPlanTitleToPlus(plan)} />}
            headerTrailing={<NoCreditCardBadge plan={plan} />}
            footer={<Pricing plan={plan} />}
            description={c('Plan description').t`For next-level password management and identity protection.`}
            features={<PassFeatures />}
            onCTAClick={onCTAClick}
        />
    );
}

function VPNPlanCard({ isSelected, isEligible, onCTAClick }: PlanCardProps) {
    const plan = PLANS.VPN2024;

    if (!isSelected(plan) || !isEligible(plan)) {
        return null;
    }

    return (
        <PlanCard
            planName={PLAN_NAMES[plan]}
            header={<PlanLogo logoSrc={getPlanIconPath(plan)} planName={getNormalizedPlanTitleToPlus(plan)} />}
            headerTrailing={<NoCreditCardBadge plan={plan} />}
            footer={<Pricing plan={plan} />}
            description={c('Plan description')
                .t`A VPN solution that provides secure, high-speed access to the internet.`}
            features={<VPNFeatures />}
            onCTAClick={onCTAClick}
        />
    );
}

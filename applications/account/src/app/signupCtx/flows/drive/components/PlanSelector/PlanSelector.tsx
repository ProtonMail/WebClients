/* eslint-disable @typescript-eslint/no-use-before-define */
import type { ReactNode } from 'react';
import { useHistory } from 'react-router-dom';

import { c } from 'ttag';

import { CurrencySelector, SkeletonLoader } from '@proton/components';
import useLoading from '@proton/hooks/useLoading';
import { IcBrandProtonMail, IcBrandProtonPass, IcBrandProtonVpn, IcShield, IcUsers } from '@proton/icons';
import { CYCLE, type Currency, type Cycle, PLANS, PLAN_NAMES, type PlanIDs, type PlansMap } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import { BRAND_NAME, DRIVE_APP_NAME, SSO_PATHS } from '@proton/shared/lib/constants';
import { getPlanOrAppNameText } from '@proton/shared/lib/i18n/ttag';

import { getDriveMaxSpaceMap } from '../../helpers/getMaxSpaceMap';
import { getSavePercentageString, getSecureStoragePerUserString, getSecureStorageString } from '../../helpers/i18n';
import { getSignupHref, getSignupHrefFromPlanIDs } from '../../helpers/path';
import FeatureItem from '../FeatureItem/FeatureItem';
import { DriveCycleSelector } from './DriveCycleSelector';
import PlanCard, { PlanCardBorderVariant } from './PlanCard';
import Pricing from './Pricing';

import './PlanCard.scss';

function getMax12MonthSavingsPercentage(plansMap: PlansMap, toCompare: PLANS[]) {
    let maxSavings = 0;

    Object.values(toCompare).forEach((planKey) => {
        const pricing = plansMap[planKey]?.Pricing;
        const monthly = pricing?.['1'];
        const yearly = pricing?.['12'];

        if (monthly && yearly) {
            const baseCost = monthly * 12;
            const savings = ((baseCost - yearly) / baseCost) * 100;
            if (savings > maxSavings) {
                maxSavings = savings;
            }
        }
    });

    return Math.floor(maxSavings);
}

type PlanSelectorProps = {
    onPlanCTAClick: (selectedPlan: { planIDs: PlanIDs; cycle: Cycle; currency: Currency }) => void;
    title: ReactNode;
    highlightedPlan?: PLANS;
};

const PlanSelector = ({ onPlanCTAClick, title, highlightedPlan }: PlanSelectorProps) => {
    const payments = usePaymentOptimistic();
    const history = useHistory();
    const { selectedPlan, options } = payments;

    const [changingCurrency, withChangingCurrency] = useLoading();

    const largestSaving = getMax12MonthSavingsPercentage(payments.plansMap, [
        PLANS.DRIVE,
        PLANS.BUNDLE,
        PLANS.DUO,
        PLANS.FAMILY,
        PLANS.DRIVE_BUSINESS,
    ]);

    const cycleOptions = [
        { text: c('Signup').t`Monthly`, value: CYCLE.MONTHLY },
        {
            text: c('Signup').t`Yearly`,
            element:
                largestSaving !== 0 ? (
                    <>
                        <span className="mr-1">{c('Signup').t`Yearly`}</span>
                        {payments.initializationStatus.pricingInitialized ? (
                            <span className="bg-primary color-invert px-1 rounded-full text-semibold text-uppercase">
                                {getSavePercentageString(largestSaving)}
                            </span>
                        ) : (
                            <SkeletonLoader width="4.65rem" height="1.1rem" />
                        )}
                    </>
                ) : undefined,
            value: CYCLE.YEARLY,
        },
    ];

    const isSelected = (plan: PLANS) => {
        if (highlightedPlan) {
            return false;
        }

        return selectedPlan.name === plan;
    };

    const isHighlighted = (plan: PLANS) => {
        if (highlightedPlan) {
            return highlightedPlan === plan;
        }

        return isSelected(plan);
    };

    const handlePlanCTAClick = (plan: PLANS) => {
        const availableCurrencies = payments.getAvailableCurrencies(plan);
        const preferredCurrency = payments.getPreferredCurrency(plan);

        const planIsAvailableForSelectedCurrency = availableCurrencies.includes(payments.currency);

        if (!planIsAvailableForSelectedCurrency) {
            /**
             * Hard refresh in the case that the selected currency is not available for this plan.
             * This can happen because regional currencies are not supported for business plans.
             */
            window.location.href = getSignupHref({
                plan,
                cycle: payments.options.cycle,
                currency: preferredCurrency,
                targetPath: SSO_PATHS.DRIVE_SIGNUP,
            });
            return;
        }

        onPlanCTAClick({ planIDs: { [plan]: 1 }, cycle: options.cycle, currency: options.currency });
    };

    const sharedPlanCardProps: PlanCardProps = {
        isSelected,
        isHighlighted,
        handlePlanCTAClick,
        selectedTitle: highlightedPlan ? c('Signup').t`Most popular` : c('Signup').t`Your plan`,
    };

    return (
        <div id="plans" className="max-w-custom p-4 mx-auto" style={{ '--max-w-custom': '75rem' }}>
            <div className="flex justify-space-between mb-6">
                <h2 className="font-arizona text-4xl">{title}</h2>

                <DriveCycleSelector
                    cycle={options.cycle}
                    options={cycleOptions}
                    onSelect={(cycle) => {
                        if (cycle === 'lifetime') {
                            return;
                        }
                        void payments.selectCycle(cycle);

                        history.push(
                            getSignupHrefFromPlanIDs({
                                planIDs: selectedPlan.planIDs,
                                cycle,
                                currency: options.currency,
                                plansMap: payments.plansMap,
                            })
                        );
                    }}
                />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 w-fit-content mx-auto mb-8">
                <FreePlanCard {...sharedPlanCardProps} />
                <DrivePlanCard {...sharedPlanCardProps} />
                <BundlePlanCard {...sharedPlanCardProps} />

                <DuoPlanCard {...sharedPlanCardProps} />
            </div>

            <div className="flex justify-center justify-space-between">
                <div className="w-custom" aria-hidden="true" style={{ '--w-custom': '4.5rem' }}></div>

                <div className="text-center mb-8">
                    <span className="color-success">
                        <IcShield className="align-text-bottom mr-1" />
                        <span>{c('Info').t`30-day money-back guarantee`}</span>
                    </span>
                </div>

                <div>
                    {payments.initializationStatus.pricingInitialized ? (
                        <CurrencySelector
                            currencies={payments.availableCurrencies}
                            mode="select-two"
                            className="px-3 color-primary relative interactive-pseudo interactive--no-background"
                            currency={payments.options.currency}
                            loading={changingCurrency}
                            onSelect={(currency) => {
                                void withChangingCurrency(payments.selectCurrency(currency));
                                history.push(
                                    getSignupHrefFromPlanIDs({
                                        planIDs: selectedPlan.planIDs,
                                        cycle: options.cycle,
                                        currency,
                                        plansMap: payments.plansMap,
                                    })
                                );
                            }}
                            unstyled
                        />
                    ) : (
                        <SkeletonLoader width="4rem" height="1.25rem" />
                    )}
                </div>
            </div>

            <h3 className="font-arizona text-4xl text-center mb-4">{c('Signup').t`Need more space?`}</h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-fit-content mx-auto mb-8">
                <FamilyPlanCard {...sharedPlanCardProps} />

                <BusinessPlanCard {...sharedPlanCardProps} />
            </div>
        </div>
    );
};

export default PlanSelector;

interface PlanCardProps {
    isSelected: (plan: PLANS) => boolean;
    isHighlighted: (plan: PLANS) => boolean;
    handlePlanCTAClick: (plan: PLANS) => void;
    selectedTitle: string;
}

function FreePlanCard({ isSelected, isHighlighted, handlePlanCTAClick, selectedTitle }: PlanCardProps) {
    const plan = PLANS.FREE;

    const payments = usePaymentOptimistic();
    const maxSpace = getDriveMaxSpaceMap(payments)[plan];

    const selected = isSelected(plan);
    const highlighted = isHighlighted(plan);

    return (
        <PlanCard
            title={`${BRAND_NAME} ${PLAN_NAMES[plan]}`}
            description={c('Plan description').t`Perfect for getting started with secure cloud storage.`}
            ctaCopy={c('Signup').t`Continue with ${PLAN_NAMES[plan]}`}
            features={
                <>
                    <FeatureItem
                        loading={!maxSpace}
                        highlighted={highlighted}
                        text={getSecureStorageString(maxSpace)}
                        tooltip={c('Signup')
                            .t`Need more storage? You can upgrade anytime with plans from 200GB to 3TB. 5Gb is enough for 2,500 photos from a modern phone (at ~2MB each).`}
                    />
                    <FeatureItem text={c('Signup').t`End-to-end encryption`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Connect all your devices`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Online documents`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Secure file sharing`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Upload files of any size`} highlighted={highlighted} />
                </>
            }
            highlightVariant={PlanCardBorderVariant.Plain}
            selected={selected}
            highlighted={highlighted}
            highlightTitle={selectedTitle}
            onCTAClick={() => handlePlanCTAClick(plan)}
            pricing={<Pricing plan={plan} />}
        />
    );
}

function DrivePlanCard({ isSelected, isHighlighted, handlePlanCTAClick, selectedTitle }: PlanCardProps) {
    const plan = PLANS.DRIVE;

    const payments = usePaymentOptimistic();
    const maxSpace = getDriveMaxSpaceMap(payments)[plan];

    const selected = isSelected(plan);
    const highlighted = isHighlighted(plan);

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            description={c('Plan description').t`Great for everyday use and photo backups.`}
            ctaCopy={getPlanOrAppNameText(PLAN_NAMES[plan])}
            features={
                <>
                    <FeatureItem
                        loading={!maxSpace}
                        text={getSecureStorageString(maxSpace)}
                        highlighted={highlighted}
                        tooltip={c('Signup')
                            .t`Need more storage? You can upgrade anytime with plans from 200GB to 3TB. 5Gb is enough for 2,500 photos from a modern phone (at ~2MB each).`}
                    />
                    <FeatureItem text={c('Signup').t`End-to-end encryption`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Connect all your devices`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Online documents`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Secure file sharing`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Upload files of any size`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Recover previous file versions`} highlighted={highlighted} />
                </>
            }
            selected={selected}
            highlighted={highlighted}
            highlightTitle={selectedTitle}
            onCTAClick={() => handlePlanCTAClick(plan)}
            pricing={<Pricing plan={plan} />}
        />
    );
}

function BundlePlanCard({ isSelected, isHighlighted, handlePlanCTAClick, selectedTitle }: PlanCardProps) {
    const plan = PLANS.BUNDLE;

    const payments = usePaymentOptimistic();
    const maxSpace = getDriveMaxSpaceMap(payments)[plan];

    const selected = isSelected(plan);
    const highlighted = isHighlighted(plan);

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            description={c('Plan description').t`The ideal plan for privacy-conscious power users.`}
            ctaCopy={getPlanOrAppNameText(PLAN_NAMES[plan])}
            features={
                <>
                    <FeatureItem
                        loading={!maxSpace}
                        text={getSecureStorageString(maxSpace)}
                        highlighted={highlighted}
                        tooltip={c('Signup')
                            .t`Need more storage? You can upgrade anytime with plans from 200GB to 3TB. 5Gb is enough for 2,500 photos from a modern phone (at ~2MB each).`}
                    />
                    <FeatureItem text={c('Signup').t`End-to-end encryption`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Connect all your devices`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Online documents`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Secure file sharing`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Upload files of any size`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Recover previous file versions`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Advanced account protection`} highlighted={highlighted} />
                    <FeatureItem
                        text={c('Signup').t`30 custom email addresses`}
                        icon={<IcBrandProtonMail size={6} />}
                        highlighted={highlighted}
                    />
                    <FeatureItem
                        text={c('Signup').t`Ultra fast and private VPN`}
                        icon={<IcBrandProtonVpn size={6} />}
                        highlighted={highlighted}
                    />
                    <FeatureItem
                        text={c('Signup').t`Encrypted password manager`}
                        icon={<IcBrandProtonPass size={6} />}
                        highlighted={highlighted}
                    />
                </>
            }
            selected={selected}
            highlighted={highlighted}
            highlightTitle={selectedTitle}
            onCTAClick={() => handlePlanCTAClick(plan)}
            pricing={<Pricing plan={plan} />}
        />
    );
}

function DuoPlanCard({ isSelected, isHighlighted, handlePlanCTAClick, selectedTitle }: PlanCardProps) {
    const plan = PLANS.DUO;

    const payments = usePaymentOptimistic();
    const maxSpace = getDriveMaxSpaceMap(payments)[plan];

    const selected = isSelected(plan);
    const highlighted = isHighlighted(plan);

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            description={c('Plan description').t`Best if you need ${maxSpace} of storage and for couples.`}
            ctaCopy={getPlanOrAppNameText(PLAN_NAMES[plan])}
            features={
                <>
                    <FeatureItem
                        loading={!maxSpace}
                        text={getSecureStorageString(maxSpace)}
                        highlighted={highlighted}
                        tooltip={c('Signup')
                            .t`Need more storage? You can upgrade anytime with plans from 200GB to 3TB. 5Gb is enough for 2,500 photos from a modern phone (at ~2MB each).`}
                    />
                    <FeatureItem text={c('Signup').t`End-to-end encryption`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Connect all your devices`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Online documents`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Secure file sharing`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Upload files of any size`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Recover previous file versions`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Advanced account protection`} highlighted={highlighted} />
                    <FeatureItem
                        text={c('Signup').t`30 custom email addresses`}
                        icon={<IcBrandProtonMail size={6} />}
                        highlighted={highlighted}
                    />
                    <FeatureItem
                        text={c('Signup').t`Ultra fast and private VPN`}
                        icon={<IcBrandProtonVpn size={6} />}
                        highlighted={highlighted}
                    />
                    <FeatureItem
                        text={c('Signup').t`Encrypted password manager`}
                        icon={<IcBrandProtonPass size={6} />}
                        highlighted={highlighted}
                    />
                    <FeatureItem
                        text={c('Signup').t`Up to 2 users`}
                        icon={<IcUsers size={6} />}
                        highlighted={highlighted}
                    />
                </>
            }
            selected={selected}
            highlighted={highlighted}
            highlightTitle={selectedTitle}
            onCTAClick={() => handlePlanCTAClick(plan)}
            pricing={<Pricing plan={plan} />}
        />
    );
}

function FamilyPlanCard({ isSelected, isHighlighted, handlePlanCTAClick, selectedTitle }: PlanCardProps) {
    const plan = PLANS.FAMILY;

    const payments = usePaymentOptimistic();
    const maxSpace = getDriveMaxSpaceMap(payments)[plan];

    const selected = isSelected(plan);
    const highlighted = isHighlighted(plan);
    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            description={c('Plan description').t`All ${BRAND_NAME} premium products included in Duo.`}
            ctaCopy={getPlanOrAppNameText(PLAN_NAMES[plan])}
            features={
                <>
                    <FeatureItem
                        loading={!maxSpace}
                        text={getSecureStorageString(maxSpace)}
                        highlighted={highlighted}
                        tooltip={c('Signup')
                            .t`Need more storage? You can upgrade anytime with plans from 200GB to 3TB. 5Gb is enough for 2,500 photos from a modern phone (at ~2MB each).`}
                    />
                    <FeatureItem text={c('Signup').t`Up to 6 users`} highlighted={highlighted} />
                </>
            }
            selected={selected}
            highlighted={highlighted}
            highlightTitle={selectedTitle}
            onCTAClick={() => handlePlanCTAClick(plan)}
            pricing={<Pricing plan={plan} />}
        />
    );
}
function BusinessPlanCard({ isSelected, isHighlighted, handlePlanCTAClick, selectedTitle }: PlanCardProps) {
    const plan = PLANS.DRIVE_BUSINESS;

    const payments = usePaymentOptimistic();
    const maxSpace = getDriveMaxSpaceMap(payments)[plan];

    const selected = isSelected(plan);
    const highlighted = isHighlighted(plan);

    const availableCurrencies = payments.getAvailableCurrencies(plan);
    const planIsAvailableForSelectedCurrency = availableCurrencies.includes(payments.options.currency);

    return (
        <PlanCard
            title={c('Signup').t`${DRIVE_APP_NAME} for Business`}
            description={c('Plan description').t`Secure cloud storage and collaboration for teams.`}
            ctaCopy={getPlanOrAppNameText(PLAN_NAMES[plan])}
            features={
                <>
                    {
                        /**
                         * We cannot display the space for the plan since plans map does not include the plan
                         */
                        planIsAvailableForSelectedCurrency && (
                            <FeatureItem
                                loading={!maxSpace}
                                text={getSecureStoragePerUserString(maxSpace)}
                                highlighted={highlighted}
                            />
                        )
                    }
                    <FeatureItem text={c('Signup').t`Share and collaborate of files`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Manage user access`} highlighted={highlighted} />
                    <FeatureItem text={c('Signup').t`Sync files across devices and users`} highlighted={highlighted} />
                </>
            }
            selected={selected}
            highlighted={highlighted}
            highlightTitle={selectedTitle}
            onCTAClick={() => {
                handlePlanCTAClick(plan);
            }}
            pricing={planIsAvailableForSelectedCurrency ? <Pricing plan={plan} displayPerUserSpace /> : null}
        />
    );
}

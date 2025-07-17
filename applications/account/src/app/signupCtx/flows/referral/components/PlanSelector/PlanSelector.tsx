/* eslint-disable @typescript-eslint/no-use-before-define */
import { c } from 'ttag';

import { AppsLogos } from '@proton/components';
import { PLANS, PLAN_NAMES, type PlanIDs } from '@proton/payments';
import { usePaymentOptimistic } from '@proton/payments/ui';
import {
    APPS,
    BRAND_NAME,
    MAIL_SHORT_APP_NAME,
    PASS_SHORT_APP_NAME,
    VPN_SHORT_APP_NAME,
} from '@proton/shared/lib/constants';

import { getPlanIconPath } from '../../helpers/planIcons';
import { getReferralPlanIDsFromPlan } from '../../helpers/plans';
import { BundleFeatures } from '../Features/BundleFeatures';
import { DriveFeatures } from '../Features/DriveFeatures';
import { MailFeatures } from '../Features/MailFeatures';
import { PassFeatures } from '../Features/PassFeatures';
import { VPNFeatures } from '../Features/VPNFeatures';
import PlanCard from './PlanCard';
import Pricing from './Pricing';
import { ReferralPlanIcon } from './ReferralPlanIcon';

import './PlanCard.scss';

interface Props {
    onPlanClick: (selectedPlan: { planIDs: PlanIDs }) => void;
    onCTAClick: () => void;
}

const PlanSelector = ({ onPlanClick, onCTAClick }: Props) => {
    const payments = usePaymentOptimistic();
    const { selectedPlan } = payments;

    const isSelected = (plan: PLANS) => {
        return selectedPlan.name === plan;
    };

    const handlePlanClick = (plan: PLANS) => {
        // Update the selected plan in the payments context
        const planIDs = getReferralPlanIDsFromPlan(plan);
        void payments.selectPlanIDs(planIDs);
        onPlanClick({ planIDs });
    };

    const sharedPlanCardProps: PlanCardProps = {
        isSelected,
        onCTAClick,
    };

    return (
        <div id="plans" className="w-full">
            <div className="grid grid-cols-5 items-start w-full gap-2 mb-8">
                <ReferralPlanIcon
                    icon={getPlanIconPath(PLANS.BUNDLE)}
                    plan={PLANS.BUNDLE}
                    selected={isSelected(PLANS.BUNDLE)}
                    handleClick={handlePlanClick}
                    title={c('Signup').t`Bundle`}
                />
                <ReferralPlanIcon
                    icon={getPlanIconPath(PLANS.MAIL)}
                    plan={PLANS.MAIL}
                    selected={isSelected(PLANS.MAIL)}
                    handleClick={handlePlanClick}
                    title={MAIL_SHORT_APP_NAME}
                />
                <ReferralPlanIcon
                    icon={getPlanIconPath(PLANS.DRIVE)}
                    plan={PLANS.DRIVE}
                    selected={isSelected(PLANS.DRIVE)}
                    handleClick={handlePlanClick}
                    title={c('Signup').t`Storage`}
                />
                <ReferralPlanIcon
                    icon={getPlanIconPath(PLANS.PASS)}
                    plan={PLANS.PASS}
                    selected={isSelected(PLANS.PASS)}
                    handleClick={handlePlanClick}
                    title={c('Signup').t`Password manager`}
                    extraShortTitle={PASS_SHORT_APP_NAME}
                />
                <ReferralPlanIcon
                    icon={getPlanIconPath(PLANS.VPN2024)}
                    plan={PLANS.VPN2024}
                    selected={isSelected(PLANS.VPN2024)}
                    handleClick={handlePlanClick}
                    title={VPN_SHORT_APP_NAME}
                />
            </div>

            <div
                className="fade-in w-full max-w-custom flex flex-column md:flex-row flex-nowrap rounded-xl shadow-raised bg-norm mx-auto p-4 lg:p-8"
                style={{ maxWidth: '27rem' }}
            >
                <BundlePlanCard {...sharedPlanCardProps} />
                <MailPlanCard {...sharedPlanCardProps} />
                <DrivePlanCard {...sharedPlanCardProps} />
                <PassPlanCard {...sharedPlanCardProps} />
                <VPNPlanCard {...sharedPlanCardProps} />
            </div>
        </div>
    );
};

export default PlanSelector;

interface PlanCardProps {
    isSelected: (plan: PLANS) => boolean;
    onCTAClick: () => void;
}

function BundlePlanCard({ isSelected, onCTAClick }: PlanCardProps) {
    const plan = PLANS.BUNDLE;

    const selected = isSelected(plan);

    if (!selected) {
        return null;
    }

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            headerTrailing={<Pricing plan={plan} />}
            description={c('Plan description')
                .t`Comprehensive privacy and security with all ${BRAND_NAME} services combined.`}
            features={<BundleFeatures />}
            footer={
                <AppsLogos
                    logoSize={8}
                    apps={[
                        APPS.PROTONMAIL,
                        APPS.PROTONCALENDAR,
                        APPS.PROTONDRIVE,
                        APPS.PROTONDOCS,
                        APPS.PROTONPASS,
                        APPS.PROTONVPN_SETTINGS,
                    ]}
                />
            }
            onCTAClick={onCTAClick}
        />
    );
}

function MailPlanCard({ isSelected, onCTAClick }: PlanCardProps) {
    const plan = PLANS.MAIL;

    const selected = isSelected(plan);

    if (!selected) {
        return null;
    }

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            headerTrailing={<Pricing plan={plan} />}
            description={c('Plan description').t`Secure email with advanced features for your everyday communications.`}
            features={<MailFeatures />}
            footer={<AppsLogos logoSize={8} apps={[APPS.PROTONMAIL, APPS.PROTONCALENDAR]} />}
            onCTAClick={onCTAClick}
        />
    );
}

function DrivePlanCard({ isSelected, onCTAClick }: PlanCardProps) {
    const plan = PLANS.DRIVE;

    const selected = isSelected(plan);

    if (!selected) {
        return null;
    }

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            headerTrailing={<Pricing plan={plan} />}
            description={c('Plan description').t`Cloud storage and file sharing, secured by end-to-end encryption.`}
            features={<DriveFeatures />}
            footer={<AppsLogos logoSize={8} apps={[APPS.PROTONDRIVE, APPS.PROTONDOCS]} />}
            onCTAClick={onCTAClick}
        />
    );
}

function PassPlanCard({ isSelected, onCTAClick }: PlanCardProps) {
    const plan = PLANS.PASS;

    const selected = isSelected(plan);

    if (!selected) {
        return null;
    }

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            headerTrailing={<Pricing plan={plan} />}
            description={c('Plan description').t`For next-level password management and identity protection.`}
            features={<PassFeatures />}
            footer={<AppsLogos logoSize={8} apps={[APPS.PROTONPASS]} />}
            onCTAClick={onCTAClick}
        />
    );
}

function VPNPlanCard({ isSelected, onCTAClick }: PlanCardProps) {
    const plan = PLANS.VPN2024;

    const selected = isSelected(plan);

    if (!selected) {
        return null;
    }

    return (
        <PlanCard
            title={PLAN_NAMES[plan]}
            headerTrailing={<Pricing plan={plan} />}
            description={c('Plan description')
                .t`A VPN solution that provides secure, unrestricted, high-speed access to the internet.`}
            features={<VPNFeatures />}
            footer={<AppsLogos logoSize={8} apps={[APPS.PROTONVPN_SETTINGS]} />}
            onCTAClick={onCTAClick}
        />
    );
}

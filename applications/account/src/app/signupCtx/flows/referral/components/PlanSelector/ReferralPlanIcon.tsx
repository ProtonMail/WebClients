import type { ReactNode } from 'react';

import { c } from 'ttag';

import { useEligibleTrials } from '@proton/account/eligibleTrials/hooks';
import clsx from '@proton/utils/clsx';

import type { SupportedReferralPlans } from '../../helpers/plans';

import './ReferralPlanIcon.scss';

interface Props {
    icon: ReactNode;
    plan: SupportedReferralPlans;
    selected: boolean;
    handleClick: (plan: SupportedReferralPlans) => void;
    title: string;
}

export const ReferralPlanIcon = ({ icon, plan, selected, handleClick, title }: Props) => {
    const { eligibleTrials } = useEligibleTrials();

    if (!eligibleTrials.trialPlans.includes(plan)) {
        return null;
    }

    return (
        <button
            className={clsx(
                'ReferralPlanIcon fade-in sm:p-2 flex flex-column justify-center items-center gap-3 outline-none--at-all',
                selected && 'ReferralPlanIcon--selected'
            )}
            onClick={() => handleClick(plan)}
            title={title}
            aria-label={c('Signup').t`Select ${title}`}
        >
            <div
                className={clsx(
                    'ReferralPlanIcon-icon overflow-hidden w-custom flex items-center justify-center ratio-square shadow-color-primary',
                    selected ? 'shadow-lifted' : 'shadow-raised'
                )}
                style={{ '--w-custom': '3rem' }}
            >
                {icon}
            </div>
            <div
                className={clsx(
                    'ReferralPlanIcon-name text-sm text-semibold lg:text-rg inline-flex flex-row justify-center rounded-xl px-1 sm:px-2 py-1 max-w-full text-no-cut',
                    selected ? 'color-primary bg-norm shadow-lifted shadow-color-primary' : 'color-weak'
                )}
            >
                <span>{title}</span>
            </div>
        </button>
    );
};

export default ReferralPlanIcon;

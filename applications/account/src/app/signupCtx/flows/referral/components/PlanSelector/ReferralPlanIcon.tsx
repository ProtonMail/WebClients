import { c } from 'ttag';

import type { PLANS } from '@proton/payments';
import clsx from '@proton/utils/clsx';

import './ReferralPlanIcon.scss';

interface Props {
    icon: string;
    plan: PLANS;
    selected: boolean;
    handleClick: (plan: PLANS) => void;
    title: string;
    extraShortTitle?: string;
}

export const ReferralPlanIcon = ({ icon, plan, selected, handleClick, title, extraShortTitle }: Props) => {
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
                    'ReferralPlanIcon-icon overflow-hidden w-custom sm:w-custom lg:w-custom ratio-square shadow-color-primary',
                    selected ? 'shadow-lifted' : 'shadow-raised'
                )}
                style={{ '--w-custom': '3rem', '--sm-w-custom': '4rem', '--lg-w-custom': '5rem' }}
            >
                <img src={icon} alt="" className="animate-fade-in" />
            </div>
            <div
                className={clsx(
                    'ReferralPlanIcon-name text-sm text-semibold lg:text-rg inline-flex flex-row justify-center rounded-full px-1 sm:px-2 py-1',
                    selected ? 'color-primary bg-norm shadow-lifted shadow-color-primary' : 'color-weak'
                )}
            >
                <span className="block sm:hidden" aria-hidden>
                    {extraShortTitle ? extraShortTitle : title}
                </span>
                <span className="hidden sm:block">{title}</span>
            </div>
        </button>
    );
};

export default ReferralPlanIcon;

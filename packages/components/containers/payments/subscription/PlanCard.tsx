import { ReactNode } from 'react';
import { c } from 'ttag';
import { Audience, Currency, Cycle } from '@proton/shared/lib/interfaces';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';

import { classnames } from '../../../helpers';
import { Badge, Icon, Price, PrimaryButton } from '../../../components';

import SelectPlan from './SelectPlan';

export interface PlanCardFeature {
    icon?: ReactNode;
    content: ReactNode;
    className?: string;
    info?: ReactNode;
    notIncluded?: boolean;
}

interface Props {
    target: Audience;
    planName: PLANS;
    selectedPlan: PLANS;
    planTitle: string;
    price: number;
    info: string;
    action: string;
    onSelect: (planName: PLANS) => void;
    onSelectPlan: (planName: PLANS) => void;
    features: React.ReactNode;
    currency: Currency;
    cycle: Cycle;
    isCurrentPlan?: boolean;
    disabled?: boolean;
    recommended?: boolean;
    canSelect?: boolean;
}

const getCycleUnit = (planName: PLANS) => {
    switch (planName) {
        case PLANS.FREE:
            return c('Free forever').t`forever`;
        case PLANS.MAIL_PRO:
        case PLANS.DRIVE_PRO:
        case PLANS.BUNDLE_PRO:
        case PLANS.ENTERPRISE:
            return c('Cycle').t`per user per month`;
        default:
            return c('Cycle').t`per month`;
    }
};

const PlanCard = ({
    target,
    canSelect,
    planName,
    planTitle,
    price,
    info,
    action,
    selectedPlan,
    onSelect,
    onSelectPlan,
    features,
    currency,
    cycle,
    disabled,
    isCurrentPlan,
    recommended,
}: Props) => {
    const badgeMultiUser = planName === PLANS.FAMILY ? <Badge type="success">{c('Badge').t`5 users`}</Badge> : null;

    const vpnRegularPrice = <Price currency={currency}>{699}</Price>; // hardcoded until we have a way to get it.
    const vpnRegularPriceInfo =
        planName === PLANS.VPN
            ? // translator: full sentence is: Billed annually. <Regular price €xxx.> Other billing cycles available at checkout.
              c('Info').jt`Regular price ${vpnRegularPrice}.`
            : ``;

    const footerNotesFree = c('Info').t`* No credit card required.`;
    // translator: full sentence is (the part in the variable might be empty in some cases): Billed annually. <Regular price €xxx.> Other billing cycles available at checkout.
    const footerNotesYear = c('Info')
        .jt`* Billed annually. ${vpnRegularPriceInfo} Other billing cycles available at checkout.`;
    // translator: full sentence is (the part in the variable might be empty in some cases): Billed every 2 years. <Regular price €xxx.> Other billing cycles available at checkout.
    const footerNotesTwoYears = c('Info')
        .jt`Billed every 2 years. ${vpnRegularPriceInfo} Other billing cycles available at checkout.`;

    return (
        <>
            <div
                className={classnames([
                    'border relative h100 plan-selection-plan p2 pb0 flex flex-column flex-nowrap',
                    isCurrentPlan && 'plan-selection-plan-current-card',
                    recommended && 'plan-selection-plan-recommended',
                ])}
            >
                {recommended ? (
                    <div className="plan-selection-plan-recommended-pill-container text-aligncenter flex">
                        <div className="plan-selection-plan-recommended-pill inline-flex mlauto mrauto flex-items-align-center bg-primary p0-25 pl0-75 pr0-75">
                            <Icon name="star-filled" className="mtauto mbauto" />
                            <span className="ml0-25">{c('Title').t`Recommended`}</span>
                        </div>
                    </div>
                ) : null}
                <div className="flex flex-row flex-align-items-center">
                    {canSelect ? (
                        <h3 className="plan-selection-title flex text-bold text-capitalize mb0-5">
                            <SelectPlan planName={selectedPlan} target={target} onChange={onSelectPlan} />
                        </h3>
                    ) : (
                        <h3
                            className="plan-selection-title flex text-bold text-capitalize mb0-5"
                            id={`desc_${planTitle}`}
                        >
                            {planTitle}
                        </h3>
                    )}
                    <span className="ml0-5 mb0-5">{badgeMultiUser}</span>
                </div>
                <p className="text-lg plan-selection-info color-weak mb1">{info}</p>
                <div className="plan-selection-main-price mb1">
                    {planName === PLANS.FREE ? (
                        // translator: this one should be translated
                        <span className="amount">{c('Price for free plan').t`Free`}</span>
                    ) : (
                        <Price currency={currency}>{price / cycle}</Price>
                    )}
                    <div className="color-weak">{getCycleUnit(planName)} *</div>
                </div>

                <PrimaryButton
                    onClick={() => onSelect(planName)}
                    disabled={disabled}
                    className="w100"
                    aria-describedby={`desc_${planTitle}`}
                >
                    {action}
                </PrimaryButton>
                <div className="flex flex-column flex-nowrap flex-item-fluid-auto">
                    {features}
                    <div className="pt1 mtauto pb1">
                        {planName === PLANS.FREE ? (
                            <p className="text-sm mt0 plan-selection-additionnal-mentions color-weak">
                                {footerNotesFree}
                            </p>
                        ) : null}
                        {cycle === CYCLE.YEARLY && planName !== PLANS.FREE ? (
                            <p className="text-sm mt0 plan-selection-additionnal-mentions color-weak">
                                {footerNotesYear}
                            </p>
                        ) : null}
                        {cycle === CYCLE.TWO_YEARS && planName !== PLANS.FREE ? (
                            <p className="text-sm mt0 plan-selection-additionnal-mentions color-weak">
                                {footerNotesTwoYears}
                            </p>
                        ) : null}
                    </div>
                </div>
            </div>
        </>
    );
};

export default PlanCard;

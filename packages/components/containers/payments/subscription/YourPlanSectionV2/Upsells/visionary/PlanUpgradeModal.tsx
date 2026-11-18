import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { IcCheckmark } from '@proton/icons/icons/IcCheckmark';
import { IcCross } from '@proton/icons/icons/IcCross';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import { getPlanName, getPlanTitle } from '@proton/payments/core/subscription/helpers';
import type { FullPlansMap, Subscription } from '@proton/payments/core/subscription/interface';
import { VPN_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import type { FreePlanDefault } from '@proton/shared/lib/payments/plan/interface';
import clsx from '@proton/utils/clsx';

import Info from '../../../../../../components/link/Info';
import ModalTwo from '../../../../../../components/modalTwo/Modal';
import ModalTwoContent from '../../../../../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../../../../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../../../../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../../../../../components/modalTwo/useModalState';
import Price from '../../../../../../components/price/Price';
import { PlanOfferLogo } from './PlanOfferCard';
import type { ComparisonValue, VisionaryUpsellSubscriberPlan } from './helpers';
import { getComparisonRows, getUpgradeWindowPrice, getVisionaryTitle } from './helpers';

const ComparisonCell = ({ value, offered }: { value: ComparisonValue; offered: boolean }) => {
    if (value === true) {
        return (
            <>
                <IcCheckmark className="color-success" />
                <span className="sr-only">{c('Visionary upsell').t`Included`}</span>
            </>
        );
    }
    if (value === false) {
        return (
            <>
                <IcCross className="color-weak" />
                <span className="sr-only">{c('Visionary upsell').t`Not included`}</span>
            </>
        );
    }
    return <span className={offered ? 'text-semibold' : 'color-weak'}>{value}</span>;
};

interface Props extends ModalStateProps {
    offeredPlanName: PLANS.VISIONARY | PLANS.BUNDLE;
    subscriberPlan: VisionaryUpsellSubscriberPlan;
    subscription: Subscription;
    plansMap: FullPlansMap;
    freePlan: FreePlanDefault;
    onUpgrade: () => void;
    onComparePlans: () => void;
}

const PlanUpgradeModal = ({
    offeredPlanName,
    subscriberPlan,
    subscription,
    plansMap,
    freePlan,
    onUpgrade,
    onComparePlans,
    ...rest
}: Props) => {
    const isVisionary = offeredPlanName === PLANS.VISIONARY;
    const offeredPlan = plansMap[offeredPlanName];
    const currentPlanName = getPlanName(subscription);
    const currentPlan = currentPlanName ? plansMap[currentPlanName] : undefined;
    const price = getUpgradeWindowPrice(offeredPlan);
    const planTitle = isVisionary ? getVisionaryTitle() : PLAN_NAMES[offeredPlanName];
    const yearlyTotal = price ? getSimplePriceString(price.currency, price.yearlyTotal) : '';
    const currentPlanTitle = getPlanTitle(subscription);

    const rows = getComparisonRows({
        offeredPlanName,
        subscriberPlan,
        subscription,
        currentPlan,
        offeredPlan,
        freePlan,
    });

    const description = isVisionary
        ? c('Visionary upsell').t`New services at no extra cost, and early access to what we build next.`
        : c('Visionary upsell')
              .t`Privacy suite with secure email, ${VPN_SHORT_APP_NAME}, cloud storage, and password manager in one bundle.`;

    const upgradeLabel = c('Action').t`Upgrade to ${planTitle}`;

    return (
        <ModalTwo size="large" {...rest} data-testid={`upgrade-window-${offeredPlanName}`}>
            <ModalTwoHeader
                title={
                    <>
                        {isVisionary && (
                            <span className="block text-sm text-semibold color-primary mb-1">
                                {c('Visionary upsell').t`Exclusive to subscribers`}
                            </span>
                        )}
                        {upgradeLabel}
                    </>
                }
                subline={description}
            />
            <ModalTwoContent>
                {price && (
                    <div className="flex flex-nowrap items-center gap-4 mb-6">
                        <PlanOfferLogo planName={offeredPlanName} />
                        <div>
                            <div className="flex flex-wrap items-baseline gap-2">
                                <Price
                                    currency={price.currency}
                                    suffix={c('Suffix').t`/month`}
                                    currencyClassName="text-4xl text-bold"
                                    amountClassName="text-4xl text-bold"
                                    suffixClassName="color-weak"
                                    data-testid="upgrade-window-price"
                                >
                                    {price.pricePerMonth}
                                </Price>
                                {price.discountPercent > 0 && (
                                    <span className="text-sm text-semibold color-success">
                                        −&nbsp;{price.discountPercent}%
                                    </span>
                                )}
                                {price.discountPercent > 0 && (
                                    <del className="color-weak">
                                        {getSimplePriceString(price.currency, price.monthlyPrice)}
                                    </del>
                                )}
                            </div>
                            <p className="m-0 text-sm color-weak">
                                {
                                    // translator: ${yearlyTotal} is a price with its currency, e.g. "€119.88 billed every 12 months."
                                    c('Visionary upsell').t`${yearlyTotal} billed every 12 months.`
                                }
                            </p>
                        </div>
                    </div>
                )}
                <table className="w-full border-collapse" data-testid="upgrade-window-comparison">
                    <thead>
                        <tr>
                            <th scope="col">
                                <span className="sr-only">{c('Visionary upsell').t`Feature`}</span>
                            </th>
                            <th scope="col" className="text-center text-sm text-normal p-2">
                                <span className="block">{currentPlanTitle}</span>
                                <span className="block text-xs color-weak">{c('Visionary upsell').t`Your plan`}</span>
                            </th>
                            <th scope="col" className="text-center text-semibold color-primary p-2">
                                {planTitle}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {rows.map((row, index) => (
                            <tr key={row.id} className={clsx(index % 2 === 0 && 'bg-weak')} data-testid={row.id}>
                                <th
                                    scope="row"
                                    className={clsx(
                                        'text-left p-3 rounded-l-lg',
                                        row.id === 'ultra-servers' ? 'text-semibold' : 'text-normal'
                                    )}
                                >
                                    {row.label}
                                    {row.tooltip && <Info title={row.tooltip} className="ml-1" />}
                                </th>
                                <td className="text-center p-3">
                                    <ComparisonCell value={row.current} offered={false} />
                                </td>
                                <td className="text-center p-3 rounded-r-lg">
                                    <ComparisonCell value={row.offered} offered />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button color="norm" shape="ghost" onClick={onComparePlans}>
                    {c('Action').t`Compare all plans`}
                </Button>
                <Button color="norm" onClick={onUpgrade}>
                    {upgradeLabel}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default PlanUpgradeModal;

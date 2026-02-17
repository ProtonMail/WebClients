import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getDealDurationText } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import { type CYCLE, type Currency, type Cycle, hasLumoAddonFromPlanIDs } from '@proton/payments';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import { LUMO_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import SaveLabel from './SaveLabel';
import type { SummaryPlan } from './configuration';

interface Props {
    summaryPlan: SummaryPlan;
    cycle?: CYCLE;
    price: ReactNode;
    regularPrice: ReactNode;
    addons?: ReactNode;
    children?: ReactNode;
    discount: number;
    free?: boolean;
    className?: string;
    checkout?: PaymentsCheckoutUI;
    mode?: 'addons';
    isTrial?: boolean;
}

const RightPlanSummary = ({
    summaryPlan,
    cycle,
    price,
    addons,
    regularPrice,
    children,
    discount,
    free,
    className,
    checkout,
    mode,
    isTrial,
}: Props) => {
    const { title: planTitle, logo, features = [], isLifetime } = summaryPlan ?? {};

    const hasLumo = hasLumoAddonFromPlanIDs(checkout?.planIDs ?? {});

    const displayTitle = hasLumo ? c('Payments').t`${planTitle} + ${LUMO_SHORT_APP_NAME}` : planTitle;

    return (
        <div className={clsx('w-full p-6', className)}>
            <div className="text-rg text-bold mb-4">{c('Info').t`Summary`}</div>
            <div className="flex gap-2 flex-nowrap mb-4 items-center">
                <div className="border rounded-lg p-2 right-summary-logo" title={displayTitle}>
                    {logo}
                </div>
                <div className="flex-1">
                    <div className="flex gap-2">
                        <div className="text-rg text-bold flex-1">{displayTitle}</div>
                        {mode !== 'addons' && <div className="text-rg text-bold">{price}</div>}
                    </div>
                    <div className="flex flex-1 items-center gap-1 text-sm">
                        {!free && !isLifetime && (
                            <div className="color-weak text-ellipsis">{getDealDurationText(cycle)}</div>
                        )}
                        {(() => {
                            if (free) {
                                return <div className="flex-auto color-weak">{c('Info').t`Free forever`}</div>;
                            }
                            if (discount > 0) {
                                return (
                                    <>
                                        <div className="flex-auto">
                                            <SaveLabel percent={discount} />
                                        </div>
                                        {mode !== 'addons' && (
                                            <span className="inline-flex">
                                                <span className="color-weak text-strike text-ellipsis">
                                                    {regularPrice}
                                                </span>
                                                <span className="color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>
                                            </span>
                                        )}
                                    </>
                                );
                            }
                        })()}
                    </div>
                </div>
            </div>
            {(() => {
                if (mode !== 'addons' || !checkout || cycle === undefined) {
                    return null;
                }
                return (
                    <>
                        {addons}
                        {!isTrial && (
                            <div className="mb-4">
                                <hr />
                            </div>
                        )}
                    </>
                );
            })()}
            <PlanCardFeatureList
                odd={false}
                margin={false}
                features={features}
                icon={false}
                highlight={false}
                iconSize={4}
                tooltip={false}
                className="text-sm mb-5 gap-1"
                itemClassName="color-weak"
            />
            {children}
        </div>
    );
};

export default RightPlanSummary;

const getPrice = (price: string) => {
    return (
        <div className="text-right">
            <div className="text-rg text-bold">{price}</div>
            <span className="color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>
        </div>
    );
};

export const RightPlanSummaryAddons = ({
    cycle,
    currency,
    checkout,
    displayMembersWithDiscount,
}: {
    cycle: Cycle;
    currency: Currency;
    checkout: PaymentsCheckoutUI;
    displayMembersWithDiscount: boolean;
}) => {
    return [
        {
            key: 'users',
            left: checkout?.usersTitle,
            right: getPrice(
                getSimplePriceString(
                    currency,
                    displayMembersWithDiscount ? checkout.withDiscountMembersPerMonth : checkout.membersPerMonth
                )
            ),
        },
        ...checkout.addons.map((addon) => {
            const price = (addon.quantity * (addon.pricing[cycle] || 0)) / cycle;
            if (isNaN(price)) {
                return;
            }
            return {
                key: addon.name,
                left: <span>{addon.title}</span>,
                right: getPrice(getSimplePriceString(currency, price)),
            };
        }),
    ]
        .filter(isTruthy)
        .map(({ key, left, right }) => (
            <div key={key} className="flex flex-nowrap mb-4">
                <div className="flex-1">{left}</div>
                {right}
            </div>
        ));
};

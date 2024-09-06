import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getDealDurationText } from '@proton/components/containers/offers/helpers/offerCopies';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import type { CYCLE } from '@proton/shared/lib/constants';
import type { SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import type { Currency, Cycle } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';
import isTruthy from '@proton/utils/isTruthy';

import SaveLabel from './SaveLabel';

interface Props {
    cycle?: CYCLE;
    title: string;
    price: ReactNode;
    regularPrice: ReactNode;
    addons?: ReactNode;
    logo: ReactNode;
    children?: ReactNode;
    discount: number;
    features: PlanCardFeatureDefinition[];
    free?: boolean;
    className?: string;
    checkout?: SubscriptionCheckoutData;
    mode?: 'addons';
}

const RightPlanSummary = ({
    cycle,
    title,
    price,
    addons,
    regularPrice,
    logo,
    children,
    discount,
    features,
    free,
    className,
    checkout,
    mode,
}: Props) => {
    return (
        <div className={clsx('w-full p-6', className)}>
            <div className="text-rg text-bold mb-4">{c('Info').t`Summary`}</div>
            <div className="flex gap-2 flex-nowrap mb-4 items-center">
                <div className="border rounded-lg p-2" title={title}>
                    {logo}
                </div>
                <div className="flex-1">
                    <div className="flex gap-2">
                        <div className="text-rg text-bold flex-1">{title}</div>
                        {mode !== 'addons' && <div className="text-rg text-bold">{price}</div>}
                    </div>
                    <div className="flex flex-1 items-center gap-1 text-sm">
                        {!free && <div className="color-weak text-ellipsis">{getDealDurationText(cycle)}</div>}
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
                        <div className="mb-4">
                            <hr />
                        </div>
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
}: {
    cycle: Cycle;
    currency: Currency;
    checkout: SubscriptionCheckoutData;
}) => {
    return [
        {
            key: 'users',
            left: checkout?.usersTitle,
            right: getPrice(getSimplePriceString(currency, checkout.membersPerMonth)),
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

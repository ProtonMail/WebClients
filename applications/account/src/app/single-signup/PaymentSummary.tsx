import type { ReactNode } from 'react';

import { addDays, getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Time } from '@proton/components';
import Price from '@proton/components/components/price/Price';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import { useCouponConfig } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import { type PaymentFacade } from '@proton/components/payments/client-extensions';
import { ADDON_NAMES, type Plan, TRIAL_DURATION_DAYS } from '@proton/payments';
import type { getCheckout } from '@proton/shared/lib/helpers/checkout';
import { getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/planIDs';
import { SubscriptionMode } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { OptimisticOptions } from '../single-signup-v2/interface';
import AddonSummary from './AddonSummary';
import SaveLabel2 from './SaveLabel2';
import { getBilledText } from './Step1';
import type { getPlanInformation } from './getPlanInformation';
import type { VPNSignupModel } from './interface';
import getAddonsPricing from './planCustomizer/getAddonsPricing';

const TrialSummary = ({ loading, options }: { loading: boolean; options: OptimisticOptions }) => {
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

    const trialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    const formattedDate = <Time>{getUnixTime(trialEndDate)}</Time>;

    return (
        <>
            <div className="mx-3 flex flex-column gap-2">
                <div className="flex justify-space-between text-bold text-rg">
                    <span>{c('b2b_trials_2025_Label').t`Amount due after trial`}</span>
                    <span>
                        {loading ? (
                            loaderNode
                        ) : (
                            <Price currency={options.currency}>{options.checkResult.BaseRenewAmount ?? 0}</Price>
                        )}
                    </span>
                </div>
                <div className="text-sm color-weak">{c('b2b_trials_2025_Info').jt`on ${formattedDate}`}</div>
            </div>
        </>
    );
};
interface Props {
    model: VPNSignupModel;
    options: OptimisticOptions & { plan: Plan };
    loadingPaymentDetails: boolean;
    actualCheckout: ReturnType<typeof getCheckout>;
    isB2bPlan: boolean;
    giftCode: ReactNode;
    planInformation: ReturnType<typeof getPlanInformation>;
    upsellToggle: ReactNode;
    hasSelectedFree: boolean;
    paymentFacade: PaymentFacade;
}

const PaymentSummary = ({
    model,
    options,
    loadingPaymentDetails,
    actualCheckout,
    isB2bPlan,
    giftCode,
    planInformation,
    upsellToggle,
    hasSelectedFree,
    paymentFacade,
}: Props) => {
    const initialLoading = model.loadingDependencies;
    const loading = loadingPaymentDetails || initialLoading;
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

    const addonsPricing = getAddonsPricing({
        currentPlan: options.plan,
        plansMap: model.plansMap,
        planIDs: options.planIDs,
        cycle: options.cycle,
    });

    const couponConfig = useCouponConfig({
        planIDs: options.planIDs,
        plansMap: model.plansMap,
        checkResult: model.subscriptionData.checkResult,
    });

    const isTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;

    const discountPercent = (() => {
        if (!isTrial) {
            return actualCheckout.discountPercent;
        }
        const pricing = getPricingFromPlanIDs(options.planIDs, model.plansMap);
        const totals = getTotalFromPricing(pricing, options.cycle);
        return totals.discountPercentage;
    })();

    return (
        <div className="flex flex-column gap-3">
            <div className="color-weak text-semibold mx-3">{c('Info').t`Summary`}</div>
            {(() => {
                if (!planInformation) {
                    return null;
                }

                const pricePerMonth = initialLoading
                    ? loaderNode
                    : getSimplePriceString(options.currency, actualCheckout.withDiscountPerMonth);
                const regularPrice = initialLoading
                    ? loaderNode
                    : getSimplePriceString(options.currency, actualCheckout.withoutDiscountPerMonth);

                return (
                    <div
                        className={clsx('rounded-xl flex flex-column gap-1', upsellToggle ? 'border border-weak' : '')}
                    >
                        <div className="p-2 flex gap-2">
                            <div>
                                <div
                                    className="inline-block border border-weak rounded-lg p-2"
                                    title={planInformation.title}
                                >
                                    {planInformation.logo}
                                </div>
                            </div>
                            <div className="flex-1">
                                <div className="flex gap-2">
                                    <div className="text-rg text-bold flex-1">{planInformation.title}</div>
                                    {!isB2bPlan && <div className="text-rg text-bold">{pricePerMonth}</div>}
                                </div>
                                <div className="flex-1 flex items-center gap-2">
                                    <div className="flex-1 text-sm">
                                        <span className="color-weak mr-1">{getBilledText(options.cycle)}</span>
                                        {discountPercent > 0 && !couponConfig?.hidden && (
                                            <SaveLabel2 className="text-sm inline-block" highlightPrice>
                                                {`− ${discountPercent}%`}
                                            </SaveLabel2>
                                        )}
                                    </div>

                                    {hasSelectedFree && (
                                        <div className="flex-1 text-sm color-weak">{c('Info').t`Free forever`}</div>
                                    )}

                                    {!isB2bPlan && discountPercent > 0 && (
                                        <span className="inline-flex">
                                            <span className="text-sm color-weak text-strike text-ellipsis">
                                                {regularPrice}
                                            </span>
                                            <span className="text-sm color-weak ml-1">{` ${c('Suffix')
                                                .t`/month`}`}</span>
                                        </span>
                                    )}

                                    {hasSelectedFree && (
                                        <span className="text-sm color-weak ml-1">{` ${c('Suffix').t`/month`}`}</span>
                                    )}
                                </div>
                            </div>
                        </div>
                        {upsellToggle && (
                            <>
                                <div className="border-top border-weak" />
                                {upsellToggle}
                            </>
                        )}
                    </div>
                );
            })()}

            {addonsPricing.length > 0 ? (
                <>
                    <div className="mx-3 mt-1 flex flex-column gap-2">
                        {(() => {
                            return addonsPricing.map(({ addonPricePerCycle, cycle, value, addon }) => {
                                const price = initialLoading ? (
                                    loaderNode
                                ) : (
                                    <Price currency={options.currency}>{addonPricePerCycle / cycle}</Price>
                                );
                                if (
                                    addon.Name === ADDON_NAMES.MEMBER_VPN_PRO ||
                                    addon.Name === ADDON_NAMES.MEMBER_VPN_BUSINESS
                                ) {
                                    return (
                                        <AddonSummary
                                            key={addon.Name}
                                            label={c('Checkout summary').t`Users`}
                                            numberOfItems={value}
                                            price={price}
                                            subline={<>/ {c('Checkout summary').t`month`}</>}
                                        />
                                    );
                                }

                                if (addon.Name === ADDON_NAMES.IP_VPN_BUSINESS) {
                                    return (
                                        <AddonSummary
                                            key={addon.Name}
                                            label={c('Checkout summary').t`Servers`}
                                            numberOfItems={value}
                                            price={price}
                                        />
                                    );
                                }
                            });
                        })()}
                    </div>
                    {!isTrial && <hr className="mx-3 my-0 border-bottom border-weak" />}
                </>
            ) : null}

            {isB2bPlan && !isTrial && (
                <div className="mx-3 text-bold flex justify-space-between text-rg gap-2">
                    <span>{getTotalBillingText(options.cycle, options.planIDs)}</span>
                    <span>
                        {initialLoading ? (
                            loaderNode
                        ) : (
                            <Price currency={options.currency}>{options.checkResult.Amount}</Price>
                        )}
                    </span>
                </div>
            )}

            {isB2bPlan && <hr className="mx-3 my-0 border-bottom border-weak" />}

            {isB2bPlan && !isTrial && (
                <>
                    <div className="mx-3">{giftCode}</div>
                    <hr className="mx-3 my-0 border-bottom border-weak" />
                </>
            )}

            <div className="mx-3 flex flex-column gap-2">
                <div className={clsx('text-bold', 'flex justify-space-between text-rg gap-2')}>
                    <span>
                        {isTrial
                            ? c('b2b_trials_2025_Label').t`Amount due now`
                            : isB2bPlan
                              ? c('Info').t`Amount due`
                              : getTotalBillingText(options.cycle, options.planIDs)}
                    </span>
                    <span>
                        {loading ? (
                            loaderNode
                        ) : (
                            <>
                                <Price currency={options.currency}>{options.checkResult.AmountDue}</Price>*
                            </>
                        )}
                    </span>
                </div>

                {paymentFacade.showInclusiveTax && (
                    <InclusiveVatText
                        tax={options.checkResult?.Taxes?.[0]}
                        currency={options.currency}
                        className="text-sm color-weak"
                    />
                )}
            </div>
            {isTrial && <TrialSummary loading={loading} options={options} />}
        </div>
    );
};

export default PaymentSummary;

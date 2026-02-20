import type { ReactNode } from 'react';

import { addDays, getUnixTime } from 'date-fns';
import { c } from 'ttag';

import { Time } from '@proton/components';
import Price from '@proton/components/components/price/Price';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import { useCouponConfig } from '@proton/components/containers/payments/subscription/coupon-config/useCouponConfig';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import { type Plan, SubscriptionMode, TRIAL_DURATION_DAYS } from '@proton/payments';
import { createCheckoutView } from '@proton/payments/ui/headless-checkout/checkout-view';
import { APPS } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import type { OptimisticOptions } from '../single-signup-v2/interface';
import AddonSummary from './AddonSummary';
import SaveLabel2 from './SaveLabel2';
import type { getPlanInformation } from './getPlanInformation';
import type { VPNSignupModel } from './interface';

const TrialSummary = ({ loading, options }: { loading: boolean; options: OptimisticOptions }) => {
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

    const trialEndDate = addDays(new Date(), TRIAL_DURATION_DAYS);
    const formattedDate = <Time key="trial-end-date">{getUnixTime(trialEndDate)}</Time>;

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
    giftCode: ReactNode;
    planInformation: ReturnType<typeof getPlanInformation>;
    upsellToggle: ReactNode;
}

const PaymentSummary = ({ model, options, loadingPaymentDetails, giftCode, planInformation, upsellToggle }: Props) => {
    const initialLoading = model.loadingDependencies;
    const loading = loadingPaymentDetails || initialLoading;
    const loaderNode = <SkeletonLoader width="4em" index={0} />;

    const couponConfig = useCouponConfig({
        planIDs: options.planIDs,
        plansMap: model.plansMap,
        checkResult: model.subscriptionData.checkResult,
    });

    const isTrial = options.checkResult.SubscriptionMode === SubscriptionMode.Trial;

    const checkoutView = createCheckoutView(
        {
            planIDs: options.planIDs,
            plansMap: model.plansMap,
            checkResult: options.checkResult,
            isTrial,
            couponConfig,
            app: APPS.PROTONVPN_SETTINGS,
        },
        (headless) => ({
            addons: (item) => {
                return item.addons.map((addon) => {
                    return (
                        <AddonSummary
                            key={addon.addonName}
                            label={addon.labelWithoutQuantityShort}
                            numberOfItems={addon.quantity}
                            price={initialLoading ? loaderNode : addon.pricePerOnePerMonthElement}
                            subline={undefined}
                        />
                    );
                });
            },
            billingCycle: (item) => {
                return <span className="color-weak mr-1">{item.normalText}</span>;
            },
            members: (item) => {
                if (headless.isB2C) {
                    return null;
                }

                return (
                    <AddonSummary
                        key="members"
                        label={item.labelWithoutQuantity}
                        numberOfItems={item.totalUsers}
                        price={initialLoading ? loaderNode : item.pricePerOnePerMonthElement}
                        subline={<>/ {c('Checkout summary').t`month`}</>}
                    />
                );
            },
            planAmount: () => {
                if (
                    // mostly, B2C cases are simple, so we don't display the full plan amount for them for now.
                    !headless.isB2B ||
                    // Before tax exclusive, B2B cases with trials were also rather simple. But when tax exclusive is
                    // enabled, we need to show the full plan price, otherwise it will be confusing for users
                    (headless.isTrial && headless.isTaxInclusive)
                ) {
                    return null;
                }

                const amount = headless.isTrial
                    ? // for trials, backend returns checkResult.Amount === 0, so we need to use the optimistic amount
                      headless.checkoutUi.regularAmountPerCycleOptimistic
                    : headless.checkResult.Amount;

                return (
                    <>
                        <div className="mx-3 text-bold flex justify-space-between text-rg gap-2">
                            <span>
                                {getTotalBillingText(options.cycle, options.planIDs, {
                                    excludingTax: headless.isTaxExclusive,
                                })}
                            </span>
                            <span>
                                {initialLoading ? loaderNode : <Price currency={options.currency}>{amount}</Price>}
                            </span>
                        </div>
                    </>
                );
            },
            discount: (item) => (
                <SaveLabel2 className="text-sm inline-block" highlightPrice>
                    {`− ${item.discountPercent}%`}
                </SaveLabel2>
            ),
            planAmountWithDiscount: () => null,
            proration: () => null,
            unusedCredit: () => null,
            credit: () => null,
            gift: () => null,
            taxExclusive: (item) => (
                <div className="mx-3 flex justify-space-between gap-2">
                    <span>{item.taxRateElement}</span>
                    <span>{item.taxAmountElement}</span>
                </div>
            ),
            nextBilling: () => null,
            amountDue: (item) => {
                const amountDueLabel = (() => {
                    if (headless.isTrial) {
                        return c('b2b_trials_2025_Label').t`Amount due now`;
                    }
                    if (headless.isB2B) {
                        return c('Info').t`Amount due`;
                    }

                    return getTotalBillingText(item.cycle, item.planIDs, {
                        excludingTax: false,
                    });
                })();

                return (
                    <div className={clsx('text-bold', 'flex justify-space-between text-rg gap-2')}>
                        <span>{amountDueLabel}</span>
                        <span>
                            {loading ? (
                                loaderNode
                            ) : (
                                <>
                                    <Price currency={item.currency}>{item.amountDue}</Price>*
                                </>
                            )}
                        </span>
                    </div>
                );
            },
            taxInclusive: (item) => (
                <div className="text-sm color-weak" data-testid="tax">
                    <span>{item.taxRateAndAmountElement}</span>
                </div>
            ),
            renewalNotice: () => null,
            coupon: () => null,
        })
    );

    const isB2bPlan = checkoutView.checkoutData.isB2B;

    const discountItem = checkoutView.getItem('discount');

    return (
        <div className="flex flex-column gap-3">
            <div className="color-weak text-semibold mx-3">{c('Info').t`Summary`}</div>
            {(() => {
                if (!planInformation) {
                    return null;
                }

                const pricePerMonth = initialLoading
                    ? loaderNode
                    : getSimplePriceString(options.currency, discountItem.withDiscountPerMonth);

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
                                        {checkoutView.render('billingCycle')}
                                        {checkoutView.render('discount')}
                                    </div>

                                    {!isB2bPlan && discountItem.discountPercent > 0 && (
                                        <span className="inline-flex">
                                            <span className="text-sm color-weak text-strike text-ellipsis">
                                                {/* Regular Price */}
                                                {initialLoading
                                                    ? loaderNode
                                                    : getSimplePriceString(
                                                          options.currency,
                                                          discountItem.withoutDiscountPerMonth
                                                      )}
                                            </span>
                                            <span className="text-sm color-weak ml-1">{` ${c('Suffix')
                                                .t`/month`}`}</span>
                                        </span>
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

            {(() => {
                const membersElement = checkoutView.render('members');
                const addonsElement = checkoutView.render('addons');

                if (!membersElement && !addonsElement) {
                    return null;
                }

                return (
                    <>
                        <div className="mx-3 mt-1 flex flex-column gap-2">
                            {membersElement}
                            {addonsElement}
                        </div>
                        <hr className="mx-3 my-0 border-bottom border-weak" />
                    </>
                );
            })()}

            {checkoutView.render('planAmount')}

            {isB2bPlan && !isTrial && (
                <>
                    <hr className="mx-3 my-0 border-bottom border-weak" />
                    <div className="mx-3">{giftCode}</div>
                    <hr className="mx-3 my-0 border-bottom border-weak" />
                </>
            )}

            {checkoutView.render('taxExclusive')}

            <div className="mx-3 flex flex-column gap-2">
                {checkoutView.render('amountDue')}
                {checkoutView.render('taxInclusive')}
            </div>
            {isTrial && <TrialSummary loading={loading} options={options} />}
        </div>
    );
};

export default PaymentSummary;

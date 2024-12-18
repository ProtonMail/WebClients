import type { ReactNode } from 'react';

import { c } from 'ttag';

import { getSimplePriceString } from '@proton/components/components/price/helper';
import SkeletonLoader from '@proton/components/components/skeletonLoader/SkeletonLoader';
import InclusiveVatText from '@proton/components/containers/payments/InclusiveVatText';
import {
    type OnBillingAddressChange,
    WrappedTaxCountrySelector,
} from '@proton/components/containers/payments/TaxCountrySelector';
import { getTotalBillingText } from '@proton/components/containers/payments/subscription/helpers';
import { Price } from '@proton/components/index';
import { ADDON_NAMES } from '@proton/payments/core/constants';
import type { getCheckout } from '@proton/shared/lib/helpers/checkout';
import type { Plan } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import type { OptimisticOptions } from '../single-signup-v2/interface';
import AddonSummary from './AddonSummary';
import SaveLabel2 from './SaveLabel2';
import { getBilledText } from './Step1';
import type { getPlanInformation } from './getPlanInformation';
import type { VPNSignupModel } from './interface';
import getAddonsPricing from './planCustomizer/getAddonsPricing';

interface Props {
    model: VPNSignupModel;
    options: OptimisticOptions & { plan: Plan };
    onBillingAddressChange: OnBillingAddressChange;
    showInclusiveTax: boolean;
    showTaxCountry: boolean;
    loadingPaymentDetails: boolean;
    actualCheckout: ReturnType<typeof getCheckout>;
    isB2bPlan: boolean;
    giftCode: ReactNode;
    planInformation: ReturnType<typeof getPlanInformation>;
    upsellToggle: ReactNode;
    hasSelectedFree: boolean;
}

const PaymentSummary = ({
    model,
    options,
    showTaxCountry,
    showInclusiveTax,
    onBillingAddressChange,
    loadingPaymentDetails,
    actualCheckout,
    isB2bPlan,
    giftCode,
    planInformation,
    upsellToggle,
    hasSelectedFree,
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
                                        {actualCheckout.discountPercent > 0 && (
                                            <SaveLabel2 className="text-sm inline-block" highlightPrice>
                                                {`− ${actualCheckout.discountPercent}%`}
                                            </SaveLabel2>
                                        )}
                                    </div>

                                    {hasSelectedFree && (
                                        <div className="flex-1 text-sm color-weak">{c('Info').t`Free forever`}</div>
                                    )}

                                    {!isB2bPlan && actualCheckout.discountPercent > 0 && (
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
                    <div className="mx-3 border-bottom border-weak" />
                </>
            ) : null}

            {isB2bPlan && (
                <>
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
                    <div className="mx-3 border-bottom border-weak" />
                </>
            )}

            {isB2bPlan && (
                <>
                    <div className="mx-3">{giftCode}</div>
                    <div className="mx-3 border-bottom border-weak" />
                </>
            )}

            <div className="mx-3 flex flex-column gap-2">
                {showTaxCountry && (
                    <WrappedTaxCountrySelector
                        onBillingAddressChange={onBillingAddressChange}
                        statusExtended={model.paymentMethodStatusExtended}
                    />
                )}
                <div className={clsx('text-bold', 'flex justify-space-between text-rg gap-2')}>
                    <span>
                        {isB2bPlan ? c('Info').t`Amount due` : getTotalBillingText(options.cycle, options.planIDs)}
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

                {showInclusiveTax && (
                    <InclusiveVatText
                        tax={options.checkResult?.Taxes?.[0]}
                        currency={options.currency}
                        className="text-sm color-weak"
                    />
                )}
            </div>
        </div>
    );
};

export default PaymentSummary;

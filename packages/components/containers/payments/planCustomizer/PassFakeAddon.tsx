import type { ReactElement } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Badge } from '@proton/components/components/badge/Badge';
import PassLogo from '@proton/components/components/logo/PassLogo';
import Price from '@proton/components/components/price/Price';
import getBoldFormattedText from '@proton/components/helpers/getBoldFormattedText';
import type { Cycle, FullPlansMap } from '@proton/payments';
import { type Currency, PLANS, PLAN_NAMES, type PlanIDs, getPrice } from '@proton/payments';
import { BRAND_NAME, PASS_SHORT_APP_NAME, VPN_SHORT_APP_NAME } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import './PassFakeAddon.scss';

const PassFakeAddonBanner = ({
    onAdd,
    onRemove,
    bundlePlanPriceInline,
    isActive,
}: {
    onAdd: () => void;
    onRemove: () => void;
    bundlePlanPriceInline: ReactElement;
    isActive: boolean;
}) => (
    <div
        className={clsx(
            'flex gap-4 rounded-lg bg-pass-promotion-gradient-vertical',
            isActive && 'border border-2 border-primary pass-promotion-selected',
            !isActive && 'border p-4'
        )}
        data-testid="pass-bundle-banner"
    >
        <div className="flex gap-5">
            <div className="flex flex-row gap-5 w-full bg-promotion-weak">
                <div className="rounded-lg p-2 right-summary-logo bg-norm" title={PLAN_NAMES[PLANS.PASS]}>
                    <PassLogo variant="glyph-only" size={8} />
                </div>
                <div className="flex-1">
                    <div className="m-0">
                        <div className="flex flex-row justify-space-between">
                            <strong className="text-lg">{c('Info').t`Add ${BRAND_NAME} ${PASS_SHORT_APP_NAME}`}</strong>{' '}
                            <Badge type="primary" className="m-0">{c('Info').t`RECOMMENDED`}</Badge>
                        </div>
                        <span className="block text-base">
                            {
                                // translator: ${bundlePlanPriceInline} is the price of the bundle plan (e.g. "$3.99/month")
                                c('Info').jt`For just ${bundlePlanPriceInline}`
                            }
                        </span>
                    </div>
                </div>
            </div>
            <p className="m-0 bg-promotion-text">
                {
                    // translator: **text** renders as bold; ${VPN_SHORT_APP_NAME} and ${PASS_SHORT_APP_NAME} are product names (e.g. "Proton VPN", "Proton Pass")
                    getBoldFormattedText(
                        c('Info').t`${VPN_SHORT_APP_NAME} hides your traffic. ${PASS_SHORT_APP_NAME} hides your identity
                        — unlimited **hide-my-email aliases** and **dark-web alerts** if your data is ever leaked.`
                    )
                }
            </p>
        </div>
        {isActive ? (
            <Button color="danger" shape="outline" className="flex w-full justify-center" onClick={onRemove}>
                <span data-testid="pass-bundle-active-remove-button">{c('Action').t`Remove`}</span>
            </Button>
        ) : (
            <Button color="norm" shape="outline" className="flex w-full justify-center" onClick={onAdd}>
                <span data-testid="pass-bundle-banner-add-button">{c('Action')
                    .t`Add ${BRAND_NAME} ${PASS_SHORT_APP_NAME}`}</span>
            </Button>
        )}
    </div>
);

interface PassFakeAddonProps {
    currency: Currency;
    cycle: Cycle;
    plansMap: FullPlansMap;
    onAddPass: (planIDs: PlanIDs) => void;
    onRemovePass: () => void;
    vpnPassBundleSelected: boolean;
}

export const PassFakeAddon = ({
    onAddPass,
    onRemovePass,
    vpnPassBundleSelected,
    currency,
    cycle,
    plansMap,
}: PassFakeAddonProps) => {
    const vpnPassBundlePlanName = PLANS.VPN_PASS_BUNDLE;

    const bundlePrice = getPrice({ [vpnPassBundlePlanName]: 1 }, cycle, plansMap) / cycle;
    const vpnPrice = getPrice({ [PLANS.VPN2024]: 1 }, cycle, plansMap) / cycle;

    const bundlePlanPrice = bundlePrice - vpnPrice;

    const bundlePlanPriceInline = (
        <Price key={`${vpnPassBundlePlanName}-1`} currency={currency} suffix={c('Suffix for price').t`per month`}>
            {bundlePlanPrice}
        </Price>
    );

    return (
        <div>
            <PassFakeAddonBanner
                bundlePlanPriceInline={bundlePlanPriceInline}
                onAdd={() => onAddPass({ [vpnPassBundlePlanName]: 1 })}
                onRemove={onRemovePass}
                isActive={vpnPassBundleSelected}
            />
        </div>
    );
};

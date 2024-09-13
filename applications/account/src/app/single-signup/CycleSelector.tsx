import type { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { PassLogo, Radio } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import { CYCLE, PLANS } from '@proton/shared/lib/constants';
import type { SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import type { Currency, CycleMapping, PlanIDs } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import SaveLabel2 from './SaveLabel2';
import { getBillingCycleText, getOffText, getPassText } from './helper';

import './CycleSelector.scss';

export const getBilledAtText = (price: string): string | null => {
    return c('Info').t`Billed at ${price}`;
};

export const getBilledAtPerMonthText = (price: string, cycle: CYCLE): string | null => {
    if (cycle === CYCLE.MONTHLY) {
        return c('Info').t`per month`;
    }
    return c('Info').t`per month, billed at ${price}`;
};

export const getBilledText = (cycle: CYCLE): string | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('Info').t`per month`;
        case CYCLE.YEARLY:
            return c('Info').t`per month, billed every 12 months`;
        case CYCLE.TWO_YEARS:
            return c('Info').t`per month, billed every 24 months`;
        case CYCLE.FIFTEEN:
            return c('Info').t`per month`;
        case CYCLE.THIRTY:
            return c('Info').t`per month`;
        default:
            return null;
    }
};

const getSaveLabel = (percentage: string) => c('Info').t`Save ${percentage}`;

const CycleItemView = ({
    cycle,
    currency,
    text,
    orderGroup,
    billedText,
    headerText,
    totalPerMonth,
    totalWithoutPerMonth,
    highlightPrice,
    discountPercentage,
    selected,
    onSelect,
    upsell,
    cta,
    extra,
    bg,
}: {
    cycle: CYCLE;
    currency: Currency;
    orderGroup: number;
    text: string;
    billedText: string | null;
    headerText: ReactNode;
    highlightPrice: boolean;
    totalPerMonth: number;
    totalWithoutPerMonth: number;
    discountPercentage: number;
    selected: boolean;
    onSelect: () => void;
    upsell: ReactNode;
    cta: ReactNode;
    extra?: ReactNode;
    bg?: boolean;
}) => {
    return (
        <div
            className={clsx(
                'lg:flex-1 w-full pricing-box-content-cycle max-w-custom mx-auto lg:mx-0',
                orderGroup === 1
                    ? `order-0 lg:order-${orderGroup}`
                    : `order-${orderGroup === 2 ? 1 : 2} lg:order-${orderGroup}`
            )}
            style={{ '--max-w-custom': '30em' }}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <div
                className={clsx(
                    'rounded-lg relative border',
                    selected ? 'border-primary' : 'cursor-pointer',
                    bg ? 'ui-standard border-2' : 'border',
                    selected && !bg && 'border-2'
                )}
                onClick={!selected ? onSelect : undefined}
                style={!selected && bg ? { 'border-color': 'transparent' } : undefined}
            >
                {headerText && (
                    <div
                        className={clsx(
                            'rounded-full text-center text-sm text-semibold py-1 px-4 absolute cycle-selector-label text-nowrap',
                            selected ? 'color-primary color-invert bg-primary' : 'color-primary bg-norm-weak'
                        )}
                    >
                        {headerText}
                    </div>
                )}
                <div className="p-4 pt-6" data-testid={`plan-${cycle}`}>
                    <div>
                        <div className="flex items-center flex-nowrap gap-3">
                            <Radio
                                id={`${cycle}`}
                                aria-labelledby={`${cycle}-text ${cycle}-save ${cycle}-price ${cycle}-billed ${cycle}-guarantee `}
                                name="billing"
                                checked={selected}
                                readOnly
                            />
                            <strong className="text-lg" id={`${cycle}-text`}>
                                {text}
                            </strong>
                        </div>

                        <div className="pt-4">
                            {discountPercentage > 0 && (
                                <div className="flex gap-1">
                                    <span className="text-strike color-hint">
                                        {getSimplePriceString(currency, totalWithoutPerMonth)}
                                    </span>
                                    <SaveLabel2
                                        highlightPrice
                                        id={`${cycle}-save`}
                                        className={clsx('text-bold text-uppercase')}
                                    >
                                        {getSaveLabel(`${discountPercentage}%`)}
                                    </SaveLabel2>
                                </div>
                            )}

                            <div id={`${cycle}-price`}>
                                <span className={clsx(highlightPrice && 'color-primary', 'text-bold h2')}>
                                    {getSimplePriceString(currency, totalPerMonth)}
                                </span>
                            </div>

                            <div className="text-sm">
                                <div className="color-weak" id={`${cycle}-billed`}>
                                    {billedText}
                                </div>
                            </div>
                        </div>
                    </div>
                    {extra}
                    {cta && selected && <div className="mt-4">{cta}</div>}
                </div>
            </div>
            {selected && upsell && !bg && <div className="mt-2">{upsell}</div>}
        </div>
    );
};

const CycleSelector = ({
    mode,
    cycle,
    cycles,
    onChangeCycle,
    onGetTheDeal,
    checkoutMapping,
    bg,
    upsell,
}: {
    onGetTheDeal: (data: { cycle: CYCLE; planIDs: PlanIDs }) => void;
    cycle: CYCLE;
    mode: 'vpn-pass-promotion' | 'signup' | 'pricing';
    cycles: CYCLE[];
    onChangeCycle: (data: { cycle: CYCLE; upsellFrom?: CYCLE; planIDs: PlanIDs }) => void;
    checkoutMapping: CycleMapping<SubscriptionCheckoutData>;
    upsell?: {
        cycle: CYCLE;
        mapping: SubscriptionCheckoutData;
    };
    bg?: boolean;
}) => {
    let firstNonBestOffer = false;
    return (
        <>
            {cycles.map((cycleItem) => {
                const cycleMapping = checkoutMapping[cycleItem];
                if (!cycleMapping) {
                    return null;
                }
                const currentCheckout = cycleMapping;
                const bestOffer = cycleItem === upsell?.cycle;
                let orderGroup = 2;
                if (bestOffer) {
                    orderGroup = 1;
                } else if (!firstNonBestOffer) {
                    orderGroup = 0;
                    firstNonBestOffer = true;
                }

                const currency = cycleMapping.currency;

                return (
                    <CycleItemView
                        bg={bg}
                        cycle={cycleItem}
                        orderGroup={orderGroup}
                        headerText={bestOffer ? c('Header').t`Best deal` : undefined}
                        onSelect={() => {
                            onChangeCycle({ cycle: cycleItem, planIDs: currentCheckout.planIDs });
                        }}
                        highlightPrice={bestOffer}
                        selected={cycle === cycleItem}
                        text={getShortBillingText(cycleItem)}
                        billedText={getBilledAtPerMonthText(
                            getSimplePriceString(currency, currentCheckout.withDiscountPerCycle),
                            cycleItem
                        )}
                        key={cycleItem}
                        currency={currency}
                        totalPerMonth={currentCheckout.withDiscountPerMonth}
                        totalWithoutPerMonth={currentCheckout.withoutDiscountPerMonth}
                        discountPercentage={currentCheckout.discountPercent}
                        upsell={(() => {
                            if (!upsell) {
                                return null;
                            }
                            const discount24months = upsell.mapping.discountPercent;
                            const discountPercentage = `${discount24months}%`;
                            const offText = getOffText(discountPercentage, getBillingCycleText(upsell.cycle) || '');
                            return (
                                cycleItem !== upsell.cycle &&
                                offText && (
                                    <button
                                        onClick={() => {
                                            onChangeCycle({
                                                cycle: upsell.cycle,
                                                upsellFrom: cycleItem,
                                                planIDs: upsell.mapping.planIDs,
                                            });
                                        }}
                                        className="color-primary bg-norm-weak text-center rounded w-full py-2 px-4"
                                    >
                                        {offText}
                                    </button>
                                )
                            );
                        })()}
                        extra={(() => {
                            if (
                                mode === 'vpn-pass-promotion' &&
                                currentCheckout.planIDs[PLANS.VPN_PASS_BUNDLE] &&
                                cycleItem === CYCLE.YEARLY
                            ) {
                                return (
                                    <div className="mt-4 flex flex-nowrap gap-2">
                                        <div>
                                            <PassLogo variant="glyph-only" size={8} />
                                        </div>
                                        <div className="flex-1 text-semibold color-weak text-sm">{getPassText()}</div>
                                    </div>
                                );
                            }
                            return null;
                        })()}
                        cta={
                            <Button
                                color="norm"
                                fullWidth
                                onClick={() =>
                                    onGetTheDeal({
                                        cycle: cycleItem,
                                        planIDs: currentCheckout.planIDs,
                                    })
                                }
                            >
                                {!currentCheckout.discountPercent
                                    ? c('Action').t`Continue`
                                    : c('Action').t`Get the deal`}
                            </Button>
                        }
                    />
                );
            })}
        </>
    );
};

export default CycleSelector;

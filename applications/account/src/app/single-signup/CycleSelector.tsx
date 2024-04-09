import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Radio } from '@proton/components/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import { CYCLE } from '@proton/shared/lib/constants';
import { SubscriptionCheckoutData } from '@proton/shared/lib/helpers/checkout';
import { Currency, CycleMapping } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import SaveLabel2 from './SaveLabel2';
import { getBillingCycleText, getOffText } from './helper';

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
    bg?: boolean;
}) => {
    return (
        <div
            className={clsx(
                'lg:flex-1 w-full pricing-box-content-cycle max-w-custom mx-auto lg:mx-0',
                orderGroup === 1 ? `order-0 lg:order-${orderGroup}` : `order-1 lg:order-${orderGroup}`
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
                                        {getSimplePriceString(currency, totalWithoutPerMonth, '')}
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
                                    {getSimplePriceString(currency, totalPerMonth, '')}
                                </span>
                            </div>

                            <div className="text-sm">
                                <div className="color-weak" id={`${cycle}-billed`}>
                                    {billedText}
                                </div>
                            </div>
                        </div>
                    </div>

                    {cta && selected && <div className="mt-4">{cta}</div>}
                </div>
            </div>
            {selected && upsell && !bg && <div className="mt-2">{upsell}</div>}
        </div>
    );
};

const CycleSelector = ({
    cycle,
    cycles,
    onChangeCycle,
    currency,
    onGetTheDeal,
    checkoutMapping,
    upsellCycle,
    bg,
}: {
    onGetTheDeal: (cycle: CYCLE) => void;
    cycle: CYCLE;
    currency: Currency;
    cycles: CYCLE[];
    upsellCycle?: CYCLE;
    onChangeCycle: (cycle: CYCLE, upsellFrom?: CYCLE) => void;
    checkoutMapping: CycleMapping<SubscriptionCheckoutData>;
    bg?: boolean;
}) => {
    const upsellMapping = upsellCycle ? checkoutMapping[upsellCycle] : undefined;
    if (!upsellMapping && upsellCycle) {
        return null;
    }
    const discount24months = upsellMapping?.discountPercent;
    const discountPercentage = `${discount24months}%`;
    const offText = upsellCycle ? getOffText(discountPercentage, getBillingCycleText(upsellCycle) || '') : '';
    let firstNonBestOffer = false;
    return (
        <>
            {cycles.map((cycleItem) => {
                const cycleMapping = checkoutMapping[cycleItem];
                if (!cycleMapping) {
                    return null;
                }
                const currentCheckout = cycleMapping;
                const bestOffer = cycleItem === upsellCycle;
                let orderGroup = 2;
                if (bestOffer) {
                    orderGroup = 1;
                } else if (!firstNonBestOffer) {
                    orderGroup = 0;
                    firstNonBestOffer = true;
                }
                return (
                    <CycleItemView
                        bg={bg}
                        cycle={cycleItem}
                        orderGroup={orderGroup}
                        headerText={bestOffer ? c('Header').t`Best deal` : undefined}
                        onSelect={() => {
                            onChangeCycle(cycleItem);
                        }}
                        highlightPrice={bestOffer}
                        selected={cycle === cycleItem}
                        text={getShortBillingText(cycleItem)}
                        billedText={getBilledAtPerMonthText(
                            getSimplePriceString(currency, currentCheckout.withDiscountPerCycle, ''),
                            cycleItem
                        )}
                        key={cycleItem}
                        currency={currency}
                        totalPerMonth={currentCheckout.withDiscountPerMonth}
                        totalWithoutPerMonth={currentCheckout.withoutDiscountPerMonth}
                        discountPercentage={currentCheckout.discountPercent}
                        upsell={
                            cycleItem !== upsellCycle &&
                            upsellCycle &&
                            offText && (
                                <button
                                    onClick={() => {
                                        onChangeCycle(upsellCycle, cycleItem);
                                    }}
                                    className="color-primary bg-norm-weak text-center rounded w-full py-2 px-4"
                                >
                                    {offText}
                                </button>
                            )
                        }
                        cta={
                            <Button color="norm" fullWidth onClick={() => onGetTheDeal(cycleItem)}>
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

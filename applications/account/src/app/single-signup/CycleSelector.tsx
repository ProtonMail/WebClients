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

import Guarantee from './Guarantee';
import SaveLabel2 from './SaveLabel2';
import { getBillingCycleText, getOffText } from './helper';

export const getBilledText = (cycle: CYCLE): string | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('Info').t`per month`;
        case CYCLE.YEARLY:
            return c('Info').t`per month, billed every 12 months`;
        case CYCLE.TWO_YEARS:
            return c('Info').t`per month, billed every 24 months`;
        case CYCLE.FIFTEEN:
            return c('Info').t`per month, billed every 15 months`;
        case CYCLE.THIRTY:
            return c('Info').t`per month, billed every 30 months`;
        default:
            return null;
    }
};

const CycleItemView = ({
    cycle,
    currency,
    text,
    billedText,
    headerText,
    totalPerMonth,
    totalWithoutPerMonth,
    highlightPrice,
    discountPercentage,
    selected,
    guarantee,
    onSelect,
    upsell,
    cta,
}: {
    cycle: CYCLE;
    currency: Currency;
    text: string;
    billedText: string | null;
    headerText: ReactNode;
    highlightPrice: boolean;
    totalPerMonth: number;
    totalWithoutPerMonth: number;
    discountPercentage: number;
    selected: boolean;
    guarantee: boolean;
    onSelect: () => void;
    upsell: ReactNode;
    cta: ReactNode;
}) => {
    return (
        <div
            className={clsx(
                'flex-item-fluid pricing-box-content-cycle max-w30e mx-auto lg:mx-0',
                !headerText && 'lg:mt-6'
            )}
        >
            {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events */}
            <div
                className={clsx(
                    'rounded border overflow-hidden',
                    selected ? 'border-primary border-2' : 'cursor-pointer'
                )}
                onClick={!selected ? onSelect : undefined}
            >
                {headerText && (
                    <div
                        className={clsx(
                            'text-uppercase text-center text-sm text-semibold py-1',
                            selected ? 'color-primary bg-norm-weak' : 'color-weak bg-weak'
                        )}
                    >
                        {headerText}
                    </div>
                )}
                <div className="p-4" data-testid={`plan-${cycle}`}>
                    <div>
                        <div className="flex flex-justify-space-between gap-1 flex-nowrap">
                            <div className="flex flex-align-items-center flex-nowrap">
                                <div className="mr-3">
                                    <Radio
                                        id={`${cycle}`}
                                        aria-labelledby={`${cycle}-text ${cycle}-save ${cycle}-price ${cycle}-billed ${cycle}-guarantee `}
                                        name="billing"
                                        checked={selected}
                                        readOnly
                                    />
                                </div>
                                <strong className="text-lg" id={`${cycle}-text`}>
                                    {text}
                                </strong>
                            </div>
                        </div>

                        <div id={`${cycle}-price`} className={clsx('flex flex-align-items-center flex-nowrap gap-2')}>
                            <span
                                className={clsx(
                                    'flex-item-noshrink',
                                    highlightPrice && 'color-primary',
                                    'text-bold h2'
                                )}
                            >
                                {getSimplePriceString(currency, totalPerMonth, '')}
                            </span>
                            {discountPercentage > 0 && (
                                <div className="flex flex-column flex-justify-center text-left">
                                    <div>
                                        <SaveLabel2 highlightPrice percent={discountPercentage} id={`${cycle}-save`} />
                                    </div>
                                    <span className="text-strike color-weak">
                                        {getSimplePriceString(currency, totalWithoutPerMonth, '')}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div className="text-sm">
                            <div className="color-weak" id={`${cycle}-billed`}>
                                {billedText}
                            </div>
                        </div>
                    </div>

                    {selected && (
                        <div>
                            {cta && <div className="mt-4">{cta}</div>}
                            {guarantee && (
                                <div className="text-sm mt-4 text-center" id={`${cycle}-guarantee`}>
                                    <Guarantee />
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
            {selected && upsell && <div className="mt-2">{upsell}</div>}
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
}: {
    onGetTheDeal: (cycle: CYCLE) => void;
    cycle: CYCLE;
    currency: Currency;
    cycles: CYCLE[];
    onChangeCycle: (cycle: CYCLE, upsellFrom?: CYCLE) => void;
    checkoutMapping: CycleMapping<SubscriptionCheckoutData>;
}) => {
    return (
        <>
            {cycles.map((cycleItem) => {
                const upsellCycle = CYCLE.TWO_YEARS;
                const discount24months = checkoutMapping[upsellCycle].discountPercent;
                const discountPercentage = `${discount24months}%`;
                const offText = getOffText(discountPercentage, getBillingCycleText(upsellCycle) || '');
                const currentCheckout = checkoutMapping[cycleItem] as SubscriptionCheckoutData;
                return (
                    <CycleItemView
                        cycle={cycleItem}
                        headerText={cycleItem === upsellCycle ? c('Header').t`Best deal` : undefined}
                        onSelect={() => {
                            onChangeCycle(cycleItem);
                        }}
                        guarantee={true}
                        highlightPrice={cycleItem === upsellCycle}
                        selected={cycle === cycleItem}
                        text={getShortBillingText(cycleItem)}
                        billedText={getBilledText(cycleItem)}
                        key={cycleItem}
                        currency={currency}
                        totalPerMonth={currentCheckout.withDiscountPerMonth}
                        totalWithoutPerMonth={currentCheckout.withoutDiscountPerMonth}
                        discountPercentage={currentCheckout.discountPercent}
                        upsell={
                            cycleItem !== upsellCycle && (
                                <button
                                    onClick={() => {
                                        onChangeCycle(upsellCycle, cycleItem);
                                    }}
                                    className="color-primary bg-norm-weak text-center rounded w100 py-2 px-4"
                                >
                                    {offText}
                                </button>
                            )
                        }
                        cta={
                            <Button color="norm" fullWidth onClick={() => onGetTheDeal(cycleItem)}>
                                {cycle === CYCLE.MONTHLY ? c('Action').t`Continue` : c('Action').t`Get the deal`}
                            </Button>
                        }
                    />
                );
            })}
        </>
    );
};

export default CycleSelector;

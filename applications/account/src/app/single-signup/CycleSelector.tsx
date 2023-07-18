import { ReactNode } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { Price, Radio } from '@proton/components/components';
import { getShortBillingText } from '@proton/components/containers/payments/helper';
import { CYCLE } from '@proton/shared/lib/constants';
import { getPricingFromPlanIDs, getTotalFromPricing } from '@proton/shared/lib/helpers/subscription';
import { Currency } from '@proton/shared/lib/interfaces';
import clsx from '@proton/utils/clsx';

import Guarantee from './Guarantee';
import { getBillingCycleText, getOffText } from './helper';

export const getBilledText = (cycle: CYCLE): string | null => {
    switch (cycle) {
        case CYCLE.MONTHLY:
            return c('Info').t`Billed every month`;
        case CYCLE.YEARLY:
            return c('Info').t`Billed every 12 months`;
        case CYCLE.TWO_YEARS:
            return c('Info').t`Billed every 24 months`;
        case CYCLE.FIFTEEN:
            return c('Info').t`Billed every 15 months`;
        case CYCLE.THIRTY:
            return c('Info').t`Billed every 30 months`;
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
    monthlySuffix,
    totalPerMonth,
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
    monthlySuffix: string;
    highlightPrice: boolean;
    totalPerMonth: number;
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
                <div className="p-4">
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
                            {discountPercentage > 0 && (
                                <div id={`${cycle}-save`} className="text-right mt-0.5 ml-2">
                                    <span className={clsx(highlightPrice ? 'color-success' : 'color-weak')}>
                                        {`− ${discountPercentage}%`}
                                    </span>
                                </div>
                            )}
                        </div>

                        <div id={`${cycle}-price`} className={clsx('pl-8', highlightPrice && 'color-primary')}>
                            <Price
                                currency={currency}
                                suffix={monthlySuffix}
                                amountClassName="text-bold h2"
                                currencyClassName="text-bold h2"
                                suffixClassName="color-weak"
                            >
                                {totalPerMonth}
                            </Price>
                        </div>
                    </div>

                    {selected && (
                        <div>
                            <div className="pl-8 text-sm">
                                <div className="color-weak" id={`${cycle}-billed`}>
                                    {billedText}
                                </div>
                            </div>
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
    pricing,
}: {
    onGetTheDeal: (cycle: CYCLE) => void;
    cycle: CYCLE;
    currency: Currency;
    cycles: CYCLE[];
    onChangeCycle: (cycle: CYCLE, upsellFrom?: CYCLE) => void;
    pricing: ReturnType<typeof getPricingFromPlanIDs>;
}) => {
    return (
        <>
            {cycles.map((cycleItem) => {
                const upsellCycle = CYCLE.TWO_YEARS;
                const totals = getTotalFromPricing(pricing, cycleItem);
                const discount24months = getTotalFromPricing(pricing, upsellCycle);
                const discountPercentage = `${discount24months.discountPercentage}%`;
                const offText = getOffText(discountPercentage, getBillingCycleText(upsellCycle) || '');
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
                        monthlySuffix={c('Suffix').t`/month`}
                        totalPerMonth={totals.totalPerMonth}
                        discountPercentage={totals.discountPercentage}
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

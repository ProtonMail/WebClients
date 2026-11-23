import type { ReactNode, RefObject } from 'react';
import { useLayoutEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { Href } from '@proton/atoms/Href/Href';
import { SkeletonLoader } from '@proton/atoms/SkeletonLoader/SkeletonLoader';
import type { PlanCardFeatureDefinition } from '@proton/components/containers/payments/features/interface';
import { PlanCardFeatureList } from '@proton/components/containers/payments/subscription/PlanCardFeatures';
import {
    getShortBillingText,
    getTotalBillingText,
} from '@proton/components/containers/payments/subscription/helpers/getTotalBillingText';
import { IcChevronDown } from '@proton/icons/icons/IcChevronDown';
import type { PaymentsCheckoutUI } from '@proton/payments/core/checkout';
import type { Currency } from '@proton/payments/core/interface';
import { getSimplePriceString } from '@proton/payments/core/price-format';
import clsx from '@proton/utils/clsx';

import SaveLabel2 from './SaveLabel2';
import type { PlanInformation } from './getPlanInformation';

import './MobilePlanBar.scss';

/** Height of the bar, so the page can reserve space for it and keep its end reachable. */
const BLOCK_SIZE_PROPERTY = '--signup-v1-mobile-bar-block-size';
const detailsId = 'signup-v1-mobile-plan-details';

/** Keeps the element's height in a CSS custom property on the document root. */
const useReservedBlockSize = (ref: RefObject<HTMLElement | null>, property: string) => {
    useLayoutEffect(() => {
        const element = ref.current;
        if (!element) {
            return;
        }
        const root = document.documentElement;
        const update = () => root.style.setProperty(property, `${element.offsetHeight}px`);
        update();
        const observer = new ResizeObserver(update);
        observer.observe(element);
        return () => {
            observer.disconnect();
            root.style.removeProperty(property);
        };
    }, [property]);
};

const Loader = () => <SkeletonLoader width="4em" index={0} />;

const Features = ({ features }: { features: PlanCardFeatureDefinition[] }) => (
    <PlanCardFeatureList
        odd={false}
        margin={false}
        features={features}
        icon={false}
        highlight={false}
        iconSize={4}
        className="gap-2"
    />
);

interface DetailsProps {
    open: boolean;
    planInformation: PlanInformation;
    checkout: PaymentsCheckoutUI;
    changePlanHref: string;
}

/** Panel that expands above the bar with the billing, a link to change the plan and the plan features. */
const Details = ({ open, planInformation, checkout, changePlanHref }: DetailsProps) => (
    <div
        id={detailsId}
        className={clsx('signup-v1-mobile-bar-details', open && 'signup-v1-mobile-bar-details--open')}
        aria-hidden={!open}
    >
        <div className="signup-v1-mobile-bar-details-inner">
            <div className="px-6 pt-4 pb-2">
                <div className="flex justify-space-between items-center gap-2">
                    <span className="text-semibold">
                        {getTotalBillingText(checkout.cycle, checkout.planIDs, { excludingTax: false })}
                    </span>
                    <Href href={changePlanHref} tabIndex={open ? undefined : -1}>
                        {c('Action').t`Change plan`}
                    </Href>
                </div>
                <div className="border-top border-weak my-3" />
                <Features features={planInformation.features} />
                {planInformation.bundle?.map(({ title, features }) => (
                    <div key={title} className="mt-3">
                        <p className="m-0 mb-2 text-semibold">{title}</p>
                        <Features features={features} />
                    </div>
                ))}
            </div>
        </div>
    </div>
);

/** Monthly price, with the price before discount and the discount when there is one. */
const MonthlyPrice = ({ currency, checkout }: { currency: Currency; checkout: PaymentsCheckoutUI }) => {
    const { discountPercent, withDiscountPerMonth, withoutDiscountPerMonth } = checkout;
    const hasDiscount = discountPercent > 0;

    return (
        <>
            {getSimplePriceString(currency, withDiscountPerMonth)}
            {hasDiscount && (
                <>
                    {' '}
                    <span className="text-strike">{getSimplePriceString(currency, withoutDiscountPerMonth)}</span>
                </>
            )}
            {c('Suffix').t`/month`}
            {hasDiscount && (
                <>
                    {' '}
                    <SaveLabel2 className="text-sm inline-block" highlightPrice dir="ltr">
                        {`− ${discountPercent}%`}
                    </SaveLabel2>
                </>
            )}
        </>
    );
};

interface Props {
    planInformation: PlanInformation;
    currency: Currency;
    checkout: PaymentsCheckoutUI;
    loading: boolean;
    upsellToggle: ReactNode;
    changePlanHref: string;
    children: ReactNode;
}

/**
 * Bottom bar of the mobile checkout: the selected plan, whose details expand above it, and the pay button.
 * It stays fixed at the bottom of the viewport so the pay button is always reachable.
 */
const MobilePlanBar = ({
    planInformation,
    currency,
    checkout,
    loading,
    upsellToggle,
    changePlanHref,
    children,
}: Props) => {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);
    useReservedBlockSize(ref, BLOCK_SIZE_PROPERTY);

    return (
        <div ref={ref} className="signup-v1-mobile-bar bg-norm border-top border-weak" data-testid="mobile-plan-bar">
            <Details
                open={open}
                planInformation={planInformation}
                checkout={checkout}
                changePlanHref={changePlanHref}
            />
            <div className="flex flex-nowrap items-center gap-3 px-6 py-2">
                <div className="shrink-0">{planInformation.logo}</div>
                <div className="flex-1 min-w-0">
                    <div>
                        <span className="text-rg text-bold">{planInformation.title}</span>
                        <span className="text-sm color-weak text-no-wrap">
                            {' · '}
                            {getShortBillingText(checkout.cycle, checkout.planIDs)}
                        </span>
                    </div>
                    <div className="text-sm color-weak">
                        {loading ? <Loader /> : <MonthlyPrice currency={currency} checkout={checkout} />}
                    </div>
                </div>
                <div className="shrink-0 flex flex-nowrap items-center">
                    <span className="text-rg text-bold">
                        {loading ? <Loader /> : getSimplePriceString(currency, checkout.amountDue)}
                    </span>
                    <button
                        type="button"
                        className="signup-v1-mobile-bar-toggle color-norm"
                        aria-label={open ? c('Action').t`Hide plan details` : c('Action').t`Show plan details`}
                        aria-expanded={open}
                        aria-controls={detailsId}
                        onClick={() => setOpen((value) => !value)}
                        data-testid="mobile-plan-bar-toggle"
                    >
                        <IcChevronDown
                            className={clsx(
                                'signup-v1-mobile-bar-chevron',
                                open && 'signup-v1-mobile-bar-chevron--open'
                            )}
                        />
                    </button>
                </div>
            </div>
            {upsellToggle && (
                <>
                    <div className="mx-6 border-top border-weak" />
                    <div className="px-4">{upsellToggle}</div>
                </>
            )}
            <div className="px-6 pt-2">{children}</div>
        </div>
    );
};

export default MobilePlanBar;

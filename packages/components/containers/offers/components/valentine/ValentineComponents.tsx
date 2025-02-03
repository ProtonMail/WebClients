import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Icon from '@proton/components/components/icon/Icon';
import ProtonLogo from '@proton/components/components/logo/ProtonLogo';
import Price from '@proton/components/components/price/Price';
import StripedItem from '@proton/components/components/stripedList/StripedItem';
import { StripedList } from '@proton/components/components/stripedList/StripedList';
import { useTheme } from '@proton/components/containers/themes/ThemeProvider';
import { type Currency } from '@proton/payments';
import clsx from '@proton/utils/clsx';

import { getDealMonthDurationText } from '../../helpers/offerCopies';
import { type DealWithPrices } from '../../interface';
import protonLogo from './protonLogo.svg';

interface HeaderProps {
    salePercentage: string;
}

export const ValentineHeader = ({ salePercentage }: HeaderProps) => {
    const theme = useTheme();

    return (
        <header className="mb-6">
            {theme.information.dark ? (
                <ProtonLogo color="invert" className="z-1" />
            ) : (
                <img src={protonLogo} alt="" className="mb-6 z-1" />
            )}
            <h2 className="text-bold valentine-text">
                {c('Valentine_2025: Offer').t`Valentine's deal:`} <br />
                {c('Valentine_2025: Offer').t`${salePercentage}% off for you +1`}
            </h2>
        </header>
    );
};

interface PartnerProps {
    dealName: string;
    salePercentage: string;
}

export const ValentinePartnerCoupon = ({ dealName, salePercentage }: PartnerProps) => {
    const theme = useTheme();

    return (
        <section className="py-3 px-3 mb-4 gap-4 rounded-lg flex flex-row items-center relative valentine-text valentine-background">
            <Icon name="plus" size={7} className="shrink-0" />
            <div className="flex flex-1 flex-column">
                <p className="m-0 text-semibold text-lg">{c('Valentine_2025: Offer')
                    .t`Double the love, half the price`}</p>
                <p className="m-0">{c('Valentine_2025: Offer')
                    .t`Get 1 year of ${dealName} at ${salePercentage}% off — plus a gift code to share the same deal with a friend`}</p>
            </div>
            <p
                className={clsx(
                    'text-sm rounded-full inline-block px-3 py-0.5 m-0 text-semibold text-uppercase absolute top-0 right-0 off-pill',
                    theme.information.dark ? 'color-norm' : 'color-invert'
                )}
            >{c('Valentine_2025: Offer').t`${salePercentage}% off`}</p>
        </section>
    );
};

interface PricingProps {
    currency: Currency;
    deal: DealWithPrices;
}

export const ValentinePricing = ({ currency, deal }: PricingProps) => {
    const {
        dealName,
        prices: { withCoupon, withoutCouponMonthly },
        cycle,
    } = deal;

    const durationDeal = getDealMonthDurationText(cycle);

    return (
        <>
            <div className="mb-4">
                <p className="block text-4xl m-0 text-bold">{dealName}</p>
                <p className="color-weak m-0 block">{c('Valentine_2025: Offers').jt`for ${durationDeal}`}</p>
            </div>
            <div className="mb-4">
                <div>
                    <Price currency={currency} className="text-xxl text-bold" isDisplayedInSentence>
                        {withCoupon / cycle}
                    </Price>
                    <span className="m-0 text-lg">{c('Valentine_2025: Offers').t`/ month`}</span>
                </div>
                <Price
                    className="text-strike color-weak offer-regular-price relative"
                    currency={currency}
                    suffix={c('Valentine_2025: Offers').t`/ month`}
                >
                    {withoutCouponMonthly}
                </Price>
            </div>
        </>
    );
};

interface CTAProps {
    onClick: () => void;
}

export const ValentineCTA = ({ onClick }: CTAProps) => {
    return (
        <Button size="large" fullWidth color="norm" className="text-semibold gradient-highlight" onClick={onClick}>
            {c('Valentine_2025: Offer').t`Get the deal`}
        </Button>
    );
};

interface FeatureProps {
    features: {
        name: string;
        tooltip?: string;
    }[];
}

export const ValentineFeatureList = ({ features }: FeatureProps) => {
    return (
        <StripedList alternate="odd" className="my-4 mb-6">
            {features.map((feature) => (
                <StripedItem
                    key={feature.name}
                    left={<Icon name="checkmark" />}
                    tooltip={feature.tooltip}
                    rightAlignedTooltip
                >
                    {feature.name}
                </StripedItem>
            ))}
        </StripedList>
    );
};

export const ValentineFooter = () => {
    return (
        <p className="color-weak text-sm m-0 text-center">{c('Valentine_2025: Offer')
            .t`Discounts are based on standard monthly pricing. At the end of the billing cycle, your subscription will renew at the standard annual rate.`}</p>
    );
};

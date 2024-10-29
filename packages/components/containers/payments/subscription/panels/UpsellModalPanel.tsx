import { c } from 'ttag';

import { Button, Pill } from '@proton/atoms';
import type { IconName } from '@proton/components';
import { Icon, Price, StripedItem, StripedList } from '@proton/components';
import { type Currency } from '@proton/payments';
import clsx from '@proton/utils/clsx';

type ConditionalProps =
    | {
          isUpsell: true;
          currency: Currency;
          downgradedPlanAmount: number;
          downgradedPlanName: string;
          upsellPlanAmount: number;
          upsellSavings: string;
      }
    | {
          isUpsell: false;
          currency?: never;
          downgradedPlanAmount?: never;
          downgradedPlanName?: never;
          upsellPlanAmount?: never;
          upsellSavings?: never;
      };

type Features = {
    icon: IconName;
    text: string;
}[];

type UpsellModalPanelProps = {
    features: Features;
    onClick: () => void;
    planName: string;
} & ConditionalProps;

export const UpsellModalPanel = ({
    currency,
    downgradedPlanAmount,
    downgradedPlanName,
    features,
    isUpsell,
    onClick,
    planName,
    upsellPlanAmount,
    upsellSavings,
}: UpsellModalPanelProps) => (
    <div
        className={clsx(
            `flex flex-row md:flex-column gap-4 md:flex-1 items-stretch border rounded px-6 py-5`,
            isUpsell ? 'border-primary border-recommended' : 'border-weak border-strong'
        )}
    >
        {isUpsell ? (
            <div className="color-hint text-strike">
                <h2 className="text-semibold text-sm">{downgradedPlanName}</h2>
                <div className="text-xs">
                    <Price className="mr-1 text-strike text-xl" currency={currency}>
                        {downgradedPlanAmount}
                    </Price>
                    {c('Suffix').t`/month`}
                </div>
            </div>
        ) : null}
        <div>
            <h2 className="text-bold text-rg">
                {planName}
                {upsellSavings ? (
                    <Pill
                        backgroundColor="var(--signal-success)"
                        className="ml-2 text-semibold text-uppercase"
                        color="var(--text-invert)"
                    >
                        {upsellSavings}
                    </Pill>
                ) : null}
            </h2>
            {isUpsell ? (
                <div className="color-weak mb-2 text-sm">
                    <Price className="color-norm h2 mr-1" currency={currency}>
                        {upsellPlanAmount}
                    </Price>
                    {c('Suffix').t`/month`}
                </div>
            ) : (
                <p className="color-weak text-break mt-2">{c('Cancellation upsell')
                    .t`Our basic, free plan with end-to-end encrypted email and storage. No premium features included.`}</p>
            )}
        </div>
        <StripedList className="w-full my-0 md:my-2" alternate="odd">
            {features.map(({ icon, text }) => (
                <StripedItem key={text} left={<Icon name={icon} className="color-primary" />}>
                    {text}
                </StripedItem>
            ))}
        </StripedList>
        <Button
            className="mt-auto"
            color={isUpsell ? 'norm' : 'danger'}
            fullWidth
            onClick={onClick}
            shape="solid"
            size="large"
        >
            {isUpsell ? c('Cancellation upsell').t`Try ${planName}` : c('Cancellation upsell').t`Cancel and downgrade`}
        </Button>
    </div>
);

import type { ReactElement } from 'react';
import { cloneElement, useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { Scroll } from '@proton/atoms/Scroll/Scroll';
import type { ModalProps } from '@proton/components';
import { ModalTwo, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { getSimplePriceString } from '@proton/components/components/price/helper';
import { TelemetryAccountSignupEvents } from '@proton/shared/lib/api/telemetry';
import noop from '@proton/utils/noop';

import type { CheckTrialPriceResult } from '../single-signup-v2/modals/Trial2024UpsellModal';
import swissFlag from './flag.svg';
import type { Measure } from './interface';
import RatingsSection from './ratings/RatingsSection';

interface DollarOfferModalProps extends ModalProps {
    checkTrialResult: CheckTrialPriceResult;
    priceWithoutDiscountPerMonth: number | undefined;
    onGetDeal: () => void;
    onContinueFree: () => void;
    img: ReactElement;
    measure: Measure;
}

const DollarOfferModal = ({
    priceWithoutDiscountPerMonth,
    checkTrialResult,
    onGetDeal,
    onContinueFree,
    img,
    measure,
    ...rest
}: DollarOfferModalProps) => {
    const { currency, checkResult, fullAmount } = checkTrialResult;
    const offerPrice = getSimplePriceString(currency, checkResult.AmountDue);
    const regularPrice = getSimplePriceString(currency, priceWithoutDiscountPerMonth ?? fullAmount);

    // Track modal view on mount
    useEffect(() => {
        void measure({
            event: TelemetryAccountSignupEvents.interactUpsell,
            dimensions: {
                upsell_to: 'dollar_offer_modal_view',
                upsell_from: 'free_signup_click',
            },
        });
    }, []);

    const handleGetDealClick = async () => {
        // Wait for telemetry to complete before redirect
        await measure({
            event: TelemetryAccountSignupEvents.interactUpsell,
            dimensions: {
                upsell_to: 'vpn2024_dollar_offer_accepted',
                upsell_from: 'dollar_offer_modal',
            },
        }).catch(noop);
        onGetDeal();
    };

    const handleContinueFreeClick = async () => {
        // Wait for telemetry to complete before redirect
        await measure({
            event: TelemetryAccountSignupEvents.planSelect,
            dimensions: { plan: 'free_from_dollar_offer' as any },
        }).catch(noop);
        onContinueFree();
    };

    return (
        <ModalTwo {...rest} size="xlarge">
            <Scroll>
                <div className="flex flex-nowrap">
                    <div className="flex-1 hidden lg:flex">
                        {cloneElement(img, {
                            className: 'h-full w-full',
                            style: {
                                objectFit: 'cover',
                            },
                        })}
                    </div>

                    <div className="flex-1">
                        <ModalTwoHeader />
                        <div className={'px-8'}>
                            <div className="flex flex-column gap-6">
                                <div>
                                    <h1 className="text-4xl text-semibold mb-2">
                                        {c('dollar_offer').t`Get VPN Plus for only ${offerPrice}`}
                                    </h1>
                                    <p className="text-lg color-weak m-0">
                                        {c('dollar_offer').t`Special offer: Save 90% off our premium plan`}
                                    </p>
                                </div>

                                <div className="flex flex-column gap-3">
                                    <Button
                                        size="large"
                                        color="norm"
                                        shape="solid"
                                        fullWidth
                                        onClick={handleGetDealClick}
                                    >
                                        {c('dollar_offer: Action').t`Get the deal`}
                                    </Button>
                                    <Button
                                        size="large"
                                        color="norm"
                                        shape="outline"
                                        fullWidth
                                        onClick={handleContinueFreeClick}
                                    >
                                        {c('dollar_offer: Action').t`Continue with free`}
                                    </Button>
                                </div>

                                <div className="border-top border-weak pt-6">
                                    <RatingsSection className="mb-4" />
                                    <div className="flex items-center justify-center gap-2 text-sm color-weak">
                                        <img width="20" alt="" src={swissFlag} className="rounded-sm" />
                                        <span>{c('dollar_offer').t`Protected by Swiss privacy laws`}</span>
                                    </div>
                                    <div className="text-center mt-4">
                                        <p className="text-sm color-weak m-0">
                                            {c('dollar_offer')
                                                .t`${offerPrice} for the first month. Renews at ${regularPrice}/month, cancel anytime.`}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <ModalTwoFooter />
                    </div>
                </div>
            </Scroll>
        </ModalTwo>
    );
};

export default DollarOfferModal;

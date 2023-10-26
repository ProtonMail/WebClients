import { useRef, useState } from 'react';

import { c } from 'ttag';

import { OfferModal, useSubscriptionModal, useUser } from '@proton/components';
import {
    useBlackFridayVPN1Deal2022,
    useBlackFridayVPN2Deal2022,
    useBlackFridayVPN3Deal2022,
    useFetchOffer,
} from '@proton/components/containers/offers';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { replaceUrl } from '@proton/shared/lib/helpers/browser';
import { Currency } from '@proton/shared/lib/interfaces';
import { canPay } from '@proton/shared/lib/user/helpers';

import broadcast, { MessageType } from '../broadcast';
import LiteBox from '../components/LiteBox';
import LiteLoaderPage from '../components/LiteLoaderPage';
import SubscribeAccountDone from '../components/SubscribeAccountDone';
import { SubscribeType } from '../types/SubscribeType';

const VpnBlackFriday = ({ redirect, fullscreen }: { redirect?: string; fullscreen?: boolean }) => {
    const [user] = useUser();
    const [open, loading] = useSubscriptionModal();
    const [isOfferOpen, setIsOfferOpen] = useState(true);
    const [currency, setCurrency] = useState<Currency>(user.Currency || DEFAULT_CURRENCY);
    const [type, setType] = useState<SubscribeType | undefined>(undefined);
    const onceCloseRef = useRef(false);

    const canEdit = canPay(user);

    const blackFridayVPN1Deal2022 = useBlackFridayVPN1Deal2022();
    const blackFridayVPN2Deal2022 = useBlackFridayVPN2Deal2022();
    const blackFridayVPN3Deal2022 = useBlackFridayVPN3Deal2022();

    const allOffers = [blackFridayVPN1Deal2022, blackFridayVPN2Deal2022, blackFridayVPN3Deal2022];

    const validOffer = allOffers.find((offer) => !offer.isLoading && offer.isValid);
    const offerConfig = validOffer?.config;
    const isLoadingOfferConfig = allOffers.some((offer) => offer.isLoading);

    const [offer, isLoadingOfferPrices] = useFetchOffer({
        offerConfig,
        currency,
    });

    const isLoading = isLoadingOfferConfig || (isLoadingOfferPrices && !offer) || loading || !user;

    if (isLoading) {
        return <LiteLoaderPage />;
    }

    // Error in usage (this action is not meant to be shown if it cannot be triggered, so untranslated.
    if (!canEdit) {
        return <LiteBox>Please contact the administrator of the organization to manage the subscription</LiteBox>;
    }

    if (type === SubscribeType.Subscribed || type === SubscribeType.Closed) {
        return (
            <LiteBox>
                <SubscribeAccountDone type={type} />
            </LiteBox>
        );
    }

    if (offerConfig && offer) {
        return (
            <OfferModal
                currency={currency}
                onChangeCurrency={setCurrency}
                offer={offer}
                offerConfig={offerConfig}
                modalProps={{ open: isOfferOpen, fullscreen }}
                onSelectDeal={(_, deal, currency) => {
                    const handleNotify = (type: SubscribeType) => {
                        if (onceCloseRef.current) {
                            return;
                        }
                        setType(type);
                        onceCloseRef.current = true;
                        if (redirect) {
                            replaceUrl(redirect);
                            return;
                        }
                        broadcast({ type: MessageType.CLOSE });
                    };

                    const handleClose = () => {
                        handleNotify(SubscribeType.Closed);
                    };

                    const handleSuccess = () => {
                        handleNotify(SubscribeType.Subscribed);
                    };

                    setIsOfferOpen(false);

                    open({
                        step: SUBSCRIPTION_STEPS.CHECKOUT,
                        disablePlanSelection: true,
                        plan: deal.planName,
                        planIDs: { [deal.planName]: 1 },
                        cycle: deal.cycle,
                        coupon: deal.couponCode,
                        currency,
                        disableThanksStep: true,
                        disableCycleSelector: true,
                        onSubscribed: handleSuccess,
                        onUnsubscribed: handleSuccess,
                        onClose: handleClose,
                        fullscreen,
                        metrics: {
                            source: 'lite-vpn-bf',
                        },
                    });
                }}
            />
        );
    }
    return <LiteBox>{c('specialoffer: Info').t`No available offers found.`}</LiteBox>;
};

export default VpnBlackFriday;

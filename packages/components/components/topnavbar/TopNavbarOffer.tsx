import { useEffect, useRef, useState } from 'react';

import { c } from 'ttag';

import { domIsBusy } from '@proton/shared/lib/busy';
import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { useModalState } from '../../components/modalTwo';
import { OfferModal } from '../../containers';
import useFetchOffer from '../../containers/offers/hooks/useFetchOffer';
import useOfferFlags from '../../containers/offers/hooks/useOfferFlags';
import { OfferConfig } from '../../containers/offers/interface';
import { useUser } from '../../hooks';
import Icon from '../icon/Icon';
import CircleLoader from '../loader/CircleLoader';
import TopNavbarListItem from './TopNavbarListItem';
import TopNavbarListItemButton from './TopNavbarListItemButton';

interface Props {
    offerConfig: OfferConfig;
}

const TopNavbarOffer = ({ offerConfig }: Props) => {
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();
    const { isVisited, loading } = useOfferFlags(offerConfig);
    const onceRef = useRef(false);
    const [user] = useUser();
    const [fetchOffer, setFetchOffer] = useState(false);

    const defaultCurrency = user?.Currency || DEFAULT_CURRENCY;
    const [currency, setCurrency] = useState<Currency>(defaultCurrency);

    const [offer, loadingOffer] = useFetchOffer({
        offerConfig: fetchOffer ? offerConfig : undefined,
        currency,
        onError: () => {
            // This is like a retry. Resetting the offer config so that the calls get retried if the user clicks the button again.
            setFetchOffer(false);
        },
    });

    useEffect(() => {
        if (loading || !offerConfig.autoPopUp || isVisited || onceRef.current) {
            return;
        }
        const timeout = setTimeout(() => {
            // Unfortunately we have no good way of dealing with race conditions in modals opening.
            // So this is primarily trying to solve this modal not being opened when welcome modal is open, but
            // it may also work generically since loading may take some time and user has already become interactive
            // with the page, in which case we probably don't want to disturb the user.
            if (!domIsBusy()) {
                onceRef.current = true;
                setFetchOffer(true);
                setOfferModalOpen(true);
            }
            // Arbitrary timeout to see if any other automatic modals would get opened
        }, 100);
        return () => {
            clearTimeout(timeout);
        };
    }, [loading]);

    return (
        <>
            <TopNavbarListItem collapsedOnDesktop={false} noShrink>
                <TopNavbarListItemButton
                    as="button"
                    type="button"
                    color="norm"
                    shape="solid"
                    icon={<Icon name="bag-percent" />}
                    text={offerConfig.getCTAContent?.() || c('specialoffer: Action').t`Special offer`}
                    onClick={() => {
                        setOfferModalOpen(true);
                        setFetchOffer(true);
                    }}
                    data-testid="cta:special-offer"
                >
                    {loadingOffer && !offer && (
                        <span className="ml0-5">
                            <CircleLoader />
                        </span>
                    )}
                </TopNavbarListItemButton>
            </TopNavbarListItem>
            {renderOfferModal && offer && (
                <OfferModal
                    currency={currency}
                    onChangeCurrency={setCurrency}
                    offer={offer}
                    offerConfig={offerConfig}
                    modalProps={offerModalProps}
                    onClose={() => {
                        setFetchOffer(false);
                    }}
                />
            )}
        </>
    );
};

export default TopNavbarOffer;

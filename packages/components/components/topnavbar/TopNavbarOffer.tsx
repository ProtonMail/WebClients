import { useEffect, useRef, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { DEFAULT_CURRENCY } from '@proton/shared/lib/constants';
import { Currency } from '@proton/shared/lib/interfaces';

import { useModalState } from '../../components/modalTwo';
import { OfferModal } from '../../containers';
import useFetchOffer from '../../containers/offers/hooks/useFetchOffer';
import useOfferFlags from '../../containers/offers/hooks/useOfferFlags';
import { OfferConfig } from '../../containers/offers/interface';
import { useUser, useWelcomeFlags } from '../../hooks';
import Icon from '../icon/Icon';
import CircleLoader from '../loader/CircleLoader';
import TopNavbarListItem from './TopNavbarListItem';
import TopNavbarListItemButton from './TopNavbarListItemButton';

interface Props {
    offerConfig: OfferConfig;
    ignoreVisited?: boolean;
    ignoreOnboarding?: boolean;
}

const TopNavbarOffer = ({ offerConfig, ignoreVisited, ignoreOnboarding }: Props) => {
    const [offerModalProps, setOfferModalOpen, renderOfferModal] = useModalState();
    const { isVisited, loading } = useOfferFlags(offerConfig);
    const onceRef = useRef(false);
    const [user] = useUser();
    const history = useHistory();
    const location = useLocation();
    const [fetchOffer, setFetchOffer] = useState(false);
    const [welcomeFlags] = useWelcomeFlags();

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
        const searchParams = new URLSearchParams(location.search);
        const autoOffer = searchParams.get('offer') === 'auto';
        const combinedIgnoreVisited = ignoreVisited || autoOffer;
        // No welcome modal in account
        if (
            loading ||
            !offerConfig.autoPopUp ||
            (isVisited && !combinedIgnoreVisited) ||
            onceRef.current ||
            // Only hide the autopopup during the welcome flow, ignore if other modals may be open
            // and re-trigger it when the welcome flow completes.
            (!welcomeFlags.isDone && !ignoreOnboarding)
        ) {
            return;
        }
        if (autoOffer) {
            history.replace({ search: undefined });
        }
        onceRef.current = true;
        setFetchOffer(true);
        setOfferModalOpen(true);
    }, [loading, welcomeFlags.isDone]);

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
                    modalProps={{
                        ...offerModalProps,
                        onClose: () => {
                            offerModalProps.onClose?.();
                            setFetchOffer(false);
                        },
                    }}
                />
            )}
        </>
    );
};

export default TopNavbarOffer;

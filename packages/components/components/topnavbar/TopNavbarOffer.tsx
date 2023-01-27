import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import { CircleLoader } from '@proton/atoms';
import useOfferFlags from '@proton/components/containers/offers/hooks/useOfferFlags';
import { CYCLE, OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';

import { OfferModal, useOfferModal } from '../../containers';
import { OfferConfig } from '../../containers/offers/interface';
import { subscriptionModalClassName } from '../../containers/payments/subscription/constants';
import { useSubscription, useUser, useWelcomeFlags } from '../../hooks';
import Icon from '../icon/Icon';
import TopNavbarListItem from './TopNavbarListItem';
import TopNavbarListItemButton from './TopNavbarListItemButton';

interface Props {
    offerConfig: OfferConfig;
    ignoreVisited?: boolean;
    ignoreOnboarding?: boolean;
}

const TopNavbarOffer = ({ offerConfig, ignoreVisited, ignoreOnboarding }: Props) => {
    const [welcomeFlags] = useWelcomeFlags();
    const onceRef = useRef(false);
    const [user] = useUser();
    const [subscription, loadingSubscription] = useSubscription();
    const history = useHistory();
    const location = useLocation();
    const { isVisited, loading } = useOfferFlags(offerConfig);
    const {
        offer,
        loadingOffer,
        setFetchOffer,
        renderOfferModal,
        offerModalProps,
        setOfferModalOpen,
        currency,
        onChangeCurrency,
    } = useOfferModal(offerConfig);

    // Listen custom event to open offer modal
    useEffect(() => {
        const open = () => {
            if (renderOfferModal) {
                return;
            }
            setOfferModalOpen(true);
            setFetchOffer(true);
        };
        document.addEventListener(OPEN_OFFER_MODAL_EVENT, open);
        return () => {
            document.removeEventListener(OPEN_OFFER_MODAL_EVENT, open);
        };
    }, [renderOfferModal]);

    // Auto-popup offer modal
    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        const autoOffer = searchParams.get('offer') === 'auto';
        const plan = searchParams.get('plan');

        const combinedIgnoreVisited = ignoreVisited || autoOffer;
        // No welcome modal in account
        if (
            loading ||
            loadingSubscription ||
            !offerConfig.autoPopUp ||
            (isVisited && !combinedIgnoreVisited) ||
            onceRef.current ||
            // Hide for paid mail cycle 12/24
            (user.hasPaidMail &&
                [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(subscription?.Cycle) &&
                !combinedIgnoreVisited) ||
            // Hide the autopopup during the welcome flow and re-trigger it when the welcome flow completes.
            (!welcomeFlags.isDone && !ignoreOnboarding) ||
            // If the subscription modal is open. Explicitly not checking if any modal is open since it intereferes with the onboarding modal.
            document.querySelector(`.${subscriptionModalClassName}`) !== null ||
            // Trying to catch if the automatic subscription modal will get opened.
            !!plan
        ) {
            return;
        }
        if (autoOffer) {
            history.replace({ search: undefined });
        }
        onceRef.current = true;
        setFetchOffer(true);
        setOfferModalOpen(true);
    }, [loading, loadingSubscription, user.hasPaidMail, subscription, welcomeFlags.isDone]);

    return (
        <>
            <TopNavbarListItem collapsedOnDesktop={false} noShrink>
                <TopNavbarListItemButton
                    as="button"
                    type="button"
                    color="norm"
                    shape={offerConfig.shapeButton || 'solid'}
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
                    onChangeCurrency={onChangeCurrency}
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

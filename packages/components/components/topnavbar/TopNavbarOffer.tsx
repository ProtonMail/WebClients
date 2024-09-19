import { useEffect, useRef } from 'react';
import { useHistory, useLocation } from 'react-router-dom';

import { c } from 'ttag';

import useOfferFlags from '@proton/components/containers/offers/hooks/useOfferFlags';
import type { APP_NAMES } from '@proton/shared/lib/constants';
import { APPS, CYCLE, OPEN_OFFER_MODAL_EVENT } from '@proton/shared/lib/constants';
import clsx from '@proton/utils/clsx';

import OfferModal from '../../containers/offers/components/OfferModal';
import useOfferModal from '../../containers/offers/hooks/useOfferModal';
import type { OfferConfig } from '../../containers/offers/interface';
import { subscriptionModalClassName } from '../../containers/payments/subscription/constants';
import { useActiveBreakpoint, useSubscription, useUser, useWelcomeFlags } from '../../hooks';
import { PromotionButton } from '../button/PromotionButton';
import TopNabarOfferSubscriptionReminder from './TopNavBarOfferSubscriptionReminder';
import TopNavbarListItem from './TopNavbarListItem';

interface Props {
    app: APP_NAMES;
    offerConfig: OfferConfig;
    ignoreVisited?: boolean;
    ignoreOnboarding?: boolean;
}

const TopNavbarOffer = ({ app, offerConfig, ignoreVisited, ignoreOnboarding }: Props) => {
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

    const { viewportWidth } = useActiveBreakpoint();

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

        // Common conditions that would prevent the offer modal from showing
        if (
            loading ||
            loadingSubscription ||
            !offerConfig.autoPopUp ||
            // Hide the autopopup during the welcome flow and re-trigger it when the welcome flow completes.
            (!welcomeFlags.isDone && !ignoreOnboarding) ||
            // If the subscription modal is open. Explicitly not checking if any modal is open since it intereferes with the onboarding modal.
            document.querySelector(`.${subscriptionModalClassName}`) !== null ||
            // Trying to catch if the automatic subscription modal will get opened.
            !!plan
        ) {
            return;
        }

        // The subscription reminder offer could be offered again since it runs all the time and is displayed every 6 months
        if (offerConfig.ID === 'subscription-reminder') {
            setOfferModalOpen(true);
            return;
        }

        const combinedIgnoreVisited = ignoreVisited || autoOffer;
        if (
            (isVisited && !combinedIgnoreVisited) ||
            onceRef.current ||
            // Hide for paid mail cycle 12/24
            (user.hasPaidMail &&
                [CYCLE.YEARLY, CYCLE.TWO_YEARS].includes(subscription?.Cycle as any) &&
                !combinedIgnoreVisited)
        ) {
            return;
        }

        if (autoOffer) {
            history.replace({ search: undefined });
        }

        // If we reach this points, a regular offer modal should be displayed
        onceRef.current = true;
        setFetchOffer(true);
        setOfferModalOpen(true);
    }, [loading, loadingSubscription, user.hasPaidMail, subscription, welcomeFlags.isDone]);

    const CTAText = offerConfig.topButton?.getCTAContent?.() || c('specialoffer: Action').t`Special offer`;
    const upgradeIcon =
        CTAText.length > 20 && viewportWidth['>=large'] ? undefined : offerConfig.topButton?.icon || 'bag-percent';

    // The subscription reminder spotlight is displayed instead of the regular offer modal
    if (offerConfig.ID === 'subscription-reminder') {
        return (
            <TopNabarOfferSubscriptionReminder
                app={app}
                currency={currency}
                onChangeCurrency={onChangeCurrency}
                offerConfig={offerConfig}
                offer={offer}
                modalProps={{
                    ...offerModalProps,
                    onClose: () => {
                        offerModalProps.onClose?.();
                        setFetchOffer(false);
                    },
                }}
            />
        );
    }

    return (
        <>
            <TopNavbarListItem collapsedOnDesktop={false} noShrink>
                <PromotionButton
                    as="button"
                    type="button"
                    color="norm"
                    size={CTAText.length > 14 && app === APPS.PROTONCALENDAR ? 'small' : 'medium'}
                    responsive
                    shape={offerConfig.topButton?.shape || 'solid'}
                    buttonGradient={offerConfig.topButton?.gradient}
                    iconGradient={!!offerConfig.topButton?.iconGradient}
                    iconName={upgradeIcon}
                    onClick={() => {
                        setOfferModalOpen(true);
                        setFetchOffer(true);
                    }}
                    loading={loadingOffer && !offer}
                    className={clsx([
                        offerConfig.topButton?.variant && `button-promotion--${offerConfig.topButton?.variant}`,
                    ])}
                    pill={!!offerConfig.topButton?.variant}
                    data-testid="cta:special-offer"
                >
                    {CTAText}
                </PromotionButton>
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

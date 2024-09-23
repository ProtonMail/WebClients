import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import Price from '@proton/components/components/price/Price';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { isSplittedUser } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS, isFreeSubscription } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';
import { isManagedExternally } from '@proton/shared/lib/helpers/subscription';
import { BillingPlatform, ChargebeeEnabled } from '@proton/shared/lib/interfaces';

import { usePaymentStatus, useSubscription, useUser } from '../../hooks';
import { openLinkInBrowser } from '../desktop/openExternalLink';
import CreditsModal from './CreditsModal';
import InAppPurchaseModal from './subscription/InAppPurchaseModal';

const redirectFromDesktop = '?open=credit-modal';

const CreditsSection = () => {
    const location = useLocation();
    const [user] = useUser();
    const [subscription] = useSubscription();
    const [creditModalProps, setCreditModalOpen, renderCreditModal] = useModalState();
    const [externalSubscriptionModal, showExternalSubscriptionModal] = useModalTwoStatic(InAppPurchaseModal);
    const [paymentStatus, paymentStatusLoading] = usePaymentStatus();

    const [{ Credit, Currency, ChargebeeUser }] = useUser();

    const openCreditModal = () => {
        setCreditModalOpen(true);
    };

    useEffect(() => {
        const searchParams = new URLSearchParams(location.search);
        if (searchParams.get('open') === 'credit-modal') {
            void openCreditModal();
        }
    }, [location.search]);

    if (!subscription || paymentStatusLoading) {
        return <Loader />;
    }

    let upcomingSubscriptionPrice: number = 0;
    // In case of Chargebee, they don't display the balance for the upcoming subscription.
    // Instead, they count it as already paid, and they return credits balance already taking into account
    // the upcoming subscription.
    if (
        !isFreeSubscription(subscription) &&
        subscription?.BillingPlatform !== BillingPlatform.Chargebee &&
        subscription?.UpcomingSubscription
    ) {
        upcomingSubscriptionPrice =
            subscription.UpcomingSubscription.Amount - subscription.UpcomingSubscription.Discount;
    }

    let availableCredits = Credit - upcomingSubscriptionPrice;
    if (availableCredits < 0) {
        availableCredits = 0;
    }

    // Splitted users can't add credits in both v4 and v5 APIs, so we hide this option for them until the migration is
    // completed.
    const hideAddCredits = isSplittedUser(user.ChargebeeUser, user.ChargebeeUserExists, subscription.BillingPlatform);

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`When your subscription renews, we will apply any available credits before we charge the payment method above.`}
            </SettingsParagraph>
            {hideAddCredits ? null : (
                <div className="mb-7">
                    <Button
                        shape="outline"
                        onClick={() => {
                            if (isManagedExternally(subscription)) {
                                showExternalSubscriptionModal({
                                    subscription,
                                });
                                return;
                            }

                            if (isElectronApp) {
                                openLinkInBrowser(getAppHref(`/dashboard${redirectFromDesktop}`, APPS.PROTONACCOUNT));
                                return;
                            }

                            void openCreditModal();
                        }}
                    >{c('Action').t`Add credits`}</Button>
                </div>
            )}
            <div className="px-4 mb-4 flex justify-space-between">
                <span className="text-bold" data-testid="unused-credits">{c('Credits').t`Available credits`}</span>
                <span className="text-bold" data-testid="avalaible-credits">
                    {ChargebeeUser === ChargebeeEnabled.CHARGEBEE_FORCED && availableCredits > 0 ? (
                        <Price currency={Currency}>{availableCredits}</Price>
                    ) : (
                        availableCredits / 100
                    )}
                </span>
            </div>
            <hr />
            {renderCreditModal && paymentStatus && <CreditsModal status={paymentStatus} {...creditModalProps} />}
            {externalSubscriptionModal}
        </SettingsSection>
    );
};

export default CreditsSection;

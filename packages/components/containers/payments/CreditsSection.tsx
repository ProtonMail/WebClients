import { useEffect } from 'react';
import { useLocation } from 'react-router';

import { c } from 'ttag';

import { usePaymentStatus } from '@proton/account/paymentStatus/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import useModalState from '@proton/components/components/modalTwo/useModalState';
import { useModalTwoStatic } from '@proton/components/components/modalTwo/useModalTwo';
import Price from '@proton/components/components/price/Price';
import SettingsParagraph from '@proton/components/containers/account/SettingsParagraph';
import SettingsSection from '@proton/components/containers/account/SettingsSection';
import { getAvailableSubscriptionActions } from '@proton/payments';
import { getAppHref } from '@proton/shared/lib/apps/helper';
import { APPS } from '@proton/shared/lib/constants';
import { isElectronApp } from '@proton/shared/lib/helpers/desktop';

import { openLinkInBrowser } from '../desktop/openExternalLink';
import CreditsModal from './CreditsModal';
import InAppPurchaseModal from './subscription/InAppPurchaseModal';

const redirectFromDesktop = '?open=credit-modal';

const CreditsSection = () => {
    const location = useLocation();
    const [subscription] = useSubscription();
    const [creditModalProps, setCreditModalOpen, renderCreditModal] = useModalState();
    const [externalSubscriptionModal, showExternalSubscriptionModal] = useModalTwoStatic(InAppPurchaseModal);
    const [paymentStatus, paymentStatusLoading] = usePaymentStatus();

    const [{ Credit, Currency }] = useUser();

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

    return (
        <SettingsSection>
            <SettingsParagraph>
                {c('Info')
                    .t`When your subscription renews, we will apply any available credits before we charge the payment method above.`}
            </SettingsParagraph>
            <div className="mb-7">
                <Button
                    shape="outline"
                    onClick={() => {
                        const subscriptionActions = getAvailableSubscriptionActions(subscription);
                        if (!subscriptionActions.canModify) {
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
            <div className="px-4 mb-4 flex justify-space-between">
                <span className="text-bold">{c('Credits').t`Available credits`}</span>
                <span className="text-bold" data-testid="available-credits">
                    {Credit > 0 ? <Price currency={Currency}>{Credit}</Price> : 0}
                </span>
            </div>
            <hr />
            {renderCreditModal && paymentStatus && <CreditsModal paymentStatus={paymentStatus} {...creditModalProps} />}
            {externalSubscriptionModal}
        </SettingsSection>
    );
};

export default CreditsSection;

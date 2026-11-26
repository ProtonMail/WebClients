import type { FC } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PromotionBanner } from '@proton/components/containers/banner/PromotionBanner';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/subscriptionModalContext';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';

const PassUpgradeBanner: FC<{ message: string }> = ({ message }) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();

    return (
        <PromotionBanner
            rounded
            mode="banner"
            contentCentered={false}
            className="mb-6"
            description={
                <div>
                    <b>{message}</b>
                </div>
            }
            cta={
                <Button
                    color="norm"
                    loading={loadingSubscriptionModal}
                    onClick={() => {
                        void openSubscriptionModal({ step: SUBSCRIPTION_STEPS.PLAN_SELECTION });
                    }}
                >
                    {c('Action').t`Upgrade`}
                </Button>
            }
        />
    );
};

export const PassPoliciesUpgradeBanner: FC = () => (
    <PassUpgradeBanner message={c('Info').t`Upgrade to define policies for your organization.`} />
);

export const PassReportsUpgradeBanner: FC = () => (
    <PassUpgradeBanner message={c('Info').t`Upgrade now to monitor your team's account safety.`} />
);

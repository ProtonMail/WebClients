import { c } from 'ttag';

import { Button } from '@proton/atoms';
import ModalContent from '@proton/components/components/modalTwo/ModalContent';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import sentinelBoltShield from '@proton/styles/assets/img/illustrations/sentinel-shield-bolt-breach-alert.svg';

import './UnlockReportModal.scss';

const UnlockBreachReportCard = () => {
    const [openSubscriptionModal] = useSubscriptionModal();

    const metrics = {
        source: 'plans',
    } as const;

    const handleUnlockBreachReport = () => {
        openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.PLAN_SELECTION,
            metrics,
            mode: 'upsell-modal',
        });
    };

    return (
        <div
            className="breach-upsell-modal absolute inset-x-center top-custom p-4 md:p-6 w-1/2 tooltips flex items-center justify-center overflow-hidden rounded-lg shadow-lifted "
            style={{ '--top-custom': '4.675rem' }}
        >
            <ModalContent>
                <div className="text-center flex flex-col justify-center">
                    <div className="mb-4 rounded">
                        <img src={sentinelBoltShield} className="w-full block" alt="" />
                    </div>
                    <p className="color-weak mt-0 mb-4 px-4">
                        {c('Description')
                            .t`To view the full report including personalized recommendations, upgrade to a paid plan.`}
                    </p>
                    <Button
                        onClick={handleUnlockBreachReport}
                        size="large"
                        shape="solid"
                        color="norm"
                        fullWidth
                        data-testid="explore-other-plan"
                    >{c('Action').t`Unlock Breach Report`}</Button>
                </div>
            </ModalContent>
        </div>
    );
};

export default UnlockBreachReportCard;

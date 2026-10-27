import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Loader from '@proton/components/components/loader/Loader';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { useSubscriptionModal } from '@proton/components/containers/payments/subscription/SubscriptionModalProvider';
import { usePreferredPlansMap } from '@proton/payments-ui/ui/hooks/usePreferredPlansMap';
import { CYCLE, PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import { SUBSCRIPTION_STEPS } from '@proton/payments/core/subscription/subscription-modal-constants';
import lumoCatLoaf from '@proton/styles/assets/img/lumo/lumo-cat-loaf-upsell.svg';

import { LUMO_UPGRADE_TRIGGER_CLASS } from '../../constants';
import { sendSubscriptionModalSubscribedEvent } from '../../util/telemetry';
import { LumoIcon } from '../LumoIcon/LumoIcon';

import './LumoPlusLimitModal.scss';

interface LumoPlusLimitModalProps extends ModalProps {
    /** Translated heading describing the feature unlocked by upgrading to Lumo Plus. */
    title: string;
    /** Translated explanation of the higher limit and other benefits of upgrading. */
    description: string;
    /** Translated first benefit in the feature list, describing the Lumo Plus allowance. */
    limitFeature: string;
}

export const LumoPlusLimitModal = ({ title, description, limitFeature, ...modalProps }: LumoPlusLimitModalProps) => {
    const [openSubscriptionModal, loadingSubscriptionModal] = useSubscriptionModal();
    const { plansMapLoading } = usePreferredPlansMap();

    const handleSubscriptionModalSubscribed = () => {
        modalProps.onClose?.();
        sendSubscriptionModalSubscribedEvent();
    };

    const handleUpgrade = () => {
        void openSubscriptionModal({
            step: SUBSCRIPTION_STEPS.CHECKOUT,
            disablePlanSelection: true,
            maximumCycle: CYCLE.YEARLY,
            plan: PLANS.LUMO,
            onSubscribed: () => {
                handleSubscriptionModalSubscribed();
            },
        });
    };

    if (plansMapLoading) {
        return <Loader />;
    }

    const features = [
        limitFeature,
        c('collider_2025:Feature').t`Advanced AI models`,
        c('collider_2025:Feature').t`Priority access & faster responses`,
    ];

    return (
        <ModalTwo {...modalProps}>
            <ModalTwoHeader title={title} />
            <ModalTwoContent>
                <div className="lumo-plus-limit-modal__content">
                    <div className="modal-two-illustration-container mb-2 relative text-center">
                        <img
                            src={lumoCatLoaf}
                            alt={
                                // translator: Accessible description of an upgrade illustration. ${PLAN_NAMES[PLANS.LUMO]} is the paid plan name.
                                c('collider_2025:Label').t`Get ${PLAN_NAMES[PLANS.LUMO]}`
                            }
                            width={160}
                        />
                    </div>
                    <p className="color-weak mb-4">{description}</p>

                    <div className="lumo-plus-limit-modal__features">
                        {features.map((feature) => (
                            <div className="lumo-plus-limit-modal__feature" key={feature}>
                                <LumoIcon aria-hidden name="CircleCheck" size={20} color="#6D4AFF" />
                                <span>{feature}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button onClick={modalProps.onClose} shape="outline">
                    {c('collider_2025:Action').t`Cancel`}
                </Button>
                <Button
                    color="norm"
                    loading={loadingSubscriptionModal}
                    onClick={handleUpgrade}
                    className={LUMO_UPGRADE_TRIGGER_CLASS}
                >
                    {
                        // translator: Plus is the paid plan name. Do not translate.
                        c('collider_2025:Action').t`Upgrade to Plus`
                    }
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

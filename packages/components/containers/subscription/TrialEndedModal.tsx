import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { type ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';
import useApi from '@proton/components/hooks/useApi';
import illustration from '@proton/styles/assets/img/illustrations/b2b-trial-end.svg';

const TrialEndedModal = ({ onClose, ...rest }: ModalStateProps) => {
    const api = useApi();
    const [subscription] = useSubscription();

    const planName = subscription?.Plans[0]?.Title;

    if (planName === undefined) {
        return null;
    }

    const title = c('Title').t`Your ${planName} subscription started`;

    // Handle modal closure and update user preferences
    const handleClose = async () => {
        // Update flags in user settings to indicate the trial ended modal has been acknowledged
        await api({
            url: 'core/v4/settings/flags',
            method: 'put',
            data: { DisplayTrialEndModal: 0 },
        });
        onClose();
    };

    const nextBillingDate = (
        <span className="text-bold">
            <Time>{subscription?.PeriodEnd}</Time>
        </span>
    );
    const description = (
        <span className="block mt-4">
            {c('Info')
                .jt`Your ${planName} plan is now a paid subscription that automatically renews every 12 months. Your next billing date is ${nextBillingDate}.`}
        </span>
    );

    return (
        <ModalTwo size="small" className="p-3" {...rest}>
            <ModalTwoHeader title={title} titleClassName="text-center mx-auto" hasClose={false} />
            <ModalTwoContent className="flex flex-column items-center">
                <img src={illustration} alt="" />
                {description}
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button fullWidth onClick={handleClose}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default TrialEndedModal;

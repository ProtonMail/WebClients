import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';
import useApi from '@proton/components/hooks/useApi';
import { CYCLE } from '@proton/payments';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import illustration from '@proton/styles/assets/img/illustrations/b2b-trial-end.svg';

const TrialEndedModal = ({ onClose, ...rest }: ModalStateProps) => {
    const api = useApi();
    const [subscription] = useSubscription();

    const planName = subscription?.Plans?.[0]?.Title;

    if (planName === undefined) {
        return null;
    }

    const title = c('Title').t`Your ${planName} subscription has started`;

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
        <span className="text-bold" key="next-billing-date">
            <Time>{subscription?.PeriodEnd}</Time>
        </span>
    );

    const cycle = subscription?.Cycle;

    const renewalFrequency =
        cycle === CYCLE.MONTHLY
            ? c('Info')
                  .jt`Your free trial was successfully converted to a monthly subscription. Your renewal date is ${nextBillingDate}.`
            : c('Info')
                  .jt`Your free trial was successfully converted to a ${cycle}-month subscription. Your renewal date is ${nextBillingDate}.`;

    const description = c('Info').jt`Thank you for choosing ${BRAND_NAME} to secure your organization.`;

    return (
        <ModalTwo size="small" className="p-3" {...rest}>
            <ModalTwoHeader title={title} titleClassName="text-center mx-auto" hasClose={false} />
            <ModalTwoContent className="flex flex-column items-center">
                <img src={illustration} alt="" />
                <span className="block mt-4">{renewalFrequency}</span>
                <span className="block mt-2">{description}</span>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button fullWidth onClick={handleClose}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default TrialEndedModal;

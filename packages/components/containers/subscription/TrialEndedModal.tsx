import { c } from 'ttag';

import { useSubscription } from '@proton/account/subscription/hooks';
import { useApi } from '@proton/app-context/useApi';
import { Button } from '@proton/atoms/Button/Button';
import { CYCLE } from '@proton/payments/core/constants';
import { getPlanTitle, getRenewalTime } from '@proton/payments/core/subscription/helpers';
import { isFreeSubscription } from '@proton/payments/core/type-guards';
import { BRAND_NAME } from '@proton/shared/lib/constants';
import illustration from '@proton/styles/assets/img/illustrations/b2b-trial-end.svg';

import ModalTwo from '../../components/modalTwo/Modal';
import ModalTwoContent from '../../components/modalTwo/ModalContent';
import ModalTwoFooter from '../../components/modalTwo/ModalFooter';
import ModalTwoHeader from '../../components/modalTwo/ModalHeader';
import type { ModalStateProps } from '../../components/modalTwo/useModalState';
import Time from '../../components/time/Time';

const TrialEndedModal = ({ onClose, ...rest }: ModalStateProps) => {
    const api = useApi();
    const [subscription] = useSubscription();

    const planTitle = getPlanTitle(subscription);

    if (planTitle === undefined || !subscription || isFreeSubscription(subscription)) {
        return null;
    }

    const title = c('Title').t`Your ${planTitle} subscription has started`;

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
            <Time>{getRenewalTime(subscription)}</Time>
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

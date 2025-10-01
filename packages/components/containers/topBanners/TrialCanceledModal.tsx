import { c } from 'ttag';

import { useOrganization } from '@proton/account/organization/hooks';
import { useSubscription } from '@proton/account/subscription/hooks';
import { useUser } from '@proton/account/user/hooks';
import { Button } from '@proton/atoms';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import Time from '@proton/components/components/time/Time';

const TrialCanceledModal = (props: ModalStateProps) => {
    const { onClose } = props;
    const [subscription] = useSubscription();
    const [organization] = useOrganization();
    const [user] = useUser();

    const trialEndsOn = subscription?.PeriodEnd;
    const planTitle = subscription?.Plans?.[0]?.Title;

    if (!subscription || !organization || !user) {
        return null;
    }

    const boldPlanTitle = (
        <span className="text-bold" key="plan-title">
            {planTitle}
        </span>
    );
    const boldEndDate = (
        <span className="text-bold" key="end-date">
            <Time>{trialEndsOn}</Time>
        </span>
    );

    return (
        <ModalTwo {...props}>
            <ModalTwoHeader title={c('Title').t`Subscription canceled`} />
            <ModalTwoContent>
                <p>{c('Info').jt`You’ll lose access to ${boldPlanTitle} on ${boldEndDate}.`}</p>
                <p>{c('Info')
                    .t`You’ll still be able to view your own account data, but all user accounts will be removed from your organization.`}</p>
                <p>{c('Info').t`If you change your mind, you can subscribe again at any time. Sorry to see you go!`}</p>
            </ModalTwoContent>
            <ModalTwoFooter className="justify-end">
                <Button color="norm" onClick={onClose}>{c('Action').t`Got it`}</Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default TrialCanceledModal;

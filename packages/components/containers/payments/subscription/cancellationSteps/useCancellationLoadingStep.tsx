import useModalState from '@proton/components/components/modalTwo/useModalState';

import CancelSubscriptionLoadingModal from '../cancelSubscription/CancelSubscriptionLoadingModal';

export const useCancellationLoadingStep = () => {
    const [modalProps, setOpen, render] = useModalState();

    const modal = render ? <CancelSubscriptionLoadingModal {...modalProps} /> : null;

    const show = () => {
        setOpen(true);
    };

    const hide = () => {
        setOpen(false);
    };

    return { modal, show, hide };
};

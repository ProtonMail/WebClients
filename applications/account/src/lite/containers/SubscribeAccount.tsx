import { c } from 'ttag';
import { useEffect, useRef } from 'react';
import { useSubscriptionModal, useUser } from '@proton/components';
import { SUBSCRIPTION_STEPS } from '@proton/components/containers/payments/subscription/constants';
import { canPay } from '@proton/shared/lib/user/helpers';
import broadcast, { MessageType } from '../broadcast';

interface Props {
    client?: string | null;
}

const SubscribeAccount = ({ client }: Props) => {
    const onceRef = useRef(false);
    const onceCloseRef = useRef(false);
    const [user] = useUser();
    const [open, loading] = useSubscriptionModal();

    const handleClose = () => {
        if (onceCloseRef.current) {
            return;
        }
        onceCloseRef.current = true;
        if (client === 'macOS') {
            document.location.replace('protonvpn://refresh');
        } else {
            broadcast({ type: MessageType.CLOSE });
        }
    };

    const canEdit = canPay(user);

    useEffect(() => {
        if (onceRef.current || loading || !user) {
            return;
        }
        // Only certain users can manage subscriptions
        if (!canEdit) {
            return;
        }
        onceRef.current = true;
        open({
            step: user.isFree ? SUBSCRIPTION_STEPS.PLAN_SELECTION : SUBSCRIPTION_STEPS.CUSTOMIZATION,
            onClose: handleClose,
            onSuccess: handleClose,
            fullscreen: client !== 'macOS',
        });
    }, [user, loading]);

    return (
        <div className="h100 ui-prominent">
            {!canEdit ? (
                <div className="flex flex-justify-center flex-align-items-center h100">
                    {c('Action').t`Please contact the administrator of the organisation to manage the subscription`}
                </div>
            ) : null}
        </div>
    );
};

export default SubscribeAccount;

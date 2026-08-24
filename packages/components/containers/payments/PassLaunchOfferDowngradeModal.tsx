import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import { PLANS, PLAN_NAMES } from '@proton/payments/core/constants';
import type { Subscription } from '@proton/payments/core/subscription/interface';
import { PASS_APP_NAME } from '@proton/shared/lib/constants';

import type { ModalProps } from '../../components/modalTwo/Modal';
import Price from '../../components/price/Price';
import Prompt from '../../components/prompt/Prompt';

interface Props extends ModalProps {
    subscription: Subscription;
    onConfirm: () => void;
}

const PassLaunchOfferDowngradeModal = ({ subscription, onConfirm, onClose, ...rest }: Props) => {
    const price = (
        <Price currency={subscription.Currency} key="price">
            {subscription.Amount}
        </Price>
    );

    return (
        <Prompt
            title={c('Downgrade warning').t`Confirm loss of ${PASS_APP_NAME} special discount`}
            buttons={[
                <Button
                    onClick={() => {
                        onConfirm();
                        onClose?.();
                    }}
                    color="danger"
                    data-testid="confirm-loss-btn"
                >
                    {c('Downgrade warning').t`Remove discount`}
                </Button>,
                <Button onClick={onClose}>{c('Action').t`Cancel`}</Button>,
            ]}
            onClose={onClose}
            data-testid="confirm-loss"
            {...rest}
        >
            <div className="mb-4">
                {c('Downgrade warning')
                    .jt`Your ${PLAN_NAMES[PLANS.PASS]} subscription is at a special price of ${price} per year. By downgrading to a Free plan, you will permanently lose the discount, even if you upgrade again in the future.`}
            </div>
        </Prompt>
    );
};

export default PassLaunchOfferDowngradeModal;

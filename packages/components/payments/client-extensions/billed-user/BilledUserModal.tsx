import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import { User } from '@proton/shared/lib/interfaces';

import { isBilledUser } from './utils';

interface Props extends ModalProps {
    user: User;
}

export const BilledUserModal = ({ user, ...rest }: Props) => {
    const shouldClose = !isBilledUser(user);

    useEffect(() => {
        if (shouldClose) {
            rest.onClose?.();
        }
    }, [shouldClose]);

    return (
        <ModalTwo size="large" {...rest}>
            <ModalTwoHeader title={c('Payments').t`Payment Processing`}></ModalTwoHeader>
            <ModalTwoContent>
                <p>
                    {c('Payments')
                        .t`We are processing your payment for the billed invoice. Please wait until the payment is completed before making changes to your plan or updating your payment details. Thank you for your patience.`}
                </p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="mx-auto" color="norm" onClick={rest.onClose} data-testid="BilledUserModal/onClose">
                    {c('Payments').t`Got it`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

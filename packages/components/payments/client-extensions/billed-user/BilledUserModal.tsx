import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { ModalProps, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import { User, isBilledUser } from '@proton/shared/lib/interfaces';

import { billedUserWarning } from './billedUserWarning';

interface Props extends ModalProps {
    user: User | undefined;
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
                <p>{billedUserWarning}</p>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button className="mx-auto" color="norm" onClick={rest.onClose} data-testid="BilledUserModal/onClose">
                    {c('Payments').t`Got it`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

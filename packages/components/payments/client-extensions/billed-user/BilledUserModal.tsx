import { useEffect } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { User } from '@proton/shared/lib/interfaces';
import { isBilledUser } from '@proton/shared/lib/interfaces';

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

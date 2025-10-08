import { useCallback } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { VpnLocationFilterPolicy } from '@proton/components/containers/vpn/sharedServers/useSharedServers';

interface DeleteModalProps extends ModalProps {
    onSuccess: (policy: VpnLocationFilterPolicy) => void;
    policy: VpnLocationFilterPolicy;
}

const DeleteModal = ({ policy, onSuccess, ...rest }: DeleteModalProps) => {
    const policyName = policy.Name;

    const handleDeletion = useCallback(async () => {
        onSuccess(policy);
        rest.onClose?.();
    }, [policy, onSuccess, rest]);

    return (
        <ModalTwo size="small" as={Form} {...rest}>
            <ModalTwoHeader title={c('Title').t`Delete ${policyName}?`} />

            <ModalTwoContent>
                <span>{c('Info').t`This cannot be undone.`}</span>
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column">
                <Button color="danger" type="button" onClick={handleDeletion}>
                    {c('Action').t`Delete policy`}
                </Button>
                <Button color="weak" type="button" onClick={rest.onClose}>
                    {c('Action').t`Cancel`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default DeleteModal;

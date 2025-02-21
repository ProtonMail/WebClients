import { c } from 'ttag';

import { Button } from '@proton/atoms';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import { mapPoliciesToFilterRequest } from '@proton/components/containers/vpn/sharedServers/mapPoliciesToFilterRequest';
import useApi from '@proton/components/hooks/useApi';
import useNotifications from '@proton/components/hooks/useNotifications';
import { MINUTE } from '@proton/shared/lib/constants';

import type { CreateLocationFilterPayload, FilterPolicyRequest } from '../api';
import { createLocationFilter } from '../api';
import { useSharedServers } from '../useSharedServers';
import type { VpnLocationFilterPolicy } from '../useSharedServers';

interface DeleteModalProps extends ModalProps {
    onSuccess?: () => void;
    policy: VpnLocationFilterPolicy;
}

const DeleteModal = ({ policy, onSuccess, ...rest }: DeleteModalProps) => {
    const api = useApi();
    const { createNotification } = useNotifications();
    const { policies } = useSharedServers(10 * MINUTE);
    const policyName = policy?.Name;

    const handleSubmitWhenDeleting = async () => {
        try {
            const FilterPoliciesInput: FilterPolicyRequest[] = mapPoliciesToFilterRequest(policies, false, policy);

            const payload: CreateLocationFilterPayload = {
                FilterPoliciesInput,
            };

            await api(createLocationFilter(payload));
            onSuccess?.();

            createNotification({
                text: c('Success').t`Policy deleted`,
                type: 'success',
            });

            rest.onClose?.();
        } catch (error) {
            createNotification({
                text: c('Error').t`Error deleting policy.`,
                type: 'error',
            });
        }
    };

    return (
        <ModalTwo size="small" as={Form} {...rest}>
            <ModalTwoHeader title={c('Title').t`Delete ${policyName}?`} />

            <ModalTwoContent>
                <span>{c('Info').t`This cannot be undone.`}</span>
            </ModalTwoContent>

            <ModalTwoFooter className="flex flex-column">
                <Button color="danger" type="button" onClick={handleSubmitWhenDeleting}>
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

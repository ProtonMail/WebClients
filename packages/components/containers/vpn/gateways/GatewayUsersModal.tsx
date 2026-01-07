import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import Form from '@proton/components/components/form/Form';
import type { ModalProps } from '@proton/components/components/modalTwo/Modal';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import useNotifications from '@proton/components/hooks/useNotifications';
import { SERVER_FEATURES } from '@proton/shared/lib/constants';

import type { GatewayDto } from './GatewayDto';
import type { GatewayGroup } from './GatewayGroup';
import type { GatewayModel } from './GatewayModel';
import type { GatewayUser } from './GatewayUser';
import { GatewayUserSelection } from './GatewayUserSelection';

type PartialGateway = Pick<GatewayDto, 'features' | 'userIds' | 'groupIds'>;

interface Props extends ModalProps<typeof Form> {
    model: PartialGateway;
    users: GatewayUser[];
    groups: GatewayGroup[];
    showCancelButton?: boolean;
    onSubmitDone: (gateway: Pick<GatewayModel, 'Features' | 'UserIds' | 'GroupIds'>) => Promise<void>;
}

const GatewayUsersModal = ({
    model: initialModel,
    users,
    groups,
    showCancelButton = false,
    onSubmitDone,
    ...rest
}: Props) => {
    const { createNotification } = useNotifications();
    const [model, setModel] = useState<PartialGateway>({ ...initialModel });
    const [loading, setLoading] = useState(false);

    const changeModel = (diff: Partial<PartialGateway>) => setModel((model) => ({ ...model, ...diff }));
    const handleSubmit = async () => {
        if (
            (model.features & SERVER_FEATURES.DOUBLE_RESTRICTION) !== 0 &&
            (!model.userIds || model.userIds.length === 0) &&
            (!model.groupIds || model.groupIds.length === 0)
        ) {
            createNotification({
                text: c('Error').t`Please select at least one user or group before continuing.`,
                type: 'error',
            });

            return;
        }

        const dtoBody = {
            Features: model.features,
            UserIds: model.userIds,
            GroupIds: model.groupIds,
        };
        try {
            setLoading(true);
            await onSubmitDone(dtoBody);
            rest.onClose?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalTwo size="xlarge" {...rest} as={Form} onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Edit users`} />
            <ModalTwoContent>
                <GatewayUserSelection users={users} groups={groups} model={model} changeModel={changeModel} />
            </ModalTwoContent>
            <ModalTwoFooter>
                {showCancelButton ? (
                    <Button color="weak" onClick={rest.onClose}>
                        {c('Action').t`Cancel`}
                    </Button>
                ) : (
                    <div />
                )}
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Save`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default GatewayUsersModal;

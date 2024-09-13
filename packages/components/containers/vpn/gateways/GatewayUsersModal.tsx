import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalProps } from '@proton/components/components';
import { ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';
import Form from '@proton/components/components/form/Form';

import type { GatewayDto } from './GatewayDto';
import type { GatewayModel } from './GatewayModel';
import type { GatewayUser } from './GatewayUser';
import { GatewayUserSelection } from './GatewayUserSelection';

type PartialGateway = Pick<GatewayDto, 'features' | 'userIds'>;

interface Props extends ModalProps<typeof Form> {
    model: PartialGateway;
    users: readonly GatewayUser[];
    showCancelButton?: boolean;
    onSubmitDone: (gateway: Pick<GatewayModel, 'Features' | 'UserIds'>) => Promise<void>;
}

const GatewayUsersModal = ({ model: initialModel, users, showCancelButton = false, onSubmitDone, ...rest }: Props) => {
    const [model, setModel] = useState<PartialGateway>({ ...initialModel });
    const [loading, setLoading] = useState(false);

    const changeModel = (diff: Partial<PartialGateway>) => setModel((model) => ({ ...model, ...diff }));

    const handleSubmit = async () => {
        const dtoBody = {
            Features: model.features,
            UserIds: model.userIds,
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
                <GatewayUserSelection loading={loading} users={users} model={model} changeModel={changeModel} />
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

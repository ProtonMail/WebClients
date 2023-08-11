import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import { Form, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components/components';

import { GatewayDto } from './GatewayDto';
import { GatewayModel } from './GatewayModel';
import { GatewayUser } from './GatewayUser';
import { GatewayUserSelection } from './GatewayUserSelection';

interface Props {
    model: GatewayDto;
    users: readonly GatewayUser[];
    showCancelButton?: boolean;
    onSubmitDone: (gateway: Pick<GatewayModel, 'Features' | 'UserIds'>) => Promise<void>;
    onResolve: () => void;
    onReject: () => void;
}

const GatewayUsersModal = ({
    model: initialModel,
    users,
    showCancelButton = false,
    onSubmitDone,
    onReject,
    onResolve,
    ...rest
}: Props) => {
    const [model, setModel] = useState({ ...initialModel });
    const [loading, setLoading] = useState(false);

    const changeModel = <V extends GatewayDto[K], K extends keyof GatewayDto = keyof GatewayDto>(key: K, value: V) =>
        setModel((model: GatewayDto) => ({ ...model, [key]: value }));

    const handleSubmit = async () => {
        const dtoBody = {
            Features: model.features,
            UserIds: model.userIds,
        };

        try {
            setLoading(true);
            await onSubmitDone(dtoBody);
            onResolve();
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalTwo size="xlarge" {...rest} as={Form} onSubmit={handleSubmit} onClose={onReject}>
            <ModalTwoHeader title={c('Title').t`Edit users`} />
            <ModalTwoContent>
                <GatewayUserSelection loading={loading} users={users} model={model} changeModel={changeModel} />
            </ModalTwoContent>
            <ModalTwoFooter>
                {showCancelButton ? (
                    <Button color="weak" onClick={onReject}>
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

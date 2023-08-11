import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
} from '@proton/components/components';

import { GatewayDto } from './GatewayDto';
import { GatewayNameField } from './GatewayNameField';

interface Props {
    currentName: string;
    showCancelButton?: boolean;
    onSubmitDone: (server: { Name: string }) => Promise<void>;
    onResolve: () => void;
    onReject: () => void;
}

const GatewayRenameModal = ({
    currentName,
    showCancelButton = false,
    onSubmitDone,
    onReject,
    onResolve,
    ...rest
}: Props) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState({
        name: '',
    } as GatewayDto);
    const [loading, setLoading] = useState(false);

    const changeModel = <V extends GatewayDto[K], K extends keyof GatewayDto = keyof GatewayDto>(key: K, value: V) =>
        setModel((model: GatewayDto) => ({ ...model, [key]: value }));

    const handleSubmit = async () => {
        if (!onFormSubmit()) {
            return;
        }

        const dtoBody = {
            Name: model.name || '',
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
        <ModalTwo size="large" {...rest} as={Form} onSubmit={handleSubmit} onClose={onReject}>
            <ModalTwoHeader title={c('Title').t`Edit Gateway ${currentName}`} />
            <ModalTwoContent>
                <GatewayNameField model={model} changeModel={changeModel} validator={validator} />
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
                    {c('Action').t`Rename`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default GatewayRenameModal;

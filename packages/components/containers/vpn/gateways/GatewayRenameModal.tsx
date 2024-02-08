import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    Form,
    ModalProps,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
} from '@proton/components/components';

import { GatewayDto } from './GatewayDto';
import { GatewayNameField } from './GatewayNameField';

interface Props extends ModalProps<typeof Form> {
    currentName: string;
    showCancelButton?: boolean;
    onSubmitDone: (server: { Name: string }) => Promise<void>;
}

const GatewayRenameModal = ({ currentName, showCancelButton = false, onSubmitDone, ...rest }: Props) => {
    const { validator, onFormSubmit } = useFormErrors();
    const [model, setModel] = useState({
        name: '',
    } as GatewayDto);
    const [loading, setLoading] = useState(false);

    const changeModel = (diff: Partial<GatewayDto>) => setModel((model: GatewayDto) => ({ ...model, ...diff }));

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
            rest.onClose?.();
        } finally {
            setLoading(false);
        }
    };

    return (
        <ModalTwo size="large" {...rest} as={Form} onSubmit={handleSubmit}>
            <ModalTwoHeader title={c('Title').t`Edit Gateway ${currentName}`} />
            <ModalTwoContent>
                <GatewayNameField model={model} changeModel={changeModel} validator={validator} />
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
                    {c('Action').t`Rename`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default GatewayRenameModal;

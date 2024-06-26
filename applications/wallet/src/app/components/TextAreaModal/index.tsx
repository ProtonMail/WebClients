import { useEffect, useState } from 'react';

import { ModalPropsWithData, TextAreaTwo } from '@proton/components/components';

import { Button, Input, Modal } from '../../atoms';

interface Props extends ModalPropsWithData<{}> {
    title: string;
    buttonText: string;
    inputLabel: string;
    value: string;
    onSubmit: (value: string) => void;
}

export const TextAreaModal = ({ title, buttonText, inputLabel, value: baseValue, onSubmit, ...modalProps }: Props) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        setValue(baseValue);
    }, [baseValue]);

    return (
        <Modal title={title} {...modalProps}>
            <Input as={TextAreaTwo} rows={3} label={inputLabel} value={value} onValue={(v: string) => setValue(v)} />

            <Button color="norm" shape="solid" className="mt-6" fullWidth onClick={() => onSubmit(value)}>
                {buttonText}
            </Button>
        </Modal>
    );
};

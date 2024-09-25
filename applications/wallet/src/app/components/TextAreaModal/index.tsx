import { useEffect, useState } from 'react';

import type { ModalOwnProps } from '@proton/components';
import { TextAreaTwo } from '@proton/components';

import { Button, Input, Modal } from '../../atoms';

interface Props extends ModalOwnProps {
    title: string;
    buttonText: string;
    inputLabel: string;
    loading?: boolean;
    value: string;
    onSubmit: (value: string) => void;
    maxLength?: number;
}

export const TextAreaModal = ({
    title,
    buttonText,
    inputLabel,
    loading,
    value: baseValue,
    onSubmit,
    maxLength,
    ...modalProps
}: Props) => {
    const [value, setValue] = useState('');

    useEffect(() => {
        setValue(baseValue);
    }, [baseValue]);

    return (
        <Modal title={title} {...modalProps}>
            <Input
                autoFocus
                as={TextAreaTwo}
                rows={3}
                label={inputLabel}
                value={value}
                onValue={(v: string) => setValue(v)}
                maxLength={maxLength}
                disabled={loading}
            />

            <Button
                color="norm"
                shape="solid"
                className="mt-6"
                fullWidth
                disabled={loading}
                onClick={() => onSubmit(value)}
            >
                {buttonText}
            </Button>
        </Modal>
    );
};

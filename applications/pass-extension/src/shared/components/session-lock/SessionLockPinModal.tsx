import { type VFC, useEffect, useState } from 'react';

import { Card } from '@proton/atoms/Card';
import { type ModalProps, ModalTwo, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';

import { useSessionLockPinSubmitEffect } from '../../hooks/useSessionLockPinSubmitEffect';
import { PinCodeInput } from './PinCodeInput';

type Props = Omit<ModalProps, 'onSubmit'> & {
    title: string;
    assistiveText?: string;
    loading?: boolean;
    onSubmit: (pin: string) => void;
};

export const SessionLockPinModal: VFC<Props> = ({ title, assistiveText, loading, onSubmit, ...modalProps }) => {
    const [value, setValue] = useState<string>('');
    useSessionLockPinSubmitEffect(value, { onSubmit });

    useEffect(() => {
        if (!modalProps.open) {
            setValue('');
        }
    }, [modalProps.open]);

    return (
        <ModalTwo {...modalProps} size="small" className="mt-10">
            <ModalTwoHeader title={title} />
            <ModalTwoContent className="mb-8">
                {assistiveText && (
                    <Card rounded className="text-sm mb-7">
                        {assistiveText}
                    </Card>
                )}
                <PinCodeInput loading={loading} value={value} onValue={setValue} />
            </ModalTwoContent>
        </ModalTwo>
    );
};

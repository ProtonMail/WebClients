import { type FC, useEffect, useState } from 'react';

import { Card } from '@proton/atoms/Card';
import { type ModalProps, ModalTwoContent, ModalTwoHeader } from '@proton/components/components';
import { PassModal } from '@proton/pass/components/Layout/Modal/PassModal';
import { useSessionLockPinSubmitEffect } from '@proton/pass/hooks/useSessionLockPinSubmitEffect';

import { PinCodeInput } from './PinCodeInput';

type Props = Omit<ModalProps, 'onSubmit'> & {
    title: string;
    assistiveText?: string;
    loading?: boolean;
    onSubmit: (pin: string) => void;
};

export const LockPinModal: FC<Props> = ({ title, assistiveText, loading, onSubmit, ...modalProps }) => {
    const [value, setValue] = useState<string>('');
    useSessionLockPinSubmitEffect(value, { onSubmit });

    useEffect(() => {
        if (!modalProps.open) {
            setValue('');
        }
    }, [modalProps.open]);

    return (
        <PassModal {...modalProps} size="small" className="mt-10">
            <ModalTwoHeader title={title} />
            <ModalTwoContent className="mb-8">
                {assistiveText && (
                    <Card rounded className="text-sm mb-7">
                        {assistiveText}
                    </Card>
                )}
                <PinCodeInput loading={loading} value={value} onValue={setValue} />
            </ModalTwoContent>
        </PassModal>
    );
};

import type { ChangeEvent, FocusEvent } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

export type CreateFileModalViewProps = ModalStateProps & {
    fileName: string;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
    inputFieldError?: string;
};

export const CreateFileModalView = ({
    fileName,
    handleSubmit,
    handleChange,
    handleBlur,
    inputFieldError,
    onClose,
    open,
    onExit,
}: CreateFileModalViewProps) => {
    const [loading, withLoading] = useLoading();

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            size="large"
            open={open}
            onExit={onExit}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={c('Title').t`Create a new file`} />
            <ModalTwoContent>
                <InputFieldTwo
                    id="file-name"
                    autoFocus
                    value={fileName}
                    label={c('Label').t`File name`}
                    placeholder={c('Placeholder').t`Enter a new file name`}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={inputFieldError}
                    required
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Create`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

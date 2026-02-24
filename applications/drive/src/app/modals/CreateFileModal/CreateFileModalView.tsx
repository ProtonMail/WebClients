import type { ChangeEvent, FocusEvent } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import { InputFieldTwo, ModalTwo, ModalTwoContent, ModalTwoFooter, ModalTwoHeader } from '@proton/components';
import { useLoading } from '@proton/hooks';
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

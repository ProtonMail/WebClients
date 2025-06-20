import type { ChangeEvent, FocusEvent } from 'react';
import React from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

export type CreateFolderModalViewProps = ModalStateProps & {
    folderName: string;
    handleSubmit: (e: React.FormEvent) => Promise<void>;
    handleChange: (e: ChangeEvent<HTMLInputElement>) => void;
    handleBlur: (e: FocusEvent<HTMLInputElement>) => void;
    inputFieldError?: string;
};

export const CreateFolderModalView = ({
    folderName,
    handleSubmit,
    handleChange,
    handleBlur,
    inputFieldError,
    onClose,
    ...modalProps
}: CreateFolderModalViewProps) => {
    const [loading, withLoading] = useLoading();

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            size="large"
            {...modalProps}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={c('Title').t`Create a new folder`} />
            <ModalTwoContent>
                <InputFieldTwo
                    id="folder-name"
                    autoFocus
                    value={folderName}
                    label={c('Label').t`Folder name`}
                    placeholder={c('Placeholder').t`Enter a new folder name`}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={inputFieldError}
                    data-testid="input-new-folder-name"
                    required
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" loading={loading}>
                    {c('Action').t`Create`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

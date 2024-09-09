import type { ChangeEvent, FocusEvent } from 'react';
import React, { useState } from 'react';

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
    useFormErrors,
    useModalTwoStatic,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import useActiveShare from '../../hooks/drive/useActiveShare';
import { formatLinkName, useActions, validateLinkNameField } from '../../store';

interface Props {
    onClose?: () => void;
    onCreateDone?: (folderId: string) => void;
    folder?: { shareId: string; linkId: string };
}

const CreateFolderModal = ({ onClose, folder, onCreateDone, ...modalProps }: Props & ModalStateProps) => {
    const { activeFolder } = useActiveShare();
    const { createFolder } = useActions();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        const formattedName = formatLinkName(folderName);
        setFolderName(formattedName);

        const parentFolder = folder || activeFolder;
        if (!parentFolder) {
            return;
        }

        const folderId = await createFolder(
            new AbortController().signal,
            parentFolder.shareId,
            parentFolder.linkId,
            formattedName
        );
        onCreateDone?.(folderId);
        onClose?.();
    };

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
                    error={validator([validateLinkNameField(folderName) || ''])}
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

export default CreateFolderModal;
export const useCreateFolderModal = () => {
    return useModalTwoStatic(CreateFolderModal);
};

import type { ChangeEvent, FocusEvent } from 'react';
import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import ModalTwo from '@proton/components/components/modalTwo/Modal';
import ModalTwoContent from '@proton/components/components/modalTwo/ModalContent';
import ModalTwoFooter from '@proton/components/components/modalTwo/ModalFooter';
import ModalTwoHeader from '@proton/components/components/modalTwo/ModalHeader';
import type { ModalStateProps } from '@proton/components/components/modalTwo/useModalState';
import { InputField as InputFieldTwo } from '@proton/components/components/v2/field/InputField';
import useFormErrors from '@proton/components/components/v2/useFormErrors';
import useLoading from '@proton/hooks/useLoading';
import noop from '@proton/utils/noop';

import { formatLinkName } from '../../store/_links/link';
import { validateLinkNameField } from '../../store/_links/validation';

interface Props {
    onClose?: () => void;
    onCreateDone?: (folderId: string) => void;
    folder: { shareId: string; linkId: string };
    createFolder: (abortSignal: AbortSignal, shareId: string, parentLinkId: string, name: string) => Promise<string>;
}

const CreateFolderModal = ({ createFolder, onClose, folder, onCreateDone, ...modalProps }: Props & ModalStateProps) => {
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

        const parentFolder = folder;
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
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Create`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateFolderModal;

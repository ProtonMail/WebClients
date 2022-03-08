import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { c } from 'ttag';

import {
    InputTwo,
    Row,
    Label,
    Field,
    useLoading,
    ModalTwo,
    ModalTwoHeader,
    ModalTwoContent,
    ModalTwoFooter,
    Button,
    PrimaryButton,
} from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

import { useActions, validateLinkNameField, formatLinkName } from '../store';
import useActiveShare from '../hooks/drive/useActiveShare';
import { useModal } from '../hooks/util/useModal';

interface Props {
    onClose?: () => void;
    onCreateDone?: (folderId: string) => void;
    folder?: { shareId: string; linkId: string };
}

const CreateFolderModal = ({ onClose, folder, onCreateDone, ...rest }: Props) => {
    const { activeFolder } = useActiveShare();
    const { createFolder } = useActions();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const { isOpen, onClose: handleClose } = useModal(onClose);

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
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
        handleClose?.();
    };

    const validationError = validateLinkNameField(folderName);

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={handleClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            open={isOpen}
            size="large"
            {...rest}
        >
            <ModalTwoHeader disabled={loading} title={c('Title').t`Create a new folder`} />
            <ModalTwoContent>
                <Row className="mt1 mb1">
                    <Label>{c('Label').t`Folder name`}</Label>
                    <Field>
                        <InputTwo
                            id="folder-name"
                            autoFocus
                            maxLength={MAX_NAME_LENGTH}
                            value={folderName}
                            placeholder={c('Placeholder').t`Enter a new folder name`}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            error={validationError}
                            required
                        />
                    </Field>
                </Row>
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={handleClose}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" disabled={loading}>
                    {c('Action').t`Create`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateFolderModal;

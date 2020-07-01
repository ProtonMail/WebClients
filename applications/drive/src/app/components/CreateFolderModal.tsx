import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { FormModal, Input, Row, Label, Field, useLoading, useNotifications } from 'react-components';
import { c } from 'ttag';
import { validateLinkName } from '../utils/validation';
import useDrive from '../hooks/drive/useDrive';
import { useDriveActiveFolder, DriveFolder } from './Drive/DriveFolderProvider';

interface Props {
    onClose?: () => void;
    onCreateDone?: (folderId: string) => void;
    folder?: DriveFolder;
}

const CreateFolderModal = ({ onClose, folder, onCreateDone, ...rest }: Props) => {
    const { createNotification } = useNotifications();

    const { folder: activeFolder } = useDriveActiveFolder();
    const { createNewFolder, events } = useDrive();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();

    const formatFolderName = (name: string) => {
        return name.trim();
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async () => {
        const parentFolder = folder || activeFolder;

        if (!parentFolder) {
            return;
        }

        const { shareId, linkId } = parentFolder;

        const name = formatFolderName(folderName);
        setFolderName(name);

        try {
            const { Folder } = await createNewFolder(shareId, linkId, name);
            await events.call(shareId);
            onCreateDone?.(Folder.ID);
        } catch (e) {
            if (e.name === 'ValidationError') {
                createNotification({ text: e.message, type: 'error' });
            }
            throw e;
        }

        const notificationText = (
            <span key="name" style={{ whiteSpace: 'pre' }}>
                {c('Success').t`"${name}" created successfully`}
            </span>
        );
        createNotification({ text: notificationText });
        onClose?.();
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatFolderName(target.value));
    };

    const validationError = validateLinkName(folderName);

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Create a new folder`}
            submit={c('Action').t`Create`}
            autoFocusClose={false}
            {...rest}
        >
            <Row className="p1 pl2">
                <Label>{c('Label').t`Folder name`}</Label>
                <Field>
                    <Input
                        id="folder-name"
                        autoFocus
                        value={folderName}
                        placeholder={c('Placeholder').t`Enter a new folder name`}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        error={validationError}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default CreateFolderModal;

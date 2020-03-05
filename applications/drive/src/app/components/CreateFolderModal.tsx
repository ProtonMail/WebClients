import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { FormModal, Input, Row, Label, Field, useLoading, useNotifications } from 'react-components';
import { c } from 'ttag';
import { DriveResource } from './Drive/DriveResourceProvider';
import useShare from '../hooks/useShare';

interface Props {
    onClose?: () => void;
    onDone?: () => void;
    resource: DriveResource;
}

const CreateFolderModal = ({ resource, onClose, onDone, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const { createNewFolder } = useShare(resource.shareId);

    const formatFolderName = (name: string) => {
        return name.trim();
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async () => {
        const name = formatFolderName(folderName);

        setFolderName(name);

        if (!name) {
            return;
        }

        await createNewFolder(resource.linkId, name);
        const notificationText = (
            <span key="name" style={{ whiteSpace: 'pre' }}>
                {c('Success').t`"${name}" created successfully`}
            </span>
        );
        createNotification({ text: notificationText });
        onClose?.();
        onDone?.();
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatFolderName(target.value));
    };

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Create a new folder`}
            submit={c('Action').t`Create`}
            {...rest}
        >
            <Row className="p1 pl2">
                <Label>{c('Label').t`Folder name`}</Label>
                <Field>
                    <Input
                        id="folder-name"
                        autoFocus
                        value={folderName}
                        placeholder={c('Placeholder').t`New folder`}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default CreateFolderModal;

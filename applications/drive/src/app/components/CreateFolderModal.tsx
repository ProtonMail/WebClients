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

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async () => {
        const name = folderName.trim();
        await createNewFolder(resource.linkId, name);
        const nameElement = (
            <span key="name" style={{ whiteSpace: 'pre' }}>
                &quot;{name}&quot;
            </span>
        );
        createNotification({ text: c('Success').jt`${nameElement} created successfully` });
        onClose?.();
        onDone?.();
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(target.value.trim());
    };

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            title={c('Title').t`Create a new folder`}
            submit={c('Action').t`Submit`}
            {...rest}
        >
            <Row className="p1 pl2">
                <Label>{c('Label').t`Folder name`}</Label>
                <Field>
                    <Input
                        id="file-name"
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

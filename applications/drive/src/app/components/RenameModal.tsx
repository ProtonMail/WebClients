import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { FormModal, Input, Row, Label, Field, useLoading, useNotifications } from 'react-components';
import { c } from 'ttag';
import { FileBrowserItem } from './FileBrowser/FileBrowser';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { LinkType } from '../interfaces/link';
import { validateLinkName } from '../utils/validation';

interface Props {
    onClose?: () => void;
    item: FileBrowserItem;
    renameLink: (name: string) => Promise<void>;
}

const RenameModal = ({ renameLink, item, onClose, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [name, setName] = useState(item.Name);
    const [loading, withLoading] = useLoading();
    const [autofocusDone, setAutofocusDone] = useState(false);

    const formatName = (name: string) => {
        return name.trim();
    };

    const selectNamePart = (e: FocusEvent<HTMLInputElement>) => {
        if (autofocusDone) {
            return;
        }
        setAutofocusDone(true);
        const [namePart] = splitExtension(item.Name);
        if (!namePart || item.Type === LinkType.FOLDER) {
            return e.target.select();
        }
        e.target.setSelectionRange(0, namePart.length);
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setName(target.value);
    };

    const handleSubmit = async () => {
        const formattedName = formatName(name);
        setName(formattedName);

        try {
            await renameLink(formattedName);
        } catch (e) {
            if (e.name === 'ValidationError') {
                createNotification({ text: e.message, type: 'error' });
            }
            throw e;
        }

        const nameElement = (
            <span key="name" style={{ whiteSpace: 'pre-wrap' }}>
                &quot;{formattedName}&quot;
            </span>
        );
        createNotification({ text: c('Success').jt`${nameElement} renamed successfully` });
        onClose?.();
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setName(formatName(target.value));
    };

    const isFolder = item.Type === LinkType.FOLDER;
    const validationError = validateLinkName(name);

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit())}
            title={isFolder ? c('Title').t`Rename a folder` : c('Title').t`Rename a file`}
            submit={c('Action').t`Rename`}
            autoFocusClose={false}
            {...rest}
        >
            <Row className="p1 pl2">
                <Label>{isFolder ? c('Label').t`Folder name` : c('Label').t`File name`}</Label>
                <Field>
                    <Input
                        id="link-name"
                        value={name}
                        autoFocus
                        placeholder={c('Placeholder').t`New name`}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        onFocus={selectNamePart}
                        error={validationError}
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default RenameModal;

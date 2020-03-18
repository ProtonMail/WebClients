import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { FormModal, Input, Row, Label, Field, useLoading, useNotifications } from 'react-components';
import { c } from 'ttag';
import useShare from '../hooks/useShare';
import { FileBrowserItem } from './FileBrowser/FileBrowser';
import { splitExtension } from 'proton-shared/lib/helpers/file';
import { ResourceType } from '../interfaces/link';

interface Props {
    onClose?: () => void;
    onDone?: () => void;
    item: FileBrowserItem;
    shareId: string;
}

const RenameModal = ({ shareId, item, onClose, onDone, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const [name, setName] = useState(item.Name);
    const [loading, withLoading] = useLoading();
    const { renameLink } = useShare(shareId);
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
        if (!namePart) {
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

        if (!formattedName) {
            return;
        }

        await renameLink(item.LinkID, formattedName, item.ParentLinkID);
        const nameElement = (
            <span key="name" style={{ whiteSpace: 'pre' }}>
                &quot;{formattedName}&quot;
            </span>
        );
        createNotification({ text: c('Success').jt`${nameElement} renamed successfully` });
        onClose?.();
        onDone?.();
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setName(formatName(target.value));
    };

    const isFolder = item.Type === ResourceType.FOLDER;

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
                        required
                    />
                </Field>
            </Row>
        </FormModal>
    );
};

export default RenameModal;

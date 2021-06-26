import React, { useState, ChangeEvent, FocusEvent } from 'react';
import { FormModal, Input, Row, Label, Field, useLoading, useNotifications } from '@proton/components';
import { c } from 'ttag';
import { noop } from '@proton/shared/lib/helpers/function';
import { LinkType } from '../interfaces/link';
import { validateLinkNameField } from '../utils/validation';
import { formatLinkName, splitLinkName } from '../utils/link';
import useDrive from '../hooks/drive/useDrive';
import { MAX_NAME_LENGTH } from '../constants';
import { FileBrowserItem } from './FileBrowser/interfaces';

interface Props {
    shareId: string;
    onClose?: () => void;
    item: FileBrowserItem;
}

const RenameModal = ({ shareId, item, onClose, ...rest }: Props) => {
    const { createNotification } = useNotifications();
    const { renameLink, events } = useDrive();
    const [name, setName] = useState(item.Name);
    const [loading, withLoading] = useLoading();
    const [autofocusDone, setAutofocusDone] = useState(false);

    const selectNamePart = (e: FocusEvent<HTMLInputElement>) => {
        if (autofocusDone) {
            return;
        }
        setAutofocusDone(true);
        const [namePart] = splitLinkName(item.Name);
        if (!namePart || item.Type === LinkType.FOLDER) {
            return e.target.select();
        }
        e.target.setSelectionRange(0, namePart.length);
    };

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setName(target.value);
    };

    const handleSubmit = async () => {
        const formattedName = formatLinkName(name);
        setName(formattedName);

        try {
            await renameLink(shareId, item.LinkID, item.ParentLinkID, formattedName);
            await events.call(shareId);
            const nameElement = (
                <span key="name" style={{ whiteSpace: 'pre-wrap' }}>
                    &quot;{formattedName}&quot;
                </span>
            );
            createNotification({ text: c('Success').jt`${nameElement} renamed successfully` });
            onClose?.();
        } catch (e) {
            if (e.name === 'ValidationError') {
                createNotification({ text: e.message, type: 'error' });
            }
            throw e;
        }
    };

    const isFolder = item.Type === LinkType.FOLDER;
    const validationError = validateLinkNameField(name);

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit()).catch(noop)}
            title={isFolder ? c('Title').t`Rename a folder` : c('Title').t`Rename a file`}
            submit={c('Action').t`Rename`}
            autoFocusClose={false}
            {...rest}
        >
            <Row className="mt1 mb1">
                <Label>{isFolder ? c('Label').t`Folder name` : c('Label').t`File name`}</Label>
                <Field>
                    <Input
                        id="link-name"
                        value={name}
                        autoFocus
                        maxLength={MAX_NAME_LENGTH}
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

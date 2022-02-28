import { useState, ChangeEvent, FocusEvent } from 'react';
import { c } from 'ttag';

import { FormModal, InputTwo, Row, Label, Field, useLoading } from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

import { useActions, validateLinkNameField, formatLinkName } from '../store';
import useActiveShare from '../hooks/drive/useActiveShare';

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

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async () => {
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

    const validationError = validateLinkNameField(folderName);

    return (
        <FormModal
            onClose={onClose}
            loading={loading}
            onSubmit={() => withLoading(handleSubmit()).catch(noop)}
            title={c('Title').t`Create a new folder`}
            submit={c('Action').t`Create`}
            autofocusclose="false"
            {...rest}
        >
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
        </FormModal>
    );
};

export default CreateFolderModal;

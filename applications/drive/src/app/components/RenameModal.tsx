import { useState, ChangeEvent, FocusEvent } from 'react';
import { c } from 'ttag';

import { FormModal, InputTwo, Row, Label, Field, useLoading } from '@proton/components';
import { noop } from '@proton/shared/lib/helpers/function';
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

import { useActions, validateLinkNameField, formatLinkName, splitLinkName } from '../store';

interface Props {
    shareId: string;
    onClose?: () => void;
    item: FileBrowserItem;
}

const RenameModal = ({ shareId, item, onClose, ...rest }: Props) => {
    const { renameLink } = useActions();
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

        await renameLink(new AbortController().signal, shareId, item.LinkID, formattedName);
        onClose?.();
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
            autofocusclose="false"
            {...rest}
        >
            <Row className="mt1 mb1">
                <Label>{isFolder ? c('Label').t`Folder name` : c('Label').t`File name`}</Label>
                <Field>
                    <InputTwo
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

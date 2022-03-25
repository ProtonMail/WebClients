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
import { LinkType } from '@proton/shared/lib/interfaces/drive/link';
import { FileBrowserItem } from '@proton/shared/lib/interfaces/drive/fileBrowser';
import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';

import { useActions, validateLinkNameField, formatLinkName, splitLinkName } from '../store';

interface Props {
    shareId: string;
    onClose?: () => void;
    item: FileBrowserItem;
    open?: boolean;
}

const RenameModal = ({ shareId, item, onClose, open }: Props) => {
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

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedName = formatLinkName(name);
        setName(formattedName);

        await renameLink(new AbortController().signal, shareId, item.LinkID, formattedName);
        onClose?.();
    };

    const isFolder = item.Type === LinkType.FOLDER;
    const validationError = validateLinkNameField(name);

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            open={open}
            size="large"
        >
            <ModalTwoHeader
                closeButtonProps={{ disabled: loading }}
                title={isFolder ? c('Title').t`Rename a folder` : c('Title').t`Rename a file`}
            />
            <ModalTwoContent>
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
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" loading={loading}>
                    {c('Action').t`Rename`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default RenameModal;

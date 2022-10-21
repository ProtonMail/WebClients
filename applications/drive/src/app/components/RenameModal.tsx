import React, { ChangeEvent, FocusEvent, useState } from 'react';

import { c } from 'ttag';

import {
    Button,
    Field,
    InputTwo,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    Row,
    useLoading,
} from '@proton/components';
import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';
import noop from '@proton/utils/noop';

import { DecryptedLink, formatLinkName, splitLinkName, useActions, validateLinkNameField } from '../store';

interface Props {
    onClose?: () => void;
    item: DecryptedLink;
    open?: boolean;
}

const RenameModal = ({ item, onClose, open }: Props) => {
    const { renameLink } = useActions();
    const [name, setName] = useState(item.name);
    const [loading, withLoading] = useLoading();
    const [autofocusDone, setAutofocusDone] = useState(false);

    const selectNamePart = (e: FocusEvent<HTMLInputElement>) => {
        if (autofocusDone) {
            return;
        }
        setAutofocusDone(true);
        const [namePart] = splitLinkName(item.name);
        if (!namePart || !item.isFile) {
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

        await renameLink(new AbortController().signal, item.rootShareId, item.linkId, formattedName);
        onClose?.();
    };

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
                title={!item.isFile ? c('Title').t`Rename a folder` : c('Title').t`Rename a file`}
            />
            <ModalTwoContent>
                <Row className="mt1 mb1">
                    <Label>{!item.isFile ? c('Label').t`Folder name` : c('Label').t`File name`}</Label>
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

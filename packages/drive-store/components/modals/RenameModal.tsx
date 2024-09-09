import type { ChangeEvent, FocusEvent } from 'react';
import { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import type { ModalStateProps } from '@proton/components';
import {
    Field,
    InputFieldTwo,
    Label,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    Row,
    useModalTwoStatic,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import type { DecryptedLink } from '../../store';
import { formatLinkName, splitLinkName, useActions, validateLinkNameField } from '../../store';

interface Props {
    onClose?: () => void;
    item: DecryptedLink;
}

const RenameModal = ({ item, onClose, ...modalProps }: Props & ModalStateProps) => {
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

    const ac = new AbortController();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const formattedName = formatLinkName(name);
        setName(formattedName);

        await renameLink(ac.signal, item.rootShareId, item.linkId, formattedName);
        onClose?.();
    };

    const validationError = validateLinkNameField(name);

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            size="large"
            {...modalProps}
        >
            <ModalTwoHeader
                closeButtonProps={{ disabled: loading }}
                title={!item.isFile ? c('Title').t`Rename a folder` : c('Title').t`Rename a file`}
            />
            <ModalTwoContent>
                <Row className="my-4">
                    <Label>{!item.isFile ? c('Label').t`Folder name` : c('Label').t`File name`}</Label>
                    <Field>
                        <InputFieldTwo
                            id="link-name"
                            value={name}
                            autoFocus
                            placeholder={c('Placeholder').t`New name`}
                            onChange={handleChange}
                            onBlur={handleBlur}
                            onFocus={selectNamePart}
                            error={validationError}
                            required
                            data-testid="input-rename"
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

export const useRenameModal = () => {
    return useModalTwoStatic(RenameModal);
};

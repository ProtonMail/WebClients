import React, { ChangeEvent, FocusEvent, useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    PrimaryButton,
    useFormErrors,
    useLoading,
} from '@proton/components';
import { MAX_NAME_LENGTH } from '@proton/shared/lib/drive/constants';
import noop from '@proton/utils/noop';

import useActiveShare from '../hooks/drive/useActiveShare';
import { formatLinkName, useActions, validateLinkNameField } from '../store';

interface Props {
    onClose?: () => void;
    folder?: { shareId: string; linkId: string };
    open?: boolean;
}

const CreateFileModal = ({ onClose, folder, open }: Props) => {
    const { activeFolder } = useActiveShare();
    const { createFile } = useActions();
    const [fileName, setFileName] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();

    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFileName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFileName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        let formattedName = formatLinkName(fileName);
        if (!formattedName.includes('.')) {
            formattedName = `${formattedName}.txt`;
        }

        const parentFolder = folder || activeFolder;
        if (!parentFolder) {
            return;
        }

        await createFile(parentFolder.shareId, parentFolder.linkId, formattedName);
        onClose?.();
    };

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            open={open}
            size="large"
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={c('Title').t`Create a new file`} />
            <ModalTwoContent>
                <InputFieldTwo
                    id="file-name"
                    autoFocus
                    maxLength={MAX_NAME_LENGTH}
                    value={fileName}
                    label={c('Label').t`File name`}
                    placeholder={c('Placeholder').t`Enter a new file name`}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={validator([validateLinkNameField(fileName) || ''])}
                    required
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <PrimaryButton type="submit" loading={loading}>
                    {c('Action').t`Create`}
                </PrimaryButton>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

export default CreateFileModal;

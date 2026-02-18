import type { ChangeEvent, FocusEvent } from 'react';
import React, { useState } from 'react';

import { c } from 'ttag';

import { Button } from '@proton/atoms/Button/Button';
import type { ModalStateProps } from '@proton/components';
import {
    InputFieldTwo,
    ModalTwo,
    ModalTwoContent,
    ModalTwoFooter,
    ModalTwoHeader,
    useFormErrors,
    useModalTwoStatic,
} from '@proton/components';
import { useLoading } from '@proton/hooks';
import noop from '@proton/utils/noop';

import { validateLinkNameField } from '../../utils/validation/validation';

const formatLinkName = (str: string) => str.trim();

interface Props {
    onClose?: () => void;
    folder?: { shareId: string; linkId: string };
    createFolder?: (abortSignal: AbortSignal, shareId: string, parentLinkId: string, name: string) => Promise<string>;
    parentFolderUid?: string;
    onSuccess?: ({ uid, nodeId, name }: { uid?: string; nodeId: string; name: string }) => void;
}

const CreateFolderModalDeprecated = ({
    createFolder,
    onClose,
    folder,
    parentFolderUid,
    onSuccess,
    ...modalProps
}: Props & ModalStateProps) => {
    const [folderName, setFolderName] = useState('');
    const [loading, withLoading] = useLoading();
    const { validator, onFormSubmit } = useFormErrors();
    const handleBlur = ({ target }: FocusEvent<HTMLInputElement>) => {
        setFolderName(formatLinkName(target.value));
    };

    const handleChange = ({ target }: ChangeEvent<HTMLInputElement>) => {
        setFolderName(target.value);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!onFormSubmit()) {
            return;
        }

        const formattedName = formatLinkName(folderName);
        setFolderName(formattedName);

        const parentFolder = folder;
        if (!parentFolder) {
            return;
        }

        if (createFolder) {
            const nodeId = await createFolder(
                new AbortController().signal,
                parentFolder.shareId,
                parentFolder.linkId,
                formattedName
            );
            onSuccess?.({ nodeId, name: formattedName });
        }
        onClose?.();
    };

    return (
        <ModalTwo
            as="form"
            disableCloseOnEscape={loading}
            onClose={onClose}
            onSubmit={(e: React.FormEvent) => withLoading(handleSubmit(e)).catch(noop)}
            size="large"
            {...modalProps}
        >
            <ModalTwoHeader closeButtonProps={{ disabled: loading }} title={c('Title').t`Create a new folder`} />
            <ModalTwoContent>
                <InputFieldTwo
                    id="folder-name"
                    autoFocus
                    value={folderName}
                    label={c('Label').t`Folder name`}
                    placeholder={c('Placeholder').t`Enter a new folder name`}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    error={validator([validateLinkNameField(folderName) || ''])}
                    data-testid="input-new-folder-name"
                    required
                />
            </ModalTwoContent>
            <ModalTwoFooter>
                <Button type="button" onClick={onClose} disabled={loading}>
                    {c('Action').t`Cancel`}
                </Button>
                <Button color="norm" type="submit" loading={loading}>
                    {c('Action').t`Create`}
                </Button>
            </ModalTwoFooter>
        </ModalTwo>
    );
};

// Only used in legacy public page
export const useCreateFolderModalDeprecated = () => useModalTwoStatic(CreateFolderModalDeprecated);

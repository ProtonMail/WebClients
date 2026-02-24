import type { ChangeEvent, FocusEvent } from 'react';
import type React from 'react';
import { useState } from 'react';

import type { ModalStateProps } from '@proton/components';
import { useFormErrors } from '@proton/components';
import { generateNodeUid } from '@proton/drive';
import { uploadManager } from '@proton/drive/modules/upload';

import { useActiveShare } from '../../hooks/drive/useActiveShare';
import { validateLinkNameField } from '../../utils/validation/validation';

export type UseCreateFileModalStateProps = ModalStateProps;
const formatLinkName = (str: string) => str.trim();
export const useCreateFileModalState = ({ onClose, ...modalProps }: UseCreateFileModalStateProps) => {
    const { activeFolder } = useActiveShare();
    const [fileName, setFileName] = useState('');
    const { validator, onFormSubmit } = useFormErrors();

    const inputFieldError = validator([validateLinkNameField(fileName) || '']);

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

        if (!activeFolder) {
            return;
        }

        const parentFolderUid = generateNodeUid(activeFolder.volumeId, activeFolder.linkId);
        const file = new File([], formattedName, { type: 'text/plain' });
        void uploadManager.upload([file], parentFolderUid);
        onClose?.();
    };

    return {
        fileName,
        handleSubmit,
        handleChange,
        handleBlur,
        inputFieldError,
        onClose,
        ...modalProps,
    };
};

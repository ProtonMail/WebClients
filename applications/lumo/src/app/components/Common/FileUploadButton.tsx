import { useCallback, useRef } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';

import { getAcceptAttributeString } from '../../util/filetypes';
import { sendFileUploadEvent } from '../../util/telemetry';

interface FileUploadButtonProps extends Omit<ButtonProps, 'onClick'> {
    onFilesSelected: (files: File[]) => void;
    multiple?: boolean;
    children: React.ReactNode;
}

/**
 * Reusable file upload button component that handles:
 * - Visually hidden file input driven by a styled button
 * - File selection and validation
 * - Telemetry tracking
 * - Consistent styling and behavior
 */
export const FileUploadButton = ({
    onFilesSelected,
    multiple = true,
    children,
    ...buttonProps
}: FileUploadButtonProps) => {
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            if (!e.target.files?.length) return;
            onFilesSelected(Array.from(e.target.files));
            // Clear the input so the same file can be selected again
            e.target.value = '';
        },
        [onFilesSelected]
    );

    const handleClick = useCallback(() => {
        fileInputRef.current?.click();
        sendFileUploadEvent();
    }, []);

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={getAcceptAttributeString()}
                multiple={multiple}
                onChange={handleFileInputChange}
            />
            <Button {...buttonProps} onClick={handleClick}>
                {children}
            </Button>
        </>
    );
};

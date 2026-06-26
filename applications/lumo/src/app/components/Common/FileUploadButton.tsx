import { useCallback, useRef } from 'react';

import type { ButtonProps } from '@proton/atoms/Button/Button';
import { Button } from '@proton/atoms/Button/Button';
import { isIos } from '@proton/shared/lib/helpers/browser';

import { getAcceptAttributeString, getAcceptAttributeStringWithoutImages } from '../../util/filetypes';
import { sendFileUploadEvent } from '../../util/telemetry';

interface FileUploadButtonProps extends Omit<ButtonProps, 'onClick'> {
    onFilesSelected: (files: File[]) => void;
    accept?: string;
    multiple?: boolean;
    children: React.ReactNode;
    /**
     * Whether to use iOS-compatible file acceptance (without images)
     * Defaults to true for iOS devices
     */
    useIosCompatibility?: boolean;
}

/**
 * Reusable file upload button component that handles:
 * - Hidden file input with proper iOS compatibility
 * - File selection and validation
 * - Telemetry tracking
 * - Consistent styling and behavior
 */
export const FileUploadButton = ({
    onFilesSelected,
    accept,
    multiple = true,
    children,
    useIosCompatibility,
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

    // Determine the accept attribute
    const getAcceptAttribute = () => {
        if (accept) return accept;

        // Use iOS compatibility check
        const shouldUseIosCompatibility = useIosCompatibility ?? isIos();
        return shouldUseIosCompatibility ? getAcceptAttributeStringWithoutImages() : getAcceptAttributeString();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept={getAcceptAttribute()}
                multiple={multiple}
                onChange={handleFileInputChange}
            />
            <Button {...buttonProps} onClick={handleClick}>
                {children}
            </Button>
        </>
    );
};

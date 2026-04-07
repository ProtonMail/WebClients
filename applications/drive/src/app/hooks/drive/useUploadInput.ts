import type { ChangeEvent } from 'react';
import { useCallback, useRef } from 'react';

interface UseUploadInputOptions {
    onUpload: (files: FileList) => void;
    forFolders?: boolean;
}

export function useUploadInput({ onUpload, forFolders = false }: UseUploadInputOptions) {
    const inputRef = useRef<HTMLInputElement>(null);

    // Use a callback ref so webkitdirectory is set every time the element mounts,
    // not just once — the <input> can remount when switching between empty/non-empty folder views.
    const setInputRef = useCallback(
        (node: HTMLInputElement | null) => {
            (inputRef as React.MutableRefObject<HTMLInputElement | null>).current = node;
            if (forFolders && node) {
                // React types don't allow `webkitdirectory` but it exists and works
                node.setAttribute('webkitdirectory', 'true');
            }
        },
        [forFolders]
    );

    const handleClick = () => {
        if (!inputRef.current) {
            return;
        }

        inputRef.current.value = '';
        inputRef.current.click();
    };

    const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
        const { files } = e.target;
        if (!files || files.length === 0) {
            return;
        }

        onUpload(files);
    };

    return { inputRef: setInputRef, handleClick, handleChange };
}

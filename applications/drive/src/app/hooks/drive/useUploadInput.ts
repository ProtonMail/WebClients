import type { ChangeEvent } from 'react';
import { useEffect, useRef } from 'react';

interface UseUploadInputOptions {
    onUpload: (files: FileList) => void;
    forFolders?: boolean;
}

export function useUploadInput({ onUpload, forFolders = false }: UseUploadInputOptions) {
    const inputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (forFolders && inputRef.current) {
            inputRef.current.setAttribute('webkitdirectory', 'true');
        }
    }, [forFolders]);

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

    return { inputRef, handleClick, handleChange };
}

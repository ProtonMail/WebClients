import React, { forwardRef, useRef, useEffect, useImperativeHandle, ChangeEvent } from 'react';
import { c } from 'ttag';
import { parseKeyFiles } from 'proton-shared/lib/keys';
import { OpenPGPKey } from 'pmcrypto';
import FileInput, { FileInputHandle } from '../../../components/input/FileInput';

interface Props {
    onFiles: (files: OpenPGPKey[]) => void;
    autoClick?: boolean;
    multiple: boolean;
    className?: string;
}

const SelectKeyFiles = forwardRef<FileInputHandle, Props>(
    ({ onFiles, autoClick = false, multiple = false, className = '' }: Props, ref) => {
        const fileRef = useRef<HTMLInputElement>(null);

        const handleFileImport = ({ target }: ChangeEvent<HTMLInputElement>) => {
            parseKeyFiles(Array.from(target.files as FileList)).then((result) => onFiles(result));
        };

        useEffect(() => {
            if (autoClick) {
                fileRef.current?.click();
            }
        }, [autoClick]);

        useImperativeHandle(ref, () => ({
            click: () => {
                fileRef.current?.click();
            },
        }));

        return (
            <FileInput
                accept=".txt,.asc"
                ref={fileRef}
                className={className}
                multiple={multiple}
                onChange={handleFileImport}
            >
                {c('Select files').t`Upload`}
            </FileInput>
        );
    }
);

export default SelectKeyFiles;

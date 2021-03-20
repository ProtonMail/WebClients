import React, { useRef, useEffect } from 'react';
import { c } from 'ttag';
import { parseKeyFiles } from 'proton-shared/lib/keys';
import { OpenPGPKey } from 'pmcrypto';
import FileInput from '../../../components/input/FileInput';
import useCombinedRefs from '../../../hooks/useCombinedRefs';

interface Props {
    onFiles: (files: OpenPGPKey[]) => void;
    autoClick?: boolean;
    multiple: boolean;
    className?: string;
}

const SelectKeyFiles = (
    { onFiles, autoClick = false, multiple = false, className = '' }: Props,
    ref: React.Ref<HTMLInputElement>
) => {
    const fileRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (autoClick) {
            fileRef.current?.click();
        }
    }, [autoClick]);

    return (
        <FileInput
            accept=".txt,.asc"
            ref={useCombinedRefs(fileRef, ref)}
            className={className}
            multiple={multiple}
            onChange={({ target }) => {
                parseKeyFiles(Array.from(target.files as FileList)).then((result) => onFiles(result));
            }}
        >
            {c('Select files').t`Upload`}
        </FileInput>
    );
};

export default React.forwardRef<HTMLInputElement, Props>(SelectKeyFiles);

import { useRef, useEffect, forwardRef } from 'react';
import { c } from 'ttag';
import { parseKeyFiles } from '@proton/shared/lib/keys';
import { OpenPGPKey } from 'pmcrypto';
import FileInput from '../../../components/input/FileInput';
import useCombinedRefs from '../../../hooks/useCombinedRefs';
import { Color, Shape } from '../../../components/button';

export interface SelectKeyFilesProps {
    onUpload: (keys: OpenPGPKey[]) => void;
    autoClick?: boolean;
    multiple?: boolean;
    className?: string;
    children?: React.ReactNode;
    disabled?: boolean;
    shape?: Shape;
    color?: Color;
}

const SelectKeyFiles = (
    {
        onUpload,
        autoClick = false,
        multiple = false,
        className = '',
        children = c('Select files').t`Upload`,
        disabled,
        shape,
        color,
    }: SelectKeyFilesProps,
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
            onChange={async ({ target }) => {
                const files = Array.from(target.files as FileList);
                const keys = await parseKeyFiles(files);

                onUpload(keys);
            }}
            disabled={disabled}
            shape={shape}
            color={color}
        >
            {children}
        </FileInput>
    );
};

export default forwardRef<HTMLInputElement, SelectKeyFilesProps>(SelectKeyFiles);

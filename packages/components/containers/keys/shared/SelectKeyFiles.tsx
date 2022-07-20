import { useRef, useEffect, forwardRef, ReactNode, Ref } from 'react';
import { c } from 'ttag';
import { ThemeColorUnion } from '@proton/colors';
import { parseKeyFiles, ArmoredKeyWithInfo } from '@proton/shared/lib/keys';

import FileInput from '../../../components/input/FileInput';
import useCombinedRefs from '../../../hooks/useCombinedRefs';
import { Shape } from '../../../components/button';

interface Props {
    onUpload: (keys: ArmoredKeyWithInfo[]) => void;
    autoClick?: boolean;
    multiple?: boolean;
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
    shape?: Shape;
    color?: ThemeColorUnion;
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
    }: Props,
    ref: Ref<HTMLInputElement>
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

export default forwardRef<HTMLInputElement, Props>(SelectKeyFiles);

import type { ReactNode, Ref } from 'react';
import { forwardRef, useEffect, useRef } from 'react';

import { c } from 'ttag';

import type { ButtonLikeShape } from '@proton/atoms';
import type { ThemeColorUnion } from '@proton/colors';
import FileInput from '@proton/components/components/input/FileInput';
import { useCombinedRefs } from '@proton/hooks';
import type { ArmoredKeyWithInfo } from '@proton/shared/lib/keys';
import { parseKeyFiles } from '@proton/shared/lib/keys';

interface Props {
    onUpload: (keys: ArmoredKeyWithInfo[]) => void;
    autoClick?: boolean;
    multiple?: boolean;
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
    shape?: ButtonLikeShape;
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

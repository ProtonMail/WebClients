import { useRef, useEffect, forwardRef, ReactNode, Ref } from 'react';
import { c } from 'ttag';
import { parseRecoveryFiles } from '@proton/shared/lib/recoveryFile/recoveryFile';
import { KEY_FILE_EXTENSION } from '@proton/shared/lib/constants';
import { OpenPGPKey } from 'pmcrypto';
import { KeyWithRecoverySecret } from '@proton/shared/lib/interfaces';
import FileInput from '../../../components/input/FileInput';
import useCombinedRefs from '../../../hooks/useCombinedRefs';
import { Color, Shape } from '../../../components/button';

export interface Props {
    recoverySecrets: KeyWithRecoverySecret[];
    onUpload: (keys: OpenPGPKey[]) => void;
    autoClick?: boolean;
    multiple?: boolean;
    className?: string;
    children?: ReactNode;
    disabled?: boolean;
    shape?: Shape;
    color?: Color;
}

const SelectRecoveryFiles = (
    {
        recoverySecrets,
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
            accept={KEY_FILE_EXTENSION}
            ref={useCombinedRefs(fileRef, ref)}
            className={className}
            multiple={multiple}
            onChange={async ({ target }) => {
                const files = Array.from(target.files as FileList);

                const keys = await parseRecoveryFiles(files, recoverySecrets);

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

export default forwardRef<HTMLInputElement, Props>(SelectRecoveryFiles);

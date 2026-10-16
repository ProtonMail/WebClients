import type { FC, ReactNode } from 'react';

import { c } from 'ttag';

import type { ButtonLikeOwnProps } from '@proton/atoms/Button/ButtonLike';
import AttachedFile from '@proton/components/components/attachedFile/AttachedFile';
import Bordered from '@proton/components/components/container/Bordered';
import Dropzone from '@proton/components/components/dropzone/Dropzone';
import FileInput from '@proton/components/components/input/FileInput';
import { IcFileLines } from '@proton/icons/icons/IcFileLines';
import { isIos } from '@proton/shared/lib/helpers/browser';
import clsx from '@proton/utils/clsx';

import type { ImportFormContext } from '../../hooks/import/useImportForm';
import { ImportProvider, PROVIDER_INFO_MAP } from '../../lib/import/types';

type Props = Pick<ImportFormContext, 'form' | 'dropzone' | 'busy'> & {
    buttonProps?: Pick<ButtonLikeOwnProps, 'shape' | 'color' | 'pill'>;
    illustration?: ReactNode;
};

export const ImportDropzone: FC<Props> = ({ dropzone, busy, form, buttonProps, illustration = null }) => {
    if (!form.values.provider) return null;

    return (
        <Dropzone onDrop={dropzone.onDrop} disabled={busy} border={false} size={form.values.file ? 'small' : 'medium'}>
            <Bordered
                className={clsx([
                    'flex flex-columns justify-center items-center relative p-4 mb-4 rounded border-weak min-h-custom pass-import-upload',
                    form.values.file ? 'pass-import-upload--has-file' : 'border border-3 border-dashed',
                    form.errors.file && 'border-danger',
                ])}
            >
                {form.values.file ? (
                    <AttachedFile
                        file={form.values.file}
                        className={clsx('border-none', busy && 'pointer-events-none')}
                        icon={<IcFileLines />}
                        clear={c('Action').t`Delete`}
                        onClear={() => form.setFieldValue('file', null)}
                        buttonProps={buttonProps}
                    />
                ) : (
                    <div className="flex flex-column gap-4 items-center">
                        {illustration}
                        <FileInput
                            // disable the "accept" attribute on:
                            // - iOS because the "accept" attribute does not support the file extension
                            // - 1Password because it may export a folder ending with .1pif, itself containing the 1pif file we want
                            // so we disable the accept attribute to allow selecting the file and not just the folder (tested on macOS)
                            // - KeePass because KeePassXC's export dialog does not always append the `.xml`
                            // extension, and `accept` cannot express "files with no extension"
                            {...(isIos() ||
                            form.values.provider === ImportProvider.ONEPASSWORD ||
                            form.values.provider === ImportProvider.KEEPASS
                                ? {}
                                : {
                                      accept: PROVIDER_INFO_MAP[form.values.provider].fileExtension
                                          .replace(/(\w+)/g, '.$1')
                                          .replace(/\s/g, ''),
                                  })}
                            onChange={dropzone.onAttach}
                            disabled={busy}
                            shape="solid"
                            color="weak"
                            {...buttonProps}
                        >
                            {c('Action').t`Choose a file or drag it here`}
                        </FileInput>
                    </div>
                )}
            </Bordered>
        </Dropzone>
    );
};
